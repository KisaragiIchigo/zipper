# Windows 11 の新しい右クリックメニュー用のパッケージを作る。
# 署名には自己署名証明書を使い、無ければその場で作る。
$ErrorActionPreference = 'Stop'

$packaging = $PSScriptRoot
$root = Split-Path -Parent $packaging
$subject = 'CN=Zipper Development'
$pfxPath = Join-Path $packaging 'ZipperDev.pfx'
$cerPath = Join-Path $packaging 'ZipperDev.cer'
$plainPassword = 'zipper-dev'

function Find-Tool([string]$name) {
    $kits = Join-Path ${env:ProgramFiles(x86)} ('Windows Kits\10\bin')
    if (-not (Test-Path $kits)) { throw "Windows SDK が見つかりません。" }

    $found = Get-ChildItem -Path $kits -Filter $name -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.DirectoryName -like ('*\x64') } |
        Sort-Object FullName -Descending |
        Select-Object -First 1

    if ($null -eq $found) { throw "$name が見つかりません。" }
    return $found.FullName
}

# --- 証明書 ---------------------------------------------------------------
if (-not (Test-Path $pfxPath)) {
    Write-Host '署名用の証明書を作成しています...'
    $password = ConvertTo-SecureString -String $plainPassword -Force -AsPlainText

    $cert = New-SelfSignedCertificate -Type Custom -Subject $subject `
        -KeyUsage DigitalSignature -FriendlyName 'Zipper Development' `
        -CertStoreLocation ('Cert:\CurrentUser\My') `
        -TextExtension @('2.5.29.37={text}1.3.6.1.5.5.7.3.3', '2.5.29.19={text}')

    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password | Out-Null
    Export-Certificate -Cert $cert -FilePath $cerPath | Out-Null
    Write-Host "  作成しました: $cerPath"
} else {
    Write-Host '既存の証明書を使います。'
}

# --- パッケージの中身を組み立てる -----------------------------------------
# 作業用のスクリプトや証明書を巻き込まないよう、必要なものだけを別の場所へ集める
$staging = Join-Path ([System.IO.Path]::GetTempPath()) ('zipper-msix-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $staging | Out-Null

try {
    Copy-Item (Join-Path $packaging 'AppxManifest.xml') $staging
    Copy-Item (Join-Path $packaging 'Assets') $staging -Recurse

    # 配布物へ同梱するため、成果物は packaging の中に置く
    $msix = Join-Path $packaging 'ZipperShell.msix'
    if (Test-Path $msix) { Remove-Item $msix -Force }

    Write-Host 'パッケージを作成しています...'
    $makeappx = Find-Tool 'makeappx.exe'
    & $makeappx pack /d $staging /p $msix /nv | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'makeappx に失敗しました。' }

    Write-Host '署名しています...'
    $signtool = Find-Tool 'signtool.exe'
    & $signtool sign /fd SHA256 /f $pfxPath /p $plainPassword $msix | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'signtool に失敗しました。' }

    Write-Host ''
    Write-Host "完成: $msix"
    Write-Host "証明書: $cerPath"
} finally {
    Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
}
