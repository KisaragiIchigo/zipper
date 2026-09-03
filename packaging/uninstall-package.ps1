# 新しい右クリックメニュー用のパッケージを取り除く。
$ErrorActionPreference = 'Continue'

Get-AppxPackage -Name 'Zipper.ShellExtension' | Remove-AppxPackage
Write-Host 'パッケージを取り除きました。'

# 証明書は管理者でないと消せない
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if ($principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    foreach ($store in @('Root', 'TrustedPeople')) {
        Get-ChildItem ('Cert:\LocalMachine\' + $store) -ErrorAction SilentlyContinue |
            Where-Object { $_.Subject -eq 'CN=Zipper Development' } |
            ForEach-Object { Remove-Item $_.PSPath -Force }
    }
    Write-Host '証明書も取り除きました。'
} else {
    Write-Host '証明書はそのままです。消すには管理者として実行してください。'
}
