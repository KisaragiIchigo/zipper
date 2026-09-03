import { archiveStem } from '@shared/archiveNames'

/** Windows のパスは両方の区切りが混在しうる */
const SEPARATORS = ['/', String.fromCharCode(92)] as const

function lastSeparator(path: string): number {
  return Math.max(path.lastIndexOf(SEPARATORS[0]), path.lastIndexOf(SEPARATORS[1]))
}

/** 末尾の区切りを落とす。フォルダを選んだときに空の名前を返さないため */
function trimTrailing(path: string): string {
  let normalized = path
  while (normalized.length > 1 && SEPARATORS.includes(normalized.slice(-1) as '/')) {
    normalized = normalized.slice(0, -1)
  }
  return normalized
}

export function baseNameOf(path: string): string {
  const normalized = trimTrailing(path)
  const index = lastSeparator(normalized)
  return index < 0 ? normalized : normalized.slice(index + 1)
}

/** 親フォルダ。区切りが無ければ空文字 */
export function directoryOf(path: string): string {
  const normalized = trimTrailing(path)
  const index = lastSeparator(normalized)
  return index < 0 ? '' : normalized.slice(0, index)
}

/** 末尾の拡張子だけを落とす。先頭のドットは拡張子とみなさない */
export function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot <= 0 ? name : name.slice(0, dot)
}

/** 親フォルダと名前をつなぐ。区切りは元のパスに合わせる */
export function joinPath(directory: string, name: string): string {
  if (directory === '') return name
  const separator = directory.includes(SEPARATORS[1]) ? SEPARATORS[1] : SEPARATORS[0]
  return directory + separator + name
}

/**
 * 書庫と同じ場所に、書庫名のフォルダを作って展開する場合の宛先。
 * 巻や拡張子の落とし方は、まとめて解凍する経路と同じ規則に揃える。
 */
export function namedFolderFor(archivePath: string): string {
  return joinPath(directoryOf(archivePath), archiveStem(baseNameOf(archivePath)))
}
