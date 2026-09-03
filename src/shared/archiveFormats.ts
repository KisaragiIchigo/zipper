import type { ArchiveFormat } from './types'

/** 中身を書き換えられる形式。RAR などは読み取り専用として扱う */
const WRITABLE_TYPES = new Set(['zip', '7z', 'tar', 'wim', 'gzip', 'bzip2', 'xz'])

export function isWritableType(type: string): boolean {
  return WRITABLE_TYPES.has(type.toLowerCase())
}

/**
 * 開ける書庫の拡張子。
 *
 * 中身を読む力は同梱の 7-Zip に任せているため、ここに無い拡張子でも
 * 「すべてのファイル」から選べば開ける。この一覧は選びやすさのためのもの。
 */
export const READABLE_EXTENSIONS = [
  // 圧縮書庫
  'zip', 'zipx', 'z01', '7z', 'rar', 'r00', 'lzh', 'lha', 'arj', 'cab', 'zst', 'tzst',
  // tar とその圧縮
  'tar', 'ova', 'gz', 'gzip', 'tgz', 'tpz', 'bz2', 'bzip2', 'tbz', 'tbz2', 'xz', 'txz',
  'z', 'taz', 'lzma',
  // 配布物・パッケージ
  'jar', 'apk', 'ipa', 'xpi', 'appx', 'nupkg', 'epub', 'deb', 'rpm', 'cpio', 'xar', 'pkg',
  'xip', 'msi', 'msp', 'msm', 'wim', 'swm', 'esd', 'ppkg',
  // ディスクイメージ・ファイルシステム
  'iso', 'img', 'dmg', 'hfs', 'hfsx', 'vhd', 'vhdx', 'avhdx', 'vmdk', 'vdi', 'qcow', 'qcow2',
  'squashfs', 'udf',
  // ヘルプ・その他
  'chm', 'chi', 'chq', 'chw',
  // 分割書庫の先頭
  '001'
] as const

/**
 * 右クリックに出す拡張子。
 *
 * 読める形式すべてを関連付けると Windows の既定アプリ設定が荒れるため、
 * 書庫として日常的に扱うものに絞る。
 */
export const SHELL_EXTENSIONS = [
  '.zip', '.zipx', '.7z', '.rar', '.lzh', '.lha', '.arj', '.cab', '.zst',
  '.tar', '.gz', '.tgz', '.bz2', '.tbz', '.xz', '.txz', '.z',
  '.iso', '.dmg', '.hfs', '.vhd', '.vmdk', '.wim',
  '.jar', '.apk', '.nupkg', '.epub', '.deb', '.rpm', '.cpio', '.xar', '.chm', '.msi',
  '.001'
] as const

/** 圧縮形式ごとの性質。UI の出し分けと 7-Zip の呼び出しの両方がここを見る */
export interface FormatTraits {
  /** 画面に出す名前 */
  label: string
  /** 7-Zip の -t に渡す名前 */
  type: string
  /** 単独で使うときの拡張子 */
  extension: string
  /** tar を挟んで使うときの拡張子 */
  tarExtension?: string
  /** 複数のファイルをそのまま包めるか。false なら tar を中継する */
  multiFile: boolean
  /** パスワードを掛けられるか */
  password: boolean
  /** 実行するだけで展開できる exe にできるか */
  selfExtracting: boolean
  /** 圧縮の強さを選べるか。tar は詰めないため選べない */
  levels: boolean
}

export const FORMAT_TRAITS: Readonly<Record<ArchiveFormat, FormatTraits>> = {
  zip: {
    label: 'ZIP',
    type: 'zip',
    extension: '.zip',
    multiFile: true,
    password: true,
    selfExtracting: false,
    levels: true
  },
  '7z': {
    label: '7Z',
    type: '7z',
    extension: '.7z',
    multiFile: true,
    password: true,
    selfExtracting: true,
    levels: true
  },
  tar: {
    label: 'TAR',
    type: 'tar',
    extension: '.tar',
    multiFile: true,
    password: false,
    selfExtracting: false,
    levels: false
  },
  gzip: {
    label: 'GZIP',
    type: 'gzip',
    extension: '.gz',
    tarExtension: '.tar.gz',
    multiFile: false,
    password: false,
    selfExtracting: false,
    levels: true
  },
  bzip2: {
    label: 'BZIP2',
    type: 'bzip2',
    extension: '.bz2',
    tarExtension: '.tar.bz2',
    multiFile: false,
    password: false,
    selfExtracting: false,
    levels: true
  },
  xz: {
    label: 'XZ',
    type: 'xz',
    extension: '.xz',
    tarExtension: '.tar.xz',
    multiFile: false,
    password: false,
    selfExtracting: false,
    levels: true
  }
}

/** 圧縮の選択肢を並べる順番 */
export const COMPRESS_FORMATS: readonly ArchiveFormat[] = ['zip', '7z', 'tar', 'gzip', 'bzip2', 'xz']
