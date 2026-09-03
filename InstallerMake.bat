@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ==========================================
echo   Zipper ^| インストーラを作成します
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

rem 解凍エンジンは配布物に同梱するため、無い状態では作らせない
if not exist "resources\7zip\7z.exe" (
    echo 解凍エンジン 7-Zip を取得しています...
    call npm run fetch:7zip
    if errorlevel 1 goto :failed
    echo.
)

for /f "delims=" %%v in ('node -p "require('./package.json').version"') do set "VERSION=%%v"

echo バージョン !VERSION! のインストーラを作成します。
echo 型チェック、アイコン生成、ビルド、パッケージングまで続けて実行します。
echo 数分かかります。
echo.

call npm run build:win
if errorlevel 1 goto :failed

echo.
echo ==========================================
echo   完成しました
echo ==========================================
dir /b "release\*.exe" 2>nul
echo.
echo 出力先: %~dp0release
echo.

set /p OPEN="出力先のフォルダを開きますか? Y または N: "
if /i "!OPEN!"=="Y" start "" "%~dp0release"

goto :end

:failed
echo.
echo [エラー] インストーラの作成に失敗しました。上のメッセージを確認してください。
echo.
pause
exit /b 1

:end
echo 終了するには何かキーを押してください。
pause >nul
endlocal
