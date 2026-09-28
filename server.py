#!/usr/bin/env python3
"""
server.py
BillCraft ERP - ローカルWebサーバー ＆ Gemini API セキュアOCRプロキシ
APIキーは .env または環境変数から読み込まれ、クライアントコードには一切露出・送信されません。
"""

import os
import re
import json
import base64
import urllib.request
import urllib.error
import http.server
import socketserver
import webbrowser
import threading
import sys
import uuid
import time

PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_env():
    """カレントディレクトリの .env ファイルから環境変数を読み込む"""
    env_path = os.path.join(BASE_DIR, '.env')
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    if '=' in line:
                        k, v = line.split('=', 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k and not os.environ.get(k):
                            os.environ[k] = v
        except Exception as e:
            print(f"[警告] .env 読み込みエラー: {e}")

load_env()

def get_gemini_api_key():
    return os.environ.get('GEMINI_API_KEY', '').strip()

import time
from datetime import datetime

# ==============================================================================
# 無料枠安全ガード（セーフティリミッター）
# Google AI Studioの無料枠（15 RPM, 1500 RPD）を絶対に超えないよう、さらに厳格に制限
# ==============================================================================
DAILY_CALL_LIMIT = 200  # 1日の最大呼び出し回数（無料枠1500回の13%に設定して完全防壁）
MINUTE_CALL_LIMIT = 10  # 1分間の最大呼び出し回数（無料枠15回の66%に設定）

_api_call_history = []  # タイムスタンプリスト
_today_date_str = ""
_today_call_count = 0

def check_and_record_rate_limit():
    global _today_date_str, _today_call_count, _api_call_history
    now = time.time()
    today = datetime.now().strftime("%Y-%m-%d")

    # 日付変更時のカウンターリセット
    if _today_date_str != today:
        _today_date_str = today
        _today_call_count = 0

    # 1日の安全上限チェック
    if _today_call_count >= DAILY_CALL_LIMIT:
        return False, f"本日のGemini AI無料枠の安全上限（{DAILY_CALL_LIMIT}回/日）に到達しました。意図しない課金を防ぐためAI解析を停止しています。"

    # 1分間の安全上限チェック
    _api_call_history = [t for t in _api_call_history if now - t < 60]
    if len(_api_call_history) >= MINUTE_CALL_LIMIT:
        return False, f"アクセス集中を防止するため、1分間の安全上限（{MINUTE_CALL_LIMIT}回/分）に達しました。10秒ほど待ってから再度お試しください。"

    # カウント加算
    _today_call_count += 1
    _api_call_history.append(now)
    return True, ""

def get_rate_limit_status():
    global _today_date_str, _today_call_count
    today = datetime.now().strftime("%Y-%m-%d")
    if _today_date_str != today:
        _today_date_str = today
        _today_call_count = 0
    return {
        "dailyLimit": DAILY_CALL_LIMIT,
        "dailyUsed": _today_call_count,
        "dailyRemaining": max(0, DAILY_CALL_LIMIT - _today_call_count),
        "minuteLimit": MINUTE_CALL_LIMIT
    }

def call_gemini_vision_ocr(image_base64_data_url):
    """
    Google Gemini AI (最新 Flash モデル) を使用してレシート画像を解析
    無料枠セーフティリミッター付き
    """
    api_key = get_gemini_api_key()
    if not api_key:
        return {"error": "GEMINI_API_KEY が .env に設定されていません。"}

    # 無料枠安全チェック
    allowed, limit_msg = check_and_record_rate_limit()
    if not allowed:
        print(f"[無料枠ガード発動] {limit_msg}")
        return {"error": limit_msg, "isRateLimit": True}

    # Base64 ヘッダー (例: data:image/jpeg;base64,) の除去
    mime_type = "image/jpeg"
    b64_data = image_base64_data_url
    if ',' in image_base64_data_url:
        header, b64_data = image_base64_data_url.split(',', 1)
        mime_match = re.search(r'data:(image\/[a-zA-Z0-9\+\-\.]+);base64', header)
        if mime_match:
            mime_type = mime_match.group(1)

    prompt = (
        "あなたは日本の税務・インボイス制度および経費精算の専門エキスパートです。提供された領収書・レシート画像から、次の項目を極めて厳密かつ慎重に読み取り、指定のJSON形式のみで出力してください。\n\n"
        "【最重要抽出項目】\n"
        "1. payee（支払先・店名・企業名）:\n"
        "   - レシートの最上部、中央、ロゴ、フッター、または社名表記から、発行元の正式名称を読み取ってください。\n"
        "   - 例: 「セブン-イレブン」「ファミリーマート」「ローソン」「出光興産」「ENEOS」「スターバックス」「ヨドバシカメラ」「株式会社〇〇」など。\n"
        "   - チェーン店の場合はブランド名と店舗名を含めてください。\n\n"
        "2. invoiceNumber（インボイス適格請求書登録番号）:\n"
        "   - 「登録番号」「T」「インボイスNo.」「適格請求書」などの記載を探してください。\n"
        "   - 必ず「T」から始まる半角英数字13桁（例: T1234567890123）として抽出してください。\n"
        "   - レシートに登録番号が見当たらない場合は空文字 \"\" としてください。\n\n"
        "3. date（出費日・利用日）:\n"
        "   - YYYY-MM-DD形式（例: 2026-09-25）。年号が省略されている場合は現在の西暦を補完してください。\n\n"
        "4. amount（合計金額）:\n"
        "   - 税込の最終支払総額。数値のみ（カンマなし整数、例: 3500）。\n\n"
        "5. category（勘定科目）:\n"
        "   - 最も適切な勘定科目を以下から厳選: [消耗品費, 旅費交通費, 通信費, 接待交際費, 仕入高, 水道光熱費, 車両費, 広告宣伝費, 地代家賃, 新聞図書費, 福利厚生費, 修繕費, 租税公課, 支払手数料]\n\n"
        "6. taxRate（消費税率）:\n"
        "   - 8（軽減税率対象商品・飲食料品等）または 10（標準税率）。\n\n"
        "7. note（摘要）:\n"
        "   - 主な購入品目やサービス内容の簡潔な要約（例: ガソリン給油、事務用品、会食代等）。\n\n"
        "【出力形式】\n"
        "純粋なJSON文字列のみを出力してください。Markdownのコードブロック(```json)は含めないでください。"
    )

    request_payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": b64_data
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1
        }
    }

    req_json = json.dumps(request_payload).encode('utf-8')

    # 現在のアカウントで動作確認済みの最新Flashモデル順に試行（複数モデルで無料枠を冗長化）
    candidate_models = [
        'gemini-3.6-flash',
        'gemini-flash-latest',
        'gemini-flash-lite-latest',
        'gemini-3.1-flash-lite'
    ]
    last_err = None

    for model in candidate_models:
        for attempt in range(2):  # 各モデル最大2回試行（一時的な過負荷503に対応）
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            req = urllib.request.Request(
                url,
                data=req_json,
                headers={'Content-Type': 'application/json'}
            )

            try:
                with urllib.request.urlopen(req, timeout=20) as res:
                    res_body = res.read().decode('utf-8')
                    parsed_res = json.loads(res_body)
                    candidates = parsed_res.get('candidates', [])
                    if candidates and 'content' in candidates[0]:
                        parts = candidates[0]['content'].get('parts', [])
                        if parts and 'text' in parts[0]:
                            raw_text = parts[0]['text'].strip()
                            raw_text = re.sub(r'^```json\s*', '', raw_text)
                            raw_text = re.sub(r'\s*```$', '', raw_text)
                            ocr_data = json.loads(raw_text)

                            # インボイス番号の正規化（Tが付いていない13桁数字の場合はTを自動補完）
                            inv = str(ocr_data.get('invoiceNumber', '')).strip()
                            if re.match(r'^\d{13}$', inv):
                                ocr_data['invoiceNumber'] = f"T{inv}"
                            elif inv.startswith('t'):
                                ocr_data['invoiceNumber'] = f"T{inv[1:]}"

                            ocr_data["engine"] = model
                            print(f"[Gemini OCR 成功] モデル: {model} | 支払先: {ocr_data.get('payee')} | インボイス: {ocr_data.get('invoiceNumber')} | 金額: ¥{ocr_data.get('amount')}")
                            return ocr_data
            except urllib.error.HTTPError as e:
                err_msg = e.read().decode('utf-8', errors='ignore')
                print(f"[Gemini API HTTP Error ({model}, 試行{attempt+1})] {e.code}: {err_msg}")
                last_err = f"Gemini APIエラー ({e.code}): {err_msg}"
                if e.code == 503 and attempt == 0:
                    time.sleep(1.5)  # 一時的混雑時は1.5秒待機してリトライ
                    continue
                break
            except Exception as e:
                print(f"[Gemini API Error ({model}, 試行{attempt+1})] {e}")
                last_err = str(e)
                break

    return {"error": f"Gemini APIでの解析に失敗しました: {last_err}"}


DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# カテゴリ別専用ディレクトリ
MASTERS_DIR = os.path.join(DATA_DIR, 'masters')
COMPANY_DIR = os.path.join(DATA_DIR, 'company')
ATTENDANCE_DIR = os.path.join(DATA_DIR, 'attendance')
RECEIPTS_DIR = os.path.join(DATA_DIR, 'receipts')
BACKUPS_DIR = os.path.join(DATA_DIR, 'backups')

for d in [MASTERS_DIR, COMPANY_DIR, ATTENDANCE_DIR, RECEIPTS_DIR, BACKUPS_DIR]:
    os.makedirs(d, exist_ok=True)

ITEMS_MASTER_FILE = os.path.join(MASTERS_DIR, 'items_master.json')
CLIENTS_MASTER_FILE = os.path.join(MASTERS_DIR, 'clients_master.json')
ISSUER_FILE = os.path.join(COMPANY_DIR, 'issuer_profile.json')
ATTENDANCE_FILE = os.path.join(ATTENDANCE_DIR, 'attendance.json')
ATTENDANCE_EMPLOYEE_FILE = os.path.join(ATTENDANCE_DIR, 'attendance_employee.json')

def migrate_legacy_data_files():
    """data/直下に残っている旧ファイルを各カテゴリ専用フォルダへ自動移動"""
    import shutil
    legacy_map = [
        (os.path.join(DATA_DIR, 'items_master.json'), ITEMS_MASTER_FILE),
        (os.path.join(DATA_DIR, 'clients_master.json'), CLIENTS_MASTER_FILE),
        (os.path.join(DATA_DIR, 'issuer_profile.json'), ISSUER_FILE),
        (os.path.join(DATA_DIR, 'attendance.json'), ATTENDANCE_FILE),
        (os.path.join(DATA_DIR, 'attendance_employee.json'), ATTENDANCE_EMPLOYEE_FILE),
    ]
    for old_path, new_path in legacy_map:
        if os.path.exists(old_path) and not os.path.exists(new_path):
            try:
                shutil.move(old_path, new_path)
                print(f"[データ自動移行] {os.path.basename(old_path)} -> {os.path.relpath(new_path, DATA_DIR)}")
            except Exception as e:
                print(f"[データ移行エラー] {old_path}: {e}")

migrate_legacy_data_files()

DEFAULT_ATTENDANCE = []
DEFAULT_ATTENDANCE_EMPLOYEE = {
    "empNo": "1111",
    "empName": "宮崎真輔"
}

DEFAULT_ISSUER = {
    "name": "株式会社サンプル商事",
    "invoiceNumber": "T1234567890123",
    "zip": "100-0001",
    "address": "東京都千代田区千代田1-1 サンプルビル 5F",
    "tel": "03-1234-5678",
    "fax": "03-1234-5679",
    "email": "info@sample.example.com",
    "bankInfo": "みずほ銀行 東京中央支店 (店番: 001)\n普通預金 1234567\n口座名義: カ) サンプルショウジ",
    "stampDataUrl": "",
    "showStamp": True
}

DEFAULT_ITEMS = [
    {
        "id": "item_mst_1",
        "name": "製品基本セット（一式）",
        "unitPrice": 83333,
        "userPrice": 110000,
        "unit": "式",
        "taxRate": 10,
        "note": "標準構成一式",
        "usageCount": 10
    },
    {
        "id": "item_mst_2",
        "name": "システム導入・初期設定作業費",
        "unitPrice": 37879,
        "userPrice": 50000,
        "unit": "回",
        "taxRate": 10,
        "note": "現地作業含む",
        "usageCount": 7
    },
    {
        "id": "item_mst_3",
        "name": "月額保守サポート（1ヶ月）",
        "unitPrice": 15152,
        "userPrice": 20000,
        "unit": "月",
        "taxRate": 10,
        "note": "リモート対応",
        "usageCount": 5
    },
    {
        "id": "item_mst_4",
        "name": "交換用消耗部品セット",
        "unitPrice": 7576,
        "userPrice": 10000,
        "unit": "組",
        "taxRate": 10,
        "note": "型番: SP-01",
        "usageCount": 2
    }
]

DEFAULT_CLIENTS = [
    {
        "id": "client_mst_1",
        "name": "株式会社サンプル",
        "code": "C001",
        "honorific": "御中",
        "zip": "100-0001",
        "address": "東京都千代田区千代田1-1",
        "contactPerson": "総務部 田中 様",
        "tel": "03-1111-2222",
        "email": "tanaka@sample.example.jp",
        "invoiceNumber": "",
        "category": "customer",
        "closingDay": "末日",
        "paymentTerms": "翌月末",
        "note": "基本取引先。請求書は郵送およびPDF送付",
        "usageCount": 12
    },
    {
        "id": "client_mst_2",
        "name": "株式会社テクノロジー",
        "code": "C002",
        "honorific": "御中",
        "zip": "108-0075",
        "address": "東京都港区港南2-15-1",
        "contactPerson": "IT推進室 鈴木 様",
        "tel": "03-3333-4444",
        "email": "suzuki@tech.example.jp",
        "invoiceNumber": "T2010001099887",
        "category": "customer",
        "closingDay": "20日",
        "paymentTerms": "当月末",
        "note": "システム開発関連プロジェクト",
        "usageCount": 8
    },
    {
        "id": "client_mst_3",
        "name": "サンプル石油株式会社",
        "code": "V001",
        "honorific": "御中",
        "zip": "100-0002",
        "address": "東京都千代田区皇居外苑1-1",
        "contactPerson": "",
        "tel": "03-0000-0001",
        "email": "",
        "invoiceNumber": "T1000000000001",
        "category": "vendor",
        "closingDay": "都度",
        "paymentTerms": "即時（法人カード）",
        "note": "社用車ガソリン給油",
        "usageCount": 5
    },
    {
        "id": "client_mst_4",
        "name": "サンプル運送株式会社",
        "code": "V002",
        "honorific": "御中",
        "zip": "100-0003",
        "address": "東京都千代田区霞が関1-1",
        "contactPerson": "",
        "tel": "03-0000-0002",
        "email": "",
        "invoiceNumber": "T1000000000002",
        "category": "vendor",
        "closingDay": "都度",
        "paymentTerms": "即時決済",
        "note": "書類・資材配送便",
        "usageCount": 4
    },
    {
        "id": "client_mst_5",
        "name": "サンプルパーキング株式会社",
        "code": "V003",
        "honorific": "御中",
        "zip": "100-0004",
        "address": "東京都千代田区永田町1-1",
        "contactPerson": "",
        "tel": "03-0000-0003",
        "email": "",
        "invoiceNumber": "T1000000000003",
        "category": "vendor",
        "closingDay": "都度",
        "paymentTerms": "現地精算",
        "note": "コインパーキング利用",
        "usageCount": 3
    }
]

def load_json_file(filepath, default_data):
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[警告] ファイル読み込み失敗 ({filepath}): {e}")
    # ファイルがない場合は初期データを書き込んで返す
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(default_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[警告] 初期ファイル作成失敗 ({filepath}): {e}")
    return default_data

def save_json_file_with_backup(filepath, data, backup_prefix="backup"):
    try:
        # まずファイルへ保存
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        # バックアップも保存（直近の安全確保）
        now_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(BACKUPS_DIR, f"{backup_prefix}_{now_str}.json")
        with open(backup_path, 'w', encoding='utf-8') as bf:
            json.dump(data, bf, ensure_ascii=False, indent=2)
        return True, ""
    except Exception as e:
        return False, str(e)



class BillCraftHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # キャッシュ無効化ヘッダーを付与
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path == '/api/status':
            api_key = get_gemini_api_key()
            has_key = bool(api_key and len(api_key) > 5)
            rate_info = get_rate_limit_status()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            res_data = {
                "hasGeminiKey": has_key,
                "model": "gemini-flash-latest",
                "rateLimit": rate_info,
                "message": f"Gemini AI有効（本日残り {rate_info['dailyRemaining']}回/無料安全モード）" if has_key else "GEMINI_API_KEY未設定"
            }
            self.wfile.write(json.dumps(res_data, ensure_ascii=False).encode('utf-8'))
            return

        # 領収書写真の配信エンドポイント: /api/receipt/<id>
        if self.path.startswith('/api/receipt/'):
            receipt_id = self.path[len('/api/receipt/'):].split('?')[0].strip()
            # サニタイズ
            clean_id = re.sub(r'[^a-zA-Z0-9_\-]', '', receipt_id)
            img_path = None
            for ext in ['.jpg', '.jpeg', '.png', '.webp']:
                candidate = os.path.join(RECEIPTS_DIR, f"{clean_id}{ext}")
                if os.path.exists(candidate):
                    img_path = candidate
                    break
            
            # 特別エイリアス（ENEOS等のサンプル画像）
            if not img_path:
                if 'eneos' in clean_id.lower():
                    img_path = os.path.join(RECEIPTS_DIR, 'eneos_sample.jpg')
                elif 'post' in clean_id.lower() or 'mail' in clean_id.lower():
                    img_path = os.path.join(RECEIPTS_DIR, 'post_sample.png')
                elif 'times' in clean_id.lower():
                    img_path = os.path.join(RECEIPTS_DIR, 'times_sample.png')

            if img_path and os.path.exists(img_path):
                self.send_response(200)
                content_type = 'image/png' if img_path.endswith('.png') else 'image/jpeg'
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Disposition', 'inline; filename="receipt.jpg"')
                self.end_headers()
                with open(img_path, 'rb') as f:
                    self.wfile.write(f.read())
                return
        # 商品マスタ取得API
        if self.path == '/api/master/items':
            items = load_json_file(ITEMS_MASTER_FILE, DEFAULT_ITEMS)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(items, ensure_ascii=False).encode('utf-8'))
            return

        # 取引先マスタ取得API
        if self.path == '/api/master/clients':
            clients = load_json_file(CLIENTS_MASTER_FILE, DEFAULT_CLIENTS)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(clients, ensure_ascii=False).encode('utf-8'))
            return

        # 自社プロファイル・振込先情報 取得API
        if self.path == '/api/issuer':
            issuer_data = load_json_file(ISSUER_FILE, DEFAULT_ISSUER)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(issuer_data, ensure_ascii=False).encode('utf-8'))
            return

        # 勤怠打刻データ取得API
        if self.path == '/api/attendance':
            att_data = load_json_file(ATTENDANCE_FILE, DEFAULT_ATTENDANCE)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(att_data, ensure_ascii=False).encode('utf-8'))
            return

        # 勤怠社員情報取得API
        if self.path == '/api/attendance/employee':
            emp_data = load_json_file(ATTENDANCE_EMPLOYEE_FILE, DEFAULT_ATTENDANCE_EMPLOYEE)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(emp_data, ensure_ascii=False).encode('utf-8'))
            return

        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/ocr':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(post_data)
                image_data = data.get('image', '')
                if not image_data:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "画像データが提供されていません"}).encode('utf-8'))
                    return

                # Gemini API を呼び出し（保存は経費登録時に確定するため、ここではディスク書き込みせずメモリ処理）
                ocr_result = call_gemini_vision_ocr(image_data)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(ocr_result, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"サーバーエラー: {str(e)}"}).encode('utf-8'))
            return

        # 領収書写真の安全保管API（経費データと1対1で保存）
        if self.path == '/api/save-receipt':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(post_data)
                receipt_id = data.get('id', '')
                image_data = data.get('image', '')
                if not receipt_id or not image_data:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "IDまたは画像データがありません"}).encode('utf-8'))
                    return

                clean_id = re.sub(r'[^a-zA-Z0-9_\-]', '', receipt_id)
                target_path = os.path.join(RECEIPTS_DIR, f"{clean_id}.jpg")
                b64_img = image_data
                if ',' in image_data:
                    _, b64_img = image_data.split(',', 1)
                
                with open(target_path, 'wb') as f:
                    f.write(base64.b64decode(b64_img))

                print(f"[領収書写真 保存] 経費ID: {clean_id} -> {target_path}")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                res = {
                    "success": True,
                    "id": clean_id,
                    "url": f"/api/receipt/{clean_id}",
                    "message": "領収書写真が正常に保管されました"
                }
                self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # 領収書写真の削除API（登録削除に連動して物理ファイルを削除）
        if self.path == '/api/delete-receipt':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(post_data)
                receipt_id = data.get('id', '')
                receipt_url = data.get('receiptUrl', '')

                # 削除対象の候補IDを抽出
                target_ids = []
                if receipt_id:
                    target_ids.append(re.sub(r'[^a-zA-Z0-9_\-]', '', receipt_id))
                if receipt_url and '/api/receipt/' in receipt_url:
                    url_id = receipt_url.split('/api/receipt/')[-1].split('?')[0]
                    target_ids.append(re.sub(r'[^a-zA-Z0-9_\-]', '', url_id))

                deleted_files = []
                for cid in target_ids:
                    # サンプル画像は保護
                    if cid.lower() in ['eneos_sample', 'post_sample', 'times_sample']:
                        continue
                    for ext in ['.jpg', '.jpeg', '.png', '.webp']:
                        candidate = os.path.join(RECEIPTS_DIR, f"{cid}{ext}")
                        if os.path.exists(candidate):
                            try:
                                os.remove(candidate)
                                deleted_files.append(f"{cid}{ext}")
                                print(f"[領収書写真 削除成功] {candidate}")
                            except Exception as rm_err:
                                print(f"[領収書写真 削除エラー] {rm_err}")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "deleted": deleted_files,
                    "message": f"{len(deleted_files)}件の写真を削除しました"
                }, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # 登録済み経費と写真の1対1整合性同期API（孤立した不要写真の一括自動掃除）
        if self.path == '/api/sync-receipts':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(post_data)
                active_ids = set()
                for aid in data.get('activeIds', []):
                    clean = re.sub(r'[^a-zA-Z0-9_\-]', '', str(aid))
                    if clean:
                        active_ids.add(clean)

                keep_samples = data.get('keepSamples', True)
                sample_names = {'eneos_sample', 'post_sample', 'times_sample'}

                deleted = []
                for filename in os.listdir(RECEIPTS_DIR):
                    if filename.startswith('.'):
                        continue
                    name_without_ext, _ = os.path.splitext(filename)
                    if keep_samples and name_without_ext.lower() in sample_names:
                        continue
                    if name_without_ext not in active_ids:
                        target = os.path.join(RECEIPTS_DIR, filename)
                        try:
                            os.remove(target)
                            deleted.append(filename)
                            print(f"[領収書同期 クリーンアップ削除] 孤立ファイル: {filename}")
                        except Exception as sync_err:
                            print(f"[領収書同期 エラー] {sync_err}")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "deletedCount": len(deleted),
                    "deletedFiles": deleted,
                    "remainingCount": len(os.listdir(RECEIPTS_DIR))
                }, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # 商品マスタ保存API
        if self.path == '/api/master/items':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                items_data = json.loads(post_data)
                if not isinstance(items_data, list):
                    raise ValueError("データ形式が配列ではありません")
                success, err = save_json_file_with_backup(ITEMS_MASTER_FILE, items_data, "items_master")
                if not success:
                    raise Exception(err)
                print(f"[商品マスタ 保存成功] 件数: {len(items_data)}件 -> {ITEMS_MASTER_FILE}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "count": len(items_data)}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # 取引先マスタ保存API
        if self.path == '/api/master/clients':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                clients_data = json.loads(post_data)
                if not isinstance(clients_data, list):
                    raise ValueError("データ形式が配列ではありません")
                success, err = save_json_file_with_backup(CLIENTS_MASTER_FILE, clients_data, "clients_master")
                if not success:
                    raise Exception(err)
                print(f"[取引先マスタ 保存成功] 件数: {len(clients_data)}件 -> {CLIENTS_MASTER_FILE}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "count": len(clients_data)}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # 自社プロファイル・振込先情報 保存API
        if self.path == '/api/issuer':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                issuer_data = json.loads(post_data)
                success, err = save_json_file_with_backup(ISSUER_FILE, issuer_data, "issuer_profile")
                if not success:
                    raise Exception(err)
                print(f"[自社プロファイル 保存成功] 振込先あり: {bool(issuer_data.get('bankInfo'))} -> {ISSUER_FILE}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # 勤怠打刻データ保存API
        if self.path == '/api/attendance':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                att_data = json.loads(post_data)
                if not isinstance(att_data, list):
                    raise ValueError("データ形式が配列ではありません")
                success, err = save_json_file_with_backup(ATTENDANCE_FILE, att_data, "attendance")
                if not success:
                    raise Exception(err)
                print(f"[勤怠データ 保存成功] 件数: {len(att_data)}件 -> {ATTENDANCE_FILE}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "count": len(att_data)}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # 勤怠社員情報保存API
        if self.path == '/api/attendance/employee':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                emp_data = json.loads(post_data)
                success, err = save_json_file_with_backup(ATTENDANCE_EMPLOYEE_FILE, emp_data, "attendance_employee")
                if not success:
                    raise Exception(err)
                print(f"[勤怠社員情報 保存成功] 氏名: {emp_data.get('empName')} -> {ATTENDANCE_EMPLOYEE_FILE}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

    def do_DELETE(self):
        # 勤怠打刻データ 個別削除API
        if self.path.startswith('/api/attendance'):
            try:
                import urllib.parse
                parsed = urllib.parse.urlparse(self.path)
                params = urllib.parse.parse_qs(parsed.query)
                target_date = params.get('date', [None])[0]
                target_id = params.get('id', [None])[0]

                current = load_json_file(ATTENDANCE_FILE, DEFAULT_ATTENDANCE)
                before_len = len(current)
                filtered = [
                    a for a in current
                    if (not target_date or a.get('date') != target_date) and (not target_id or a.get('id') != target_id)
                ]
                deleted_count = before_len - len(filtered)
                success, err = save_json_file_with_backup(ATTENDANCE_FILE, filtered, "attendance")
                if not success:
                    raise Exception(err)
                print(f"[勤怠データ 削除成功] 削除件数: {deleted_count}件, 残り: {len(filtered)}件 -> {ATTENDANCE_FILE}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "deletedCount": deleted_count,
                    "remainingCount": len(filtered)
                }, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()


def open_browser():
    webbrowser.open(f'http://localhost:{PORT}')


if __name__ == '__main__':
    print("=" * 60)
    print(" BillCraft ERP - ローカルサーバー起動中")
    print(f" URL: http://localhost:{PORT}")
    has_key = bool(get_gemini_api_key())
    if has_key:
        print(" [AI OCR] Gemini API連携: 有効 (Gemini 3.6/Flash マルチモデル・無料枠ガード付き)")
    else:
        print(" [AI OCR] Gemini API連携: 未設定 (.env に GEMINI_API_KEY を設定可能)")
    print(" 終了するには Ctrl+C を押してください")
    print("=" * 60)

    threading.Timer(0.8, open_browser).start()

    try:
        with socketserver.TCPServer(('', PORT), BillCraftHandler) as httpd:
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"[情報] ポート {PORT} は既に使用中です。ブラウザを開きます...")
            webbrowser.open(f'http://localhost:{PORT}')
        else:
            raise e
