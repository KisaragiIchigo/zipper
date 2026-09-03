@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo   Zipper ^| 開発モードで起動します
echo ==========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [エラー] Node.js が見つかりません。
    echo          https://nodejs.org/ からインストールしてください。
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 依存パッケージをインストールしています。初回は数分かかります...
    call npm install --no-audit --no-fund
    if errorlevel 1 goto :failed
    echo.
)

if not exist "resources\7zip\7z.exe" (
    echo 解凍エンジン 7-Zip を取得しています...
    call npm run fetch:7zip
    if errorlevel 1 goto :failed
    echo.
)

if not exist "build\icon.ico" (
    echo アプリアイコンを生成しています...
    call npm run make:icon
    echo.
)

echo 起動します。閉じるときはアプリのウィンドウを閉じてください。
echo.
call npm run dev

goto :end

:failed
echo.
echo [エラー] 準備に失敗しました。上のメッセージを確認してください。
echo.
pause
exit /b 1

:end
endlocal
