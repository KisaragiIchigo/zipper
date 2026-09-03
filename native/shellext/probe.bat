@echo off
setlocal
cd /d "%~dp0"

rem vswhere の呼び出しは usebackq を使う。空白を含むパスを引用符ごと渡せる
set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
set "VSPATH="
if exist "%VSWHERE%" (
    for /f "usebackq delims=" %%i in (`"%VSWHERE%" -latest -products * -property installationPath`) do set "VSPATH=%%i"
)

if "%VSPATH%"=="" (
    echo [エラー] Visual Studio が見つかりません。
    exit /b 1
)

set "VCVARS=%VSPATH%\VC\Auxiliary\Build\vcvars64.bat"
if not exist "%VCVARS%" (
    echo [エラー] C++ のビルド環境が見つかりません。
    echo          Visual Studio Installer で「C++ によるデスクトップ開発」を追加してください。
    exit /b 1
)

echo 環境: %VSPATH%
call "%VCVARS%" >nul
if errorlevel 1 exit /b 1

cl 2>&1 | findstr /C:"Version"
exit /b 0
