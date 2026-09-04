import { z } from 'zod'

/** IPC 境界に届く値は信頼しない。Renderer からのペイロードはすべてここを通す */
export const themeModeSchema = z.enum(['system', 'light', 'dark'])

const codepageSchema = z.union([
  z.literal(65001),
  z.literal(932),
  z.literal(949),
  z.literal(936),
  z.literal(950)
])

/** 書庫内の相対パス。親への遡上を含むものは受け付けない */
const relativeEntryPath = z
  .string()
  .min(1)
  .refine(
    (value) => !value.split('/').includes('..') && !/^([a-zA-Z]:|\/)/.test(value),
    '書庫内のパスとして不正です'
  )

export const createArchiveSchema = z.object({
  sources: z.array(z.string().min(1)).min(1),
  destination: z.string().min(1),
  format: z.enum(['zip', '7z', 'tar', 'gzip', 'bzip2', 'xz']),
  level: z.union([z.literal(0), z.literal(1), z.literal(5), z.literal(9)]),
  password: z.string().optional(),
  encryptHeader: z.boolean().optional(),
  zipEncryption: z.enum(['AES256', 'ZipCrypto']).optional(),
  // 7-Zip の記法。数値のあとに k / m / g を付ける
  volumeSize: z
    .string()
    .regex(/^[1-9][0-9]*[kmg]$/, '分割サイズの指定が不正です')
    .optional(),
  selfExtracting: z.boolean().optional()
})

export const createBatchSchema = z.object({
  sources: z.array(z.string().min(1)).min(1),
  destination: z.string().min(1),
  format: z.enum(['zip', '7z', 'tar', 'gzip', 'bzip2', 'xz']),
  level: z.union([z.literal(0), z.literal(1), z.literal(5), z.literal(9)]),
  password: z.string().optional(),
  encryptHeader: z.boolean().optional(),
  zipEncryption: z.enum(['AES256', 'ZipCrypto']).optional(),
  volumeSize: z
    .string()
    .regex(/^[1-9][0-9]*[kmg]$/, '分割サイズの指定が不正です')
    .optional(),
  selfExtracting: z.boolean().optional()
})

export const openEntrySchema = z.object({
  path: z.string().min(1),
  entry: relativeEntryPath,
  displayPath: relativeEntryPath,
  password: z.string().optional()
})

export const modifyArchiveSchema = z.object({
  path: z.string().min(1),
  targets: z.array(z.string().min(1)).min(1),
  password: z.string().optional()
})

export const testArchiveSchema = z.object({
  path: z.string().min(1),
  totalFiles: z.number().int().min(0).optional(),
  password: z.string().optional()
})

export const previewSchema = z.object({
  path: z.string().min(1),
  entry: relativeEntryPath,
  displayPath: relativeEntryPath,
  size: z.number().int().min(0),
  password: z.string().optional()
})

export const batchExtractSchema = z.object({
  archives: z.array(z.string().min(1)).min(1),
  mode: z.enum(['here', 'folder', 'fixed']),
  destination: z.string().min(1).optional(),
  overwrite: z.enum(['overwrite', 'skip', 'rename']).optional(),
  password: z.string().optional()
})

export const startDragSchema = z.object({
  path: z.string().min(1),
  targets: z
    .array(z.object({ entry: relativeEntryPath, displayPath: relativeEntryPath }))
    .min(1)
    .max(100000),
  password: z.string().optional()
})

export const conflictQuerySchema = z.object({
  destination: z.string().min(1),
  entries: z.array(relativeEntryPath)
})

export const extractArchiveSchema = z.object({
  path: z.string().min(1),
  destination: z.string().min(1),
  entries: z.array(relativeEntryPath).optional(),
  renames: z.array(z.object({ from: relativeEntryPath, to: relativeEntryPath })).optional(),
  overwrite: z.enum(['overwrite', 'skip', 'rename']).optional(),
  totalFiles: z.number().int().min(0).optional(),
  hasEncryptedEntry: z.boolean().optional(),
  password: z.string().optional()
})

export const saveArchiveSchema = z.object({
  /** 保存ダイアログに出す初期のファイル名 */
  name: z.string().min(1),
  /** 対象がある場所。作業フォルダの設定が無いときの初期位置に使う */
  directory: z.string().optional()
})

export const openArchiveSchema = z.object({
  path: z.string().min(1),
  codepage: codepageSchema.optional(),
  password: z.string().optional()
})
