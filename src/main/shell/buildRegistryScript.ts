import { SHELL_EXTENSIONS } from '@shared/archiveFormats'

/**
 * レジストリのキー区切りと .reg のエスケープはバックスラッシュを多用する。
 * ソース上で連続したバックスラッシュは読み違えやすいため、定数として組み立てる。
 */
const BS = String.fromCharCode(92)
const QUOTE = String.fromCharCode(34)

/**
 * 右クリックと「プログラムから開く」に載せる書庫の拡張子。
 * 分割書庫は先頭の巻（.001）を開けば全体が読まれるため、それも対象に含める。
 */
export const ASSOCIATED_EXTENSIONS = SHELL_EXTENSIONS

export const PROG_ID = 'Zipper.Archive'
/** サブメニューの中身を置く場所。複数の入口から同じ内容を参照する */
const EXTRACT_MENU = 'Zipper.ExtractMenu'
const COMPRESS_MENU = 'Zipper.CompressMenu'

export const ROOT_KEY = ['HKEY_CURRENT_USER', 'Software', 'Classes'].join(BS)
/** 登録済みかどうかの判定に使う代表キー */
export const PROBE_KEY = ['HKCU', 'Software', 'Classes', PROG_ID].join(BS)

const HEADER = 'Windows Registry Editor Version 5.00'

function key(...parts: readonly string[]): string {
  return [ROOT_KEY, ...parts].join(BS)
}

/** .reg の文字列値としてのエスケープ。バックスラッシュと引用符を二重化する */
function escapeValue(value: string): string {
  return value.split(BS).join(BS + BS).split(QUOTE).join(BS + QUOTE)
}

function command(exePath: string, flag: string | null): string {
  const parts = [QUOTE + exePath + QUOTE]
  if (flag !== null) parts.push(flag)
  parts.push(QUOTE + '%1' + QUOTE)
  return escapeValue(parts.join(' '))
}

function section(target: string, values: readonly [string, string][]): string {
  const lines = ['[' + target + ']']
  for (const [name, value] of values) {
    const left = name === '' ? '@' : QUOTE + name + QUOTE
    lines.push(left + '=' + QUOTE + value + QUOTE)
  }
  return lines.join('\n')
}

interface MenuItem {
  /** 並び順を決めるキー名。表示は label が使われる */
  id: string
  label: string
  flag: string | null
}

/** サブメニューの中身を組み立てる。項目はキー名の順に並ぶ */
function subMenu(menuKey: string, exePath: string, items: readonly MenuItem[]): string[] {
  const blocks: string[] = []

  for (const item of items) {
    const itemKey = key(menuKey, 'shell', item.id)
    blocks.push(section(itemKey, [['', item.label]]))
    blocks.push(section(itemKey + BS + 'command', [['', command(exePath, item.flag)]]))
  }
  return blocks
}

/**
 * 入口となる 1 段目。ここを押すとサブメニューが開く。
 *
 * ExtendedSubCommandsKey は HKEY_CLASSES_ROOT からの相対で書く。
 * HKCU からの相対で書くと Windows がサブメニューを見つけられず、
 * 代わりにコマンドを実行しようとして「関連付けられたアプリがありません」になる。
 * MultiSelectModel を Player にすると、複数を選んでも 1 度だけ起動して全件を受け取れる。
 */
function entryPoint(target: string, icon: string, menuKey: string): string {
  return section(target, [
    ['MUIVerb', 'Zipper'],
    ['Icon', icon],
    ['MultiSelectModel', 'Player'],
    ['ExtendedSubCommandsKey', menuKey]
  ])
}

/**
 * シェル統合を登録する .reg を組み立てる。
 *
 * 既定のアプリは変更しない。Windows 8 以降、拡張子の既定は UserChoice が優先され、
 * プログラムから書き換えても無効化されるため、OpenWithProgids への登録に留める。
 * 右クリックの項目は SystemFileAssociations に置き、既存の関連付けを壊さない。
 * 操作が複数あるため、1 段目は「Zipper」だけを出し、中身はサブメニューへ入れる。
 */
export function buildRegisterScript(exePath: string): string {
  const icon = escapeValue(exePath) + ',0'
  const blocks: string[] = [HEADER, '']

  blocks.push(section(key(PROG_ID), [['', 'Zipper 書庫']]))
  blocks.push(section(key(PROG_ID, 'DefaultIcon'), [['', icon]]))
  blocks.push(section(key(PROG_ID, 'shell', 'open', 'command'), [['', command(exePath, null)]]))

  // 書庫を右クリックしたときの操作
  blocks.push(
    ...subMenu(EXTRACT_MENU, exePath, [
      { id: '010open', label: 'Zipper で開く', flag: null },
      { id: '020here', label: 'ここに解凍する', flag: '--extract-here' },
      { id: '030folder', label: 'フォルダに分けて解凍する', flag: '--extract-to-folder' },
      { id: '040choose', label: '解凍先を選んで解凍する', flag: '--extract' }
    ])
  )

  // ファイルやフォルダを右クリックしたときの操作
  blocks.push(
    ...subMenu(COMPRESS_MENU, exePath, [
      { id: '010zip', label: 'ZIP に圧縮する', flag: '--compress-zip' },
      { id: '015zipeach', label: '1 つずつ ZIP に圧縮する', flag: '--compress-zip-each' },
      { id: '020sevenzip', label: '7Z に圧縮する', flag: '--compress-7z' },
      { id: '025sevenzipeach', label: '1 つずつ 7Z に圧縮する', flag: '--compress-7z-each' },
      { id: '030choose', label: '設定して圧縮する', flag: '--compress' }
    ])
  )

  for (const extension of ASSOCIATED_EXTENSIONS) {
    // 既定は奪わず、「プログラムから開く」の候補として名乗り出るだけに留める
    blocks.push(section(key(extension, 'OpenWithProgids'), [[PROG_ID, '']]))
    blocks.push(
      entryPoint(key('SystemFileAssociations', extension, 'shell', 'Zipper'), icon, EXTRACT_MENU)
    )
  }

  for (const target of ['*', 'Directory']) {
    blocks.push(entryPoint(key(target, 'shell', 'Zipper'), icon, COMPRESS_MENU))
  }

  return blocks.join('\n\n') + '\n'
}

/** 登録した内容をすべて取り除く .reg を組み立てる */
export function buildUnregisterScript(): string {
  const targets = [key(PROG_ID), key(EXTRACT_MENU), key(COMPRESS_MENU)]

  for (const extension of ASSOCIATED_EXTENSIONS) {
    targets.push(key('SystemFileAssociations', extension, 'shell', 'Zipper'))
    // 以前の版で作られた項目も取り除く
    targets.push(key('SystemFileAssociations', extension, 'shell', 'Zipper.Extract'))
  }
  for (const target of ['*', 'Directory']) {
    targets.push(key(target, 'shell', 'Zipper'))
    targets.push(key(target, 'shell', 'Zipper.Compress'))
  }

  const lines = [HEADER, '']
  for (const target of targets) lines.push('[-' + target + ']', '')

  // OpenWithProgids は他のアプリと共有するキーのため、値だけを消す
  for (const extension of ASSOCIATED_EXTENSIONS) {
    lines.push('[' + key(extension, 'OpenWithProgids') + ']', QUOTE + PROG_ID + QUOTE + '=-', '')
  }
  return lines.join('\n')
}
