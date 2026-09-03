; インストール時にエクスプローラーとの連携を登録する。
; 登録内容はアプリ本体とスクリプトが持っているため、ここでは呼び出すだけにして
; 定義の二重管理を避ける。

!macro customInstall
  DetailPrint "エクスプローラーとの連携を登録しています..."
  nsExec::ExecToStack '"$INSTDIR\Zipper.exe" --register-shell'
  Pop $0

  ; Windows 11 の新しい右クリックメニュー用。失敗してもインストールは続ける
  DetailPrint "右クリックメニューを登録しています..."
  nsExec::ExecToStack 'powershell -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\shell\install-package.ps1" -ApplicationPath "$INSTDIR"'
  Pop $0
!macroend

!macro customUnInstall
  DetailPrint "右クリックメニューを解除しています..."
  nsExec::ExecToStack 'powershell -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\shell\uninstall-package.ps1"'
  Pop $0

  DetailPrint "エクスプローラーとの連携を解除しています..."
  nsExec::ExecToStack '"$INSTDIR\Zipper.exe" --unregister-shell'
  Pop $0
!macroend
