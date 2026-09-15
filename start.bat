@echo off
chcp 65001 > nul
title BillCraft - 納品書・請求書 かんたん発行アプリ

echo ========================================================
echo  BillCraft - 納品書・請求書 かんたん発行アプリ
echo  ブラウザを起動しています...
echo ========================================================

:: カレントディレクトリをこのファイルの場所に設定
cd /d "%~dp0"

:: Python がインストールされているかチェック
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo Pythonローカルサーバーを起動してブラウザを開きます...
    start "" http://localhost:3000
    python -m http.server 3000
) else (
    echo ブラウザで直接 index.html を開きます...
    start "" index.html
)
