#!/bin/bash
# BillCraft - Mac用 起動スクリプト
# ダブルクリックするとローカルサーバーを起動し、自動的にブラウザを開きます

cd "$(dirname "$0")"

PORT=3000
echo "========================================================"
echo " BillCraft - 納品書・請求書 かんたん発行アプリ"
echo " http://localhost:$PORT をブラウザで開きます..."
echo " 終了するにはこのウィンドウを閉じるか Ctrl+C を押してください"
echo "========================================================"

# Python3 を使ってローカルサーバーを起動し、ブラウザで開く
python3 -c "
import http.server
import socketserver
import webbrowser
import threading
import sys

PORT = 3000

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def open_browser():
    webbrowser.open(f'http://localhost:{PORT}')

threading.Timer(0.8, open_browser).start()

try:
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        httpd.serve_forever()
except OSError:
    # ポートが使用中の場合はそのままブラウザを開く
    webbrowser.open(f'http://localhost:{PORT}')
"
