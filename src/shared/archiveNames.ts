/**
 * 書庫のファイル名から、中身を表す名前を取り出す。
 *
 * 分割書庫は名前に巻の表記が入る。そのままフォルダ名にすると
 * 「Game.part1」のような中途半端な名前になるため、巻と拡張子の両方を落とす。
 */

/** name.7z.001 のような連番 */
const NUMBERED_VOLUME = /\.\d{3,}$/
/** name.part1.rar のような RAR の分割 */
const RAR_PART = /\.part\d+\.rar$/i
/** 末尾の拡張子。先頭のドットは拡張子とみなさない */
const EXTENSION = /(?!^)\.[^.]+$/

export function archiveStem(fileName: string): string {
  // 連番を先に落とす。7z.001 のような重ね方に対応するため
  const withoutVolume = fileName.replace(NUMBERED_VOLUME, '').replace(RAR_PART, '')
  const stem = withoutVolume.replace(EXTENSION, '')
  return stem === '' ? 'extracted' : stem
}
