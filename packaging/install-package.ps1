# 新しい右クリックメニュー用のパッケージを、この端末へ登録する。
# 署名に使った自己署名証明書を信頼させるため、管理者として実行すること。
#
# 引数にアプリの場所を渡す。省略した場合はこのスクリプトの 2 つ上を見る。
param([string]$ApplicationPath = '')

$ErrorActionPreference = 'Stop'

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host ''
    Write-Host '[エラー] 管理者として実行してください。'
    Write-Host '         証明書をこの端末の信頼ストアへ入れるために必要です。'
    Write-Host ''
    exit 1
}

$cer = Join-Path $PSScriptRoot 'ZipperDev.cer'
$msix = Join-Path $PSScriptRoot 'ZipperShell.msix'

if ($ApplicationPath -eq '') {
    # <アプリの場所>esources\shell に置かれている前提で 2 つ上へ戻る
    $ApplicationPath = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}

foreach ($path in @($cer, $msix)) {
    if (-not (Test-Path $path)) { throw ($path + ' がありません。') }
}
if (-not (Test-Path (Join-Path $ApplicationPath 'Zipper.exe'))) {
    throw ($ApplicationPath + ' に Zipper.exe がありません。')
}

Write-Host '証明書を信頼させています...'
Import-Certificate -FilePath $cer -CertStoreLocation ('Cert:\LocalMachine\TrustedPeople') | Out-Null
Import-Certificate -FilePath $cer -CertStoreLocation ('Cert:\LocalMachine\Root') | Out-Null

Write-Host 'パッケージを登録しています...'
# 入れ直しの場合に備え、古いものがあれば先に外す
Get-AppxPackage -Name 'Zipper.ShellExtension' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
Add-AppxPackage -Path $msix -ExternalLocation $ApplicationPath

Write-Host '登録しました。'
