/**
 * 7z t の出力から、壊れている項目を拾う。
 * 失敗は "ERROR: <理由> : <パス>" の形で 1 行ずつ出る。
 */
export function parseTestFailures(output: string): string[] {
  const failures: string[] = []

  for (const line of output.split(/\r?\n/)) {
    const match = /^ERROR:\s+(.+?)\s+:\s+(.+)$/.exec(line.trim())
    if (match === null) continue

    const reason = match[1]
    const path = match[2]
    if (reason === undefined || path === undefined) continue
    failures.push(path + '（' + reason + '）')
  }

  return failures
}
