/**
 * `7z l -slt` の出力を Key = Value の集合へ分解する。
 * 出力は「バナー → 書庫自身の情報 → ---------- → エントリの並び」という構造で、
 * エントリ同士は空行で区切られる。
 */
export type RawEntry = Readonly<Record<string, string>>

export interface RawListing {
  type: string | null
  physicalSize: number
  entries: RawEntry[]
}

const ENTRY_SEPARATOR = '----------'
const KEY_VALUE = ' = '

function toRecord(block: readonly string[]): RawEntry {
  const record: Record<string, string> = {}
  for (const line of block) {
    // ファイル名自体が " = " を含みうるため、最初の区切りだけで分ける
    const index = line.indexOf(KEY_VALUE)
    if (index <= 0) continue
    record[line.slice(0, index)] = line.slice(index + KEY_VALUE.length)
  }
  return record
}

function splitBlocks(lines: readonly string[]): RawEntry[] {
  const blocks: RawEntry[] = []
  let current: string[] = []

  for (const line of lines) {
    if (line.trim() === '') {
      if (current.length > 0) {
        blocks.push(toRecord(current))
        current = []
      }
      continue
    }
    current.push(line)
  }
  if (current.length > 0) blocks.push(toRecord(current))

  return blocks
}

export function parseListing(stdout: string): RawListing {
  const lines = stdout.split(/\r?\n/)
  const separatorIndex = lines.findIndex((line) => line.trim() === ENTRY_SEPARATOR)

  // 区切りより前には書庫自身の Type / Physical Size が入る
  const headBlocks = splitBlocks(separatorIndex < 0 ? lines : lines.slice(0, separatorIndex))
  const archiveBlock = headBlocks.find((block) => 'Type' in block)

  const entries = separatorIndex < 0 ? [] : splitBlocks(lines.slice(separatorIndex + 1))

  return {
    type: archiveBlock?.['Type'] ?? null,
    physicalSize: Number(archiveBlock?.['Physical Size'] ?? 0),
    entries: entries.filter((entry) => 'Path' in entry)
  }
}
