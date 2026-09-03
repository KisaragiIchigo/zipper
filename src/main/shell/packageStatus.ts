import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/** マニフェストの Identity Name と一致させること */
const PACKAGE_NAME = 'Zipper.ShellExtension'

/**
 * 右クリックの 1 階層目へ出すためのパッケージが入っているかを調べる。
 *
 * この登録はインストーラが行う。証明書をこの端末の信頼ストアへ入れる必要があり、
 * 管理者権限を要するため、アプリからは状態を見るだけに留める。
 */
export async function isPackageRegistered(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(
      'powershell',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        'if (Get-AppxPackage -Name ' + PACKAGE_NAME + ') { "yes" } else { "no" }'
      ],
      { windowsHide: true, timeout: 10_000 }
    )
    return stdout.trim() === 'yes'
  } catch {
    // PowerShell が使えない環境では、入っていないものとして扱う
    return false
  }
}
