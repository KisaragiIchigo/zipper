import { readFile } from 'node:fs/promises'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import type { PreviewContent } from '@shared/types'
import { decodeText } from '../encoding/decodeText'
import { extractArchive } from './extractArchive'

/** 画面に出すだけなので、開くのに待たされない大きさに限る */
const IMAGE_LIMIT = 32 * 1024 * 1024
const TEXT_LIMIT = 2 * 1024 * 1024

const IMAGE_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.markdown', '.json', '.jsonc', '.csv', '.tsv', '.log', '.ini', '.cfg', '.conf',
  '.xml', '.yaml', '.yml', '.toml', '.html', '.htm', '.css', '.scss', '.js', '.mjs', '.cjs',
  '.ts', '.tsx', '.jsx', '.py', '.rb', '.go', '.rs', '.java', '.c', '.h', '.cpp', '.hpp',
  '.cs', '.sh', '.bat', '.ps1', '.sql', '.env', '.gitignore', '.editorconfig'
])

export interface PreviewOptions {
  entry: string
  displayPath: string
  size: number
  password?: string
}

/** 拡張子から、画面に出せる種類かを判断する */
function classify(displayPath: string): 'image' | 'text' | null {
  const extension = extname(displayPath).toLowerCase()
  if (extension in IMAGE_TYPES) return 'image'
  if (TEXT_EXTENSIONS.has(extension)) return 'text'
  return null
}

/**
 * 書庫の中の 1 件を、外部のアプリを起こさずに読み取る。
 * 一時領域へ出してから読み、読み終えたその場で片付ける。
 */
export async function previewArchiveEntry(
  archivePath: string,
  options: PreviewOptions
): Promise<PreviewContent> {
  const kind = classify(options.displayPath)
  if (kind === null) {
    return { kind: 'unsupported', reason: 'この形式はここでは表示できません。' }
  }

  const limit = kind === 'image' ? IMAGE_LIMIT : TEXT_LIMIT
  if (options.size > limit) {
    return {
      kind: 'unsupported',
      reason: 'ファイルが大きいため、ここでは表示できません。展開してからご覧ください。'
    }
  }

  const destination = await mkdtemp(join(tmpdir(), 'zipper-preview-'))
  const needsRename = options.entry !== options.displayPath

  try {
    await extractArchive(archivePath, {
      destination,
      entries: [options.entry],
      ...(needsRename ? { renames: [{ from: options.entry, to: options.displayPath }] } : {}),
      ...(options.password === undefined ? {} : { password: options.password })
    })

    const buffer = await readFile(join(destination, options.displayPath))

    if (kind === 'image') {
      const mime = IMAGE_TYPES[extname(options.displayPath).toLowerCase()] ?? 'image/png'
      return { kind: 'image', dataUrl: 'data:' + mime + ';base64,' + buffer.toString('base64') }
    }

    const decoded = decodeText(buffer)
    return { kind: 'text', text: decoded.text, encoding: decoded.encoding }
  } finally {
    await rm(destination, { recursive: true, force: true })
  }
}
