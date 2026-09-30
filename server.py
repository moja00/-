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
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b'
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
INVENTORY_DIR = os.path.join(DATA_DIR, 'inventory')
PAYROLL_DIR = os.path.join(DATA_DIR, 'payroll')
INVOICES_DIR = os.path.join(DATA_DIR, 'invoices')
EXPENSES_DIR = os.path.join(DATA_DIR, 'expenses')
BACKUPS_DIR = os.path.join(DATA_DIR, 'backups')

for d in [MASTERS_DIR, COMPANY_DIR, ATTENDANCE_DIR, RECEIPTS_DIR, INVENTORY_DIR, PAYROLL_DIR, INVOICES_DIR, EXPENSES_DIR, BACKUPS_DIR]:
    os.makedirs(d, exist_ok=True)

ITEMS_MASTER_FILE = os.path.join(MASTERS_DIR, 'items_master.json')
CLIENTS_MASTER_FILE = os.path.join(MASTERS_DIR, 'clients_master.json')
ISSUER_FILE = os.path.join(COMPANY_DIR, 'issuer_profile.json')
ATTENDANCE_FILE = os.path.join(ATTENDANCE_DIR, 'attendance.json')
ATTENDANCE_EMPLOYEE_FILE = os.path.join(ATTENDANCE_DIR, 'attendance_employee.json')
INVENTORY_FILE = os.path.join(INVENTORY_DIR, 'inventory.json')
PURCHASE_MAPPINGS_FILE = os.path.join(INVENTORY_DIR, 'purchase_mappings.json')
PAYROLL_RECORDS_FILE = os.path.join(PAYROLL_DIR, 'payroll_records.json')
PAYROLL_SETTINGS_FILE = os.path.join(PAYROLL_DIR, 'payroll_settings.json')
PREVIOUS_YEAR_INCOME_FILE = os.path.join(PAYROLL_DIR, 'previous_year_income.json')
INVOICES_HISTORY_FILE = os.path.join(INVOICES_DIR, 'invoices_history.json')
ACTIVE_DOC_FILE = os.path.join(INVOICES_DIR, 'active_doc.json')
EXPENSES_FILE = os.path.join(EXPENSES_DIR, 'expenses.json')

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
    "empNo": "2",
    "empName": "宮崎真輔"
}

DEFAULT_PAYROLL_SETTINGS = {
    "empNo": "2",
    "empName": "宮崎真輔",
    "companyName": "株式会社アルバワークス",
    "salaryType": "monthly",
    "baseSalary": 200000,
    "isChildcareLeave": True,
    "childcareStartDate": "2026-03-14",
    "childcareEndDate": "2027-03-31",
    "childcareExemptSocialInsurance": True,
    "dailyWageCalculationType": "proRata",
    "dailyWageUnit": 10000,
    "monthlyStandardDays": 20,
    "monthlyStandardHours": 140.0,
    "overtimeRate": 1.25,
    "overtimeUnitHourly": 1785.456,
    "standardMonthlyRemuneration": 200000,
    "healthInsurance": 9970,
    "welfarePension": 18300,
    "nursingInsurance": 1590,
    "employmentInsuranceFixed": 1156,
    "employmentInsuranceRate": 0.0055,
    "useFixedEmploymentInsurance": False,
    "dependentsCount": 0,
    "residentTax": 3500,
    "allowanceExecutive": 0,
    "allowanceQualification": 0,
    "allowanceHousing": 0,
    "allowanceFamily": 0,
    "allowanceCommuteNonTax": 0,
    "allowanceNonTaxOther": 10000,
    "closingDay": "末日",
    "paymentDay": "翌月10日",
    "birthDate": "1981-11-12",
    "prefecture": "群馬県"
}

DEFAULT_PREVIOUS_YEAR_INCOME = {
    "targetYear": 2025,
    "empNo": "2",
    "empName": "宮崎真輔",
    "companyName": "株式会社アルバワークス",
    "annualGrossSalary": 2400000,
    "socialInsuranceDeduction": 0,
    "basicDeduction": 430000,
    "dependentsDeduction": 0,
    "spouseDeduction": 0,
    "otherDeductions": 0,
    "residentTaxMonthlyJune": 0,
    "residentTaxMonthlyRegular": 0,
    "annualResidentTaxTotal": 0,
    "monthlyRecords": [],
    "notes": "前年の給与明細・源泉徴収票データ（受取後に詳細登録可能）"
}

DEFAULT_PAYROLL_RECORDS = [
    {
        "id": "pay_2025-07",
        "targetMonth": "2025-07",
        "empNo": "2",
        "empName": "宮崎真輔",
        "companyName": "株式会社アルバワークス",
        "workDaysStandard": 21,
        "workDaysActual": 21,
        "workHoursStandard": 147.0,
        "absenceDays": 0,
        "holidayWorkDays": 0,
        "paidLeaveDays": 0,
        "overtimeHours": 9.97,
        "midnightOvertimeHours": 0.0,
        "lateEarlyHours": 0.0,
        "paidLeaveRemaining": 0.0,
        "baseSalary": 200000,
        "allowanceExecutive": 0,
        "allowanceQualification": 0,
        "allowanceHousing": 0,
        "allowanceFamily": 0,
        "overtimePay": 17801,
        "allowanceCommuteNonTax": 0,
        "allowanceNonTaxOther": 0,
        "midnightPay": 0,
        "holidayPay": 0,
        "totalNonTax": 0,
        "totalTaxable": 217801,
        "totalGross": 217801,
        "healthInsurance": 9970,
        "welfarePension": 18300,
        "welfarePensionFund": 0,
        "nursingInsurance": 1590,
        "employmentInsurance": 1100,
        "totalSocialInsurance": 30960,
        "taxableIncome": 186841,
        "incomeTax": 3340,
        "residentTax": 0,
        "mutualAid": 0,
        "totalTax": 3340,
        "totalDeductions": 34300,
        "netPay": 183501,
        "note": "2025年7月度 給与支給明細書（見本データ）",
        "createdAt": "2025-07-25T10:00:00.000Z",
        "updatedAt": "2025-07-25T10:00:00.000Z"
    }
]

DEFAULT_ISSUER = {
    "name": "株式会社アルバワークス",
    "invoiceNumber": "T2070001004966",
    "zip": "379-2144",
    "address": "群馬県前橋市下川町63-7",
    "tel": "027-289-0367",
    "fax": "027-289-0368",
    "email": "",
    "bankInfo": "高崎信用金庫\n前橋南支店\n普通　012 2182393\nカ)　アルバワークス",
    "stampDataUrl": "",
    "showStamp": True
}

DEFAULT_ITEMS = [
    {
        "id": "prod_1790320521317_adue",
        "name": "DP-MS　スプレッダー",
        "unitPrice": 59612,
        "userPrice": 80000,
        "unit": "個",
        "taxRate": 10,
        "note": "",
        "usageCount": 2,
        "createdAt": "2026-09-25T07:15:21.317Z",
        "updatedAt": "2026-09-28T04:09:29.451Z",
        "lastUsedAt": "2026-09-28T04:09:29.445Z"
    },
    {
        "id": "prod_1790319200414_10bm",
        "name": "DP-MS　メカニカルスプレッダー",
        "unitPrice": 73025,
        "userPrice": 98000,
        "unit": "個",
        "taxRate": 10,
        "note": "",
        "usageCount": 1,
        "createdAt": "2026-09-25T06:53:20.414Z",
        "updatedAt": "2026-09-25T06:53:20.414Z",
        "lastUsedAt": "2026-09-25T06:55:37.851Z"
    },
    {
        "id": "prod_1790319164152_angp",
        "name": "DP-EG　3点引きアタッチメント",
        "unitPrice": 163934,
        "userPrice": 220000,
        "unit": "セット",
        "taxRate": 10,
        "note": "",
        "usageCount": 1,
        "createdAt": "2026-09-25T06:52:44.152Z",
        "updatedAt": "2026-09-25T06:52:44.152Z",
        "lastUsedAt": "2026-09-25T06:55:25.362Z"
    },
    {
        "id": "prod_1790319113830_war6",
        "name": "DP-AC　アクセサリーキット",
        "unitPrice": 176602,
        "userPrice": 237000,
        "unit": "セット",
        "taxRate": 10,
        "note": "",
        "usageCount": 2,
        "createdAt": "2026-09-25T06:51:53.830Z",
        "updatedAt": "2026-09-25T06:51:53.830Z",
        "lastUsedAt": "2026-09-28T02:39:29.185Z"
    },
    {
        "id": "prod_1790317962497_3xgg",
        "name": "DP-5000　ベーシックセット　バッテリー２個",
        "unitPrice": 268257,
        "userPrice": 360000,
        "unit": "式",
        "taxRate": 10,
        "note": "",
        "usageCount": 7,
        "createdAt": "2026-09-25T06:32:42.497Z",
        "lastUsedAt": "2026-09-29T05:06:55.002Z",
        "updatedAt": "2026-09-29T05:06:55.007Z"
    }
]

DEFAULT_CLIENTS = [
    {
        "id": "client_mst_4",
        "name": "日本郵便株式会社 高崎郵便局",
        "code": "V002",
        "honorific": "御中",
        "zip": "370-8799",
        "address": "群馬県高崎市高松町26-1",
        "contactPerson": "",
        "tel": "0570-007-889",
        "email": "",
        "invoiceNumber": "T1010001112577",
        "category": "vendor",
        "closingDay": "都度",
        "paymentTerms": "即時現金・切手",
        "note": "レターパック、書類郵送",
        "usageCount": 5,
        "createdAt": "2026-09-25T06:26:30.325Z"
    },
    {
        "id": "client_1790317751749_imw2",
        "name": "奥村塗料株式会社",
        "code": "",
        "honorific": "御中",
        "zip": "501-6105",
        "address": "岐阜県岐阜市柳津町梅松４丁目１４５番地",
        "contactPerson": "",
        "tel": "",
        "email": "",
        "invoiceNumber": "",
        "category": "customer",
        "closingDay": "末日",
        "paymentTerms": "翌月末",
        "note": "",
        "usageCount": 10,
        "createdAt": "2026-09-25T06:29:11.749Z",
        "updatedAt": "2026-09-29T05:06:55.007Z",
        "lastUsedAt": "2026-09-29T05:06:55.003Z"
    },
    {
        "id": "client_mst_3",
        "name": "ENEOSウイング関東第1支店 EW 高崎インター東TS",
        "code": "V001",
        "honorific": "御中",
        "zip": "370-0015",
        "address": "群馬県高崎市島野町890-1",
        "contactPerson": "",
        "tel": "027-353-8181",
        "email": "",
        "invoiceNumber": "T6180001016088",
        "category": "vendor",
        "closingDay": "都度",
        "paymentTerms": "即時（法人カード）",
        "note": "社用車ガソリン給油・洗車",
        "usageCount": 5,
        "createdAt": "2026-09-25T06:26:30.325Z"
    },
    {
        "id": "rescued_vendor_1790319015890_aoft",
        "name": "タイムズ２４株式会社　高崎郵便局駐車場",
        "code": "V003",
        "honorific": "御中",
        "zip": "141-8924",
        "address": "東京都品川区西五反田2-27-2",
        "contactPerson": "",
        "tel": "0120-31-8924",
        "email": "",
        "invoiceNumber": "T4010001137274",
        "category": "vendor",
        "closingDay": "都度",
        "paymentTerms": "現地精算",
        "note": "コインパーキング利用（高崎郵便局駐車場）",
        "usageCount": 3,
        "createdAt": "2026-09-24",
        "updatedAt": "2026-09-25T16:50:00.000Z"
    }
]

DEFAULT_INVENTORY = [
    {
        "id": "inv_1",
        "itemId": "prod_1790317962497_3xgg",
        "name": "DP-5000　ベーシックセット　バッテリー２個",
        "sku": "DP-5000-B2",
        "currentStock": 5,
        "safetyStock": 2,
        "unit": "式",
        "unitCost": 180000,
        "unitPrice": 268257,
        "location": "本社倉庫 A-1",
        "lastInDate": "2026-09-25",
        "note": "主力構成商品",
        "history": [
            {"date": "2026-09-25", "type": "in", "qty": 5, "reason": "初期棚卸在庫登録", "currentStock": 5}
        ]
    },
    {
        "id": "inv_2",
        "itemId": "prod_1790320521317_adue",
        "name": "DP-MS　スプレッダー",
        "sku": "DP-MS-01",
        "currentStock": 3,
        "safetyStock": 1,
        "unit": "個",
        "unitCost": 40000,
        "unitPrice": 59612,
        "location": "パーツ保管棚 B-2",
        "lastInDate": "2026-09-25",
        "note": "",
        "history": [
            {"date": "2026-09-25", "type": "in", "qty": 3, "reason": "初期棚卸在庫登録", "currentStock": 3}
        ]
    }
]

DEFAULT_PURCHASE_MAPPINGS = {
    "スプレッダー": "inv_2",
    "ベーシックセット": "inv_1"
}

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
        parsed_url = urllib.parse.urlparse(self.path)
        if 'api.php' in parsed_url.path:
            qs = urllib.parse.parse_qs(parsed_url.query)
            if 'endpoint' in qs:
                self.path = '/api/' + qs['endpoint'][0]

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

        # 在庫マスタ取得API
        if self.path == '/api/inventory':
            inv_data = load_json_file(INVENTORY_FILE, DEFAULT_INVENTORY)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(inv_data, ensure_ascii=False).encode('utf-8'))
            return

        # 仕入名目マッピング取得API
        if self.path == '/api/purchase-mappings':
            mappings = load_json_file(PURCHASE_MAPPINGS_FILE, DEFAULT_PURCHASE_MAPPINGS)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(mappings, ensure_ascii=False).encode('utf-8'))
            return

        # 給与明細レコード一覧取得API
        if self.path == '/api/payroll/records':
            pay_records = load_json_file(PAYROLL_RECORDS_FILE, DEFAULT_PAYROLL_RECORDS)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(pay_records, ensure_ascii=False).encode('utf-8'))
            return

        # 給与計算設定取得API
        if self.path == '/api/payroll/settings':
            pay_settings = load_json_file(PAYROLL_SETTINGS_FILE, DEFAULT_PAYROLL_SETTINGS)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(pay_settings, ensure_ascii=False).encode('utf-8'))
            return

        # 前年所得・明細データ取得API
        if self.path == '/api/payroll/previous-year':
            prev_income = load_json_file(PREVIOUS_YEAR_INCOME_FILE, DEFAULT_PREVIOUS_YEAR_INCOME)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(prev_income, ensure_ascii=False).encode('utf-8'))
            return

        # 請求書履歴一覧取得API
        if self.path == '/api/invoices/history':
            invoices = load_json_file(INVOICES_HISTORY_FILE, [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(invoices, ensure_ascii=False).encode('utf-8'))
            return

        # アクティブ編集伝票取得API
        if self.path == '/api/invoices/active':
            active_doc = load_json_file(ACTIVE_DOC_FILE, None)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(active_doc, ensure_ascii=False).encode('utf-8'))
            return

        # 経費・仕訳データ一覧取得API
        if self.path == '/api/expenses':
            expenses = load_json_file(EXPENSES_FILE, [])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(expenses, ensure_ascii=False).encode('utf-8'))
            return

        return super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if 'api.php' in parsed_url.path:
            qs = urllib.parse.parse_qs(parsed_url.query)
            if 'endpoint' in qs:
                self.path = '/api/' + qs['endpoint'][0]

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

        # 在庫マスタ保存API
        if self.path == '/api/inventory':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                inv_data = json.loads(post_data)
                if not isinstance(inv_data, list):
                    raise ValueError("データ形式が配列ではありません")
                success, err = save_json_file_with_backup(INVENTORY_FILE, inv_data, "inventory")
                if not success:
                    raise Exception(err)
                print(f"[在庫マスタ 保存成功] 件数: {len(inv_data)}件 -> {INVENTORY_FILE}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "count": len(inv_data)}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # 仕入名目マッピング辞書 保存API
        if self.path == '/api/purchase-mappings':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                mapping_data = json.loads(post_data)
                if not isinstance(mapping_data, dict):
                    raise ValueError("データ形式がオブジェクト(辞書)ではありません")
                success, err = save_json_file_with_backup(PURCHASE_MAPPINGS_FILE, mapping_data, "purchase_mappings")
                if not success:
                    raise Exception(err)
                print(f"[仕入マッピング 保存成功] キー数: {len(mapping_data)}件 -> {PURCHASE_MAPPINGS_FILE}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "count": len(mapping_data)}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # 給与明細レコード一覧 保存API
        if self.path == '/api/payroll/records':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                records = json.loads(post_data)
                if not isinstance(records, list):
                    raise ValueError("データ形式が配列ではありません")
                success, err = save_json_file_with_backup(PAYROLL_RECORDS_FILE, records, "payroll_records")
                if not success:
                    raise Exception(err)
                print(f"[給与明細レコード 保存成功] 件数: {len(records)}件 -> {PAYROLL_RECORDS_FILE}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "count": len(records)}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # 給与計算設定 保存API
        if self.path == '/api/payroll/settings':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                settings = json.loads(post_data)
                if not isinstance(settings, dict):
                    raise ValueError("データ形式がオブジェクトではありません")
                success, err = save_json_file_with_backup(PAYROLL_SETTINGS_FILE, settings, "payroll_settings")
                if not success:
                    raise Exception(err)
                print(f"[給与設定 保存成功] 社員: {settings.get('empName')} -> {PAYROLL_SETTINGS_FILE}")
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

        # 前年所得・明細データ保存API
        if self.path == '/api/payroll/previous-year':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                prev_data = json.loads(post_data)
                if not isinstance(prev_data, dict):
                    raise ValueError("データ形式がオブジェクトではありません")
                success, err = save_json_file_with_backup(PREVIOUS_YEAR_INCOME_FILE, prev_data, "previous_year_income")
                if not success:
                    raise Exception(err)
                print(f"[前年所得データ 保存成功] 対象年: {prev_data.get('targetYear')}年 -> {PREVIOUS_YEAR_INCOME_FILE}")
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

        if self.path == '/api/invoices/history':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                invoices = json.loads(post_data)
                if not isinstance(invoices, list):
                    raise ValueError("データ形式が配列ではありません")
                # 既存データとIDスマートマージ
                existing = load_json_file(INVOICES_HISTORY_FILE, [])
                merged_map = {item.get('id'): item for item in existing if isinstance(item, dict) and item.get('id')}
                for item in invoices:
                    if isinstance(item, dict) and item.get('id'):
                        merged_map[item.get('id')] = item
                merged_list = sorted(list(merged_map.values()), key=lambda x: str(x.get('issueDate') or x.get('updatedAt') or ''), reverse=True)
                success, err = save_json_file_with_backup(INVOICES_HISTORY_FILE, merged_list, "invoices_history")
                if not success:
                    raise Exception(err)
                print(f"[請求書履歴 保存成功] マージ後件数: {len(merged_list)}件 -> {INVOICES_HISTORY_FILE}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "count": len(merged_list)}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # アクティブ編集伝票 保存API
        if self.path == '/api/invoices/active':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                active_doc = json.loads(post_data) if post_data else None
                success, err = save_json_file_with_backup(ACTIVE_DOC_FILE, active_doc, "active_doc")
                if not success:
                    raise Exception(err)
                print(f"[アクティブ伝票 保存成功] -> {ACTIVE_DOC_FILE}")
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

        # 経費明細 保存API
        if self.path == '/api/expenses':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                expenses = json.loads(post_data)
                if not isinstance(expenses, list):
                    raise ValueError("データ形式が配列ではありません")
                # 既存データとIDスマートマージ
                existing = load_json_file(EXPENSES_FILE, [])
                merged_map = {item.get('id'): item for item in existing if isinstance(item, dict) and item.get('id')}
                for item in expenses:
                    if isinstance(item, dict) and item.get('id'):
                        merged_map[item.get('id')] = item
                merged_list = sorted(list(merged_map.values()), key=lambda x: str(x.get('date', '')), reverse=True)
                success, err = save_json_file_with_backup(EXPENSES_FILE, merged_list, "expenses")
                if not success:
                    raise Exception(err)
                print(f"[経費データ 保存成功] マージ後件数: {len(merged_list)}件 -> {EXPENSES_FILE}")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "count": len(merged_list)}, ensure_ascii=False).encode('utf-8'))
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
    print(" Alva-works EPR - 統合業務管理サーバー起動中")
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
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(('', PORT), BillCraftHandler) as httpd:
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"[情報] ポート {PORT} は既に使用中です。ブラウザを開きます...")
            webbrowser.open(f'http://localhost:{PORT}')
        else:
            raise e
