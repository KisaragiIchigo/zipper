import { execFile } from 'node:child_process'
import { rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * 関連付けが変わったことをエクスプローラーへ知らせる。
 *
 * レジストリを書いただけでは既に動いているエクスプローラーが読み直さず、
 * 右クリックに項目が現れないことがある。SHChangeNotify で更新を促す。
 * Node からは直接呼べないため PowerShell を経由する。
 */
const SCRIPT = `Add-Type -MemberDefinition @"
[DllImport("shell32.dll", CharSet = CharSet.Auto, SetLastError = true)]
public static extern void SHChangeNotify(int eventId, uint flags, IntPtr item1, IntPtr item2);
"@ -Namespace ZipperShell -Name Native

# SHCNE_ASSOCCHANGED / SHCNF_IDLIST
[ZipperShell.Native]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
`

export async function notifyAssociationChanged(): Promise<void> {
  const file = join(tmpdir(), 'zipper-notify-' + Date.now() + '.ps1')

  try {
    await writeFile(file, SCRIPT, 'utf8')
    await execFileAsync(
      'powershell',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', file],
      { windowsHide: true }
    )
  } catch {
    // 知らせられなくても登録そのものは済んでいる。次回のログオンで反映される
  } finally {
    await rm(file, { force: true })
  }
}
