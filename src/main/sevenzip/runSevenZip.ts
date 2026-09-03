import { spawn } from 'node:child_process'

export interface SevenZipResult {
  code: number | null
  stdout: string
  stderr: string
}

export interface RunOptions {
  /** 出力が途絶えたまま経過したら kill する上限。既定 30 秒 */
  timeoutMs?: number
  cwd?: string
  /** 標準出力が届くたびに呼ばれる。進捗の取り出しに使う */
  onStdout?: (chunk: string) => void
  /** 中断要求。展開の取り消しに使う */
  signal?: AbortSignal
}

/**
 * 7z.exe を起動する。
 * -sccUTF-8 を常に前置してコンソール入出力を UTF-8 に固定する。これが無いと
 * 日本語環境では stdout が cp932 で返り、ファイル名のパースが最初から壊れる。
 */
export function runSevenZip(
  binary: string,
  args: readonly string[],
  options: RunOptions = {}
): Promise<SevenZipResult> {
  const { timeoutMs = 30_000, cwd, onStdout, signal } = options

  return new Promise((resolve, reject) => {
    if (signal?.aborted === true) {
      reject(new Error('中断されました'))
      return
    }

    const child = spawn(binary, ['-sccUTF-8', ...args], {
      windowsHide: true,
      // stdin を閉じておく。開いたままだと暗号化書庫でパスワードプロンプトに入り、
      // 応答が来ないままタイムアウトまで固まる
      stdio: ['ignore', 'pipe', 'pipe'],
      ...(cwd === undefined ? {} : { cwd })
    })

    let stdout = ''
    let stderr = ''
    let settled = false

    // 展開は長時間かかるため、経過ではなく「無応答が続いた時間」で打ち切る
    let timer = setTimeout(onTimeout, timeoutMs)

    function onTimeout(): void {
      settled = true
      child.kill()
      reject(new Error('7-Zip の応答がありません（' + timeoutMs + 'ms 超過）: ' + binary))
    }

    function touch(): void {
      clearTimeout(timer)
      timer = setTimeout(onTimeout, timeoutMs)
    }

    const onAbort = (): void => {
      settled = true
      clearTimeout(timer)
      child.kill()
      reject(new Error('中断されました'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk
      touch()
      onStdout?.(chunk)
    })
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk
    })

    child.on('error', (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      reject(error)
    })

    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      resolve({ code, stdout, stderr })
    })
  })
}
