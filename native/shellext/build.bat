@echo off
setlocal
cd /d "%~dp0"

rem vswhere は usebackq で呼ぶ。空白を含むパスを引用符ごと渡せる
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

rem vcvars 内部の警告は本題ではないので伏せる
call "%VCVARS%" >nul 2>&1

set "OUTDIR=..\..\resources\shell"
if not exist "%OUTDIR%" mkdir "%OUTDIR%"

rem 中間ファイルはこの場に置き、最後に片付ける
echo ビルドしています...
cl /nologo /LD /EHsc /std:c++17 /O2 /W4 /utf-8 /DUNICODE /D_UNICODE /DNOMINMAX /DWIN32_LEAN_AND_MEAN ^
   dllmain.cpp ExplorerCommand.cpp ^
   /Fe:"%OUTDIR%\ZipperShell.dll" ^
   /link /DLL /DEF:ZipperShell.def ^
   shlwapi.lib ole32.lib oleaut32.lib shell32.lib pathcch.lib

if errorlevel 1 (
    echo.
    echo [エラー] ビルドに失敗しました。
    del /q *.obj 2>nul
    exit /b 1
)

del /q *.obj 2>nul
del /q "%OUTDIR%\ZipperShell.exp" 2>nul
del /q "%OUTDIR%\ZipperShell.lib" 2>nul

echo.
echo 完成: %OUTDIR%\ZipperShell.dll
exit /b 0
