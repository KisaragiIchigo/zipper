export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeState {
  mode: ThemeMode
  resolved: ResolvedTheme
}

/** 同梱 7-Zip の可用性。解凍系のすべての機能がこれに依存する */
export type SevenZipProbe =
  | { available: true; version: string; path: string }
  | { available: false; reason: string; path: string }

/** ファイル名の解釈に使うコードページ。65001 は UTF-8 */
export type Codepage = 65001 | 932 | 949 | 936 | 950

export interface FilenameEncoding {
  codepage: Codepage
  label: string
  /** 自動判定の確信度（0-1）。手動指定時は 1 */
  confidence: number
  /** 自動判定によるものか。false はユーザーが明示的に選んだ状態 */
  detected: boolean
}

export interface ArchiveEntry {
  /** 表示と保存に使う正しいパス。区切りは / に正規化済み */
  path: string
  /**
   * 7-Zip が認識しているパス。
   * エンコーディングを補正した場合だけ path と食い違い、展開時の指定とリネームに使う。
   */
  sourcePath: string
  isDirectory: boolean
  size: number
  packedSize: number
  /** 7-Zip の出力そのままの日時文字列。空欄なら null */
  modified: string | null
  crc: string | null
  method: string | null
  encrypted: boolean
}

/** 書庫を開けなかった理由。利用者向けの文言は Renderer 側が持つ */
export type ArchiveFailureKind =
  | 'password-required'
  | 'wrong-password'
  | 'not-archive'
  | 'not-found'
  /** 書庫として認識はできたが、中身が途中で切れている等で読み通せない */
  | 'corrupted'
  /** 同じ書庫を別の窓が書き換えている最中 */
  | 'busy'
  | 'unknown'

export interface ArchiveInfo {
  path: string
  /** 7-Zip が判定した書庫の種類（zip / 7z / rar など） */
  type: string
  physicalSize: number
  entries: ArchiveEntry[]
  /** ファイル名のエンコーディング。判定が意味を持たない形式では null */
  encoding: FilenameEncoding | null
  /** 一覧は取得できたが 7-Zip が警告を出した状態。書庫の一部が壊れている可能性がある */
  hasWarning: boolean
  /** いずれかのエントリが暗号化されている。展開にパスワードが必要 */
  hasEncryptedEntry: boolean
}

export type ArchiveResult =
  | { ok: true; info: ArchiveInfo }
  | { ok: false; kind: ArchiveFailureKind }

export interface OpenArchiveRequest {
  path: string
  /** 指定するとファイル名のコードページ推定を行わず、この値で読む */
  codepage?: Codepage
  password?: string
}

/** 起動引数やシェルの右クリックから要求された操作 */
export type LaunchAction =
  | 'open'
  /** 解凍先を選ばせてから展開する */
  | 'extract'
  /** 書庫と同じ場所へ展開する */
  | 'extract-here'
  /** 書庫と同じ場所に、書庫名のフォルダを作って展開する */
  | 'extract-to-folder'
  /** 設定画面を開いてから圧縮する */
  | 'compress'
  /** 既定の設定でその場に ZIP を作る */
  | 'compress-zip'
  /** 既定の設定でその場に 7Z を作る */
  | 'compress-7z'

export interface LaunchIntent {
  action: LaunchAction
  paths: string[]
}

/**
 * 更新の進み具合。
 * 開発中は配布物としての体裁が無く更新を判定できないため、その状態も種類として持つ。
 */
export type UpdateStatus =
  | { phase: 'idle' }
  | { phase: 'unavailable-in-dev' }
  | { phase: 'checking' }
  | { phase: 'up-to-date'; currentVersion: string }
  | { phase: 'available'; version: string; releaseDate: string | null }
  | { phase: 'downloading'; version: string; percent: number }
  | { phase: 'ready'; version: string }
  | { phase: 'failed'; message: string }

/** シェル統合の登録状態 */
export interface ShellIntegrationStatus {
  registered: boolean
  /** 右クリックの 1 階層目に出るほう。インストール時に登録される */
  packageRegistered: boolean
  /** 開発中は electron.exe が登録されるため、実用にならないことを伝える */
  packaged: boolean
  executablePath: string
}

/** 利用者が設定画面で決められる項目 */
export interface AppPreferences {
  /** 圧縮と解凍の両方から外すファイル名。7-Zip のパターン記法をそのまま使う */
  excludePatterns: string[]
  /** 解凍先や保存先を選ぶときに最初に開く場所。空なら書庫と同じ場所 */
  workFolder: string
  /** 起動してすぐに更新を確認するか */
  checkUpdateOnStartup: boolean
  /** エクスプローラーのツールチップに中身の一覧を出すか */
  tooltipEnabled: boolean
  /** ツールチップに並べる件数 */
  tooltipMaxEntries: number
}

export type ArchiveFormat = 'zip' | '7z' | 'tar' | 'gzip' | 'bzip2' | 'xz'

/** 7-Zip の -mx に渡す圧縮レベル */
export type CompressionLevel = 0 | 1 | 5 | 9

/** ZIP の暗号化方式。ZipCrypto は互換性は高いが既知平文攻撃に弱い */
export type ZipEncryption = 'AES256' | 'ZipCrypto'

export interface CreateArchiveRequest {
  sources: string[]
  destination: string
  format: ArchiveFormat
  level: CompressionLevel
  password?: string
  encryptHeader?: boolean
  zipEncryption?: ZipEncryption
  volumeSize?: string
  /** 7z のみ。実行するだけで展開できる exe として書き出す */
  selfExtracting?: boolean
}

/** 展開先に同じ名前のものがあったときに、利用者へ出す問い */
export interface OverwriteQuestion {
  /** 答えと対応づけるための番号 */
  id: number
  /** 対象の書庫の名前 */
  archive: string
  /** ぶつかっている名前。多いときは先頭だけを送る */
  conflicts: string[]
  /** ぶつかっている総数 */
  total: number
}

export interface StartDragRequest {
  path: string
  /** 7-Zip 側の名前と、展開後にあるべき名前の対 */
  targets: { entry: string; displayPath: string }[]
  password?: string
}

export interface ModifyArchiveRequest {
  path: string
  /** 追加するファイル、または取り除く項目（7-Zip 側の名前） */
  targets: string[]
  password?: string
}

export type ModifyArchiveResult =
  | { ok: true }
  | { ok: false; kind: ArchiveFailureKind | 'cancelled' }

export interface TestArchiveRequest {
  path: string
  /** 全体の件数。進捗の表示に使う */
  totalFiles?: number
  password?: string
}

export type TestArchiveResult =
  | { ok: true; failures: string[] }
  | { ok: false; kind: ArchiveFailureKind | 'cancelled' }

export type CreateArchiveResult =
  | { ok: true; destination: string }
  | { ok: false; kind: ArchiveFailureKind | 'cancelled' }

/** 進行中の作業の細かい状態。専用の窓で見せるために使う */
export interface TaskProgress {
  percent: number
  /** 処理を終えた件数 */
  completed: number
  /** 全体の件数。数えられない場合は 0 */
  total: number
  /** いま処理しているファイル */
  currentFile: string
  /** 複数の書庫を続けて処理するときの位置。1 つだけなら付かない */
  archive?: { index: number; total: number; name: string }
}

/** 展開先に同名のファイルがあったときの扱い */
export type OverwriteMode = 'overwrite' | 'skip' | 'rename'

export interface ConflictQuery {
  destination: string
  /** 展開後に生まれるパス。7-Zip 側の名前ではなく、利用者に見えている名前 */
  entries: string[]
}

/** その場で中身を見せられる形式と、その内容 */
export type PreviewContent =
  | { kind: 'image'; dataUrl: string }
  | { kind: 'text'; text: string; encoding: string }
  | { kind: 'unsupported'; reason: string }

export interface PreviewRequest {
  path: string
  entry: string
  displayPath: string
  size: number
  password?: string
}

export type PreviewResult =
  | { ok: true; content: PreviewContent }
  | { ok: false; kind: ArchiveFailureKind | 'cancelled' }

export interface OpenEntryRequest {
  path: string
  /** 7-Zip 側の名前 */
  entry: string
  /** 展開後にあるべき名前 */
  displayPath: string
  password?: string
}

export type OpenEntryResult = { ok: true } | { ok: false; kind: ArchiveFailureKind | 'cancelled' }

/**
 * 書庫 1 つ分の処理が終わったときの結果。
 * まとめて解凍したときに、どれが成功してどれが失敗したかを追えるようにする。
 */
export interface ArchiveOutcome {
  index: number
  total: number
  name: string
  path: string
  ok: boolean
  kind?: ArchiveFailureKind | 'cancelled'
}

/** まとめて解凍するときの宛先の決め方 */
export type BatchDestinationMode = 'here' | 'folder' | 'fixed'

export interface BatchExtractRequest {
  archives: string[]
  mode: BatchDestinationMode
  /** mode が fixed のときの宛先 */
  destination?: string
  overwrite?: OverwriteMode
  password?: string
}

export type BatchExtractResult =
  | { ok: true; destination: string; succeeded: number; failed: number }
  | { ok: false; kind: ArchiveFailureKind | 'cancelled' }

export interface ExtractRequest {
  path: string
  destination: string
  /** 未指定なら書庫全体を展開する。値は 7-Zip 側の名前（sourcePath） */
  entries?: string[]
  /** 7-Zip が作る名前と、あるべき名前が食い違うときの対応 */
  renames?: { from: string; to: string }[]
  /** 同名ファイルがあったときの扱い。未指定なら上書き */
  overwrite?: OverwriteMode
  /** 全体の件数。進捗の表示に使う */
  totalFiles?: number
  password?: string
}

export type ExtractResult =
  | { ok: true; destination: string }
  | { ok: false; kind: ArchiveFailureKind | 'cancelled' }

export interface ZipperApi {
  /** どのように起こされたか。progress なら進み具合だけを見せる */
  launchMode: 'normal' | 'progress'
  theme: {
    get: () => Promise<ThemeState>
    set: (mode: ThemeMode) => Promise<ThemeState>
    onChanged: (listener: (state: ThemeState) => void) => () => void
  }
  sevenZip: {
    probe: () => Promise<SevenZipProbe>
  }
  archive: {
    open: (request: OpenArchiveRequest) => Promise<ArchiveResult>
    /**
     * 実際に開かれる書庫のパスを返す。
     * 分割書庫の続きの巻を渡すと、先頭の巻へ読み替えられる
     */
    resolvePath: (path: string) => Promise<string>
    /** 書庫を選ぶダイアログを開く。取り消された場合は null */
    pick: () => Promise<string | null>
    /** ドロップされた File から実体のパスを得る */
    pathForFile: (file: File) => string
    /** 起動引数で渡された要求を 1 度だけ受け取る。無ければ null */
    takePending: () => Promise<LaunchIntent | null>
    /** 起動後に関連付けなどから要求が届いたとき呼ばれる */
    /** 展開先に既にあるファイルを調べる。返るのは衝突したパスだけ */
    checkConflicts: (query: ConflictQuery) => Promise<string[]>
    /** 書庫の中の 1 件だけを取り出して、関連付けられたアプリで開く */
    openEntry: (request: OpenEntryRequest) => Promise<OpenEntryResult>
    /** 外部のアプリを起こさずに、その場で中身を読む */
    preview: (request: PreviewRequest) => Promise<PreviewResult>
    /** 選んだ項目を取り出し、エクスプローラーへ引き渡せる状態にする */
    startDrag: (request: StartDragRequest) => void
    /** まとめて取り出す途中で、同じ名前のものがあったときに呼ばれる */
    onAskOverwrite: (listener: (question: OverwriteQuestion) => void) => () => void
    /** 上の問いへの答え。null は取りやめ */
    answerOverwrite: (id: number, mode: OverwriteMode | null) => void
    extract: (request: ExtractRequest) => Promise<ExtractResult>
    /** 複数の書庫を続けて取り出す。書庫を開かずに処理する */
    extractBatch: (request: BatchExtractRequest) => Promise<BatchExtractResult>
    create: (request: CreateArchiveRequest) => Promise<CreateArchiveResult>
    /** 中身を読み直して、壊れていないかを確かめる */
    test: (request: TestArchiveRequest) => Promise<TestArchiveResult>
    /** 既存の書庫にファイルを足す。格納先は最上位になる */
    add: (request: ModifyArchiveRequest) => Promise<ModifyArchiveResult>
    /** 書庫から項目を取り除く */
    remove: (request: ModifyArchiveRequest) => Promise<ModifyArchiveResult>
    /** 実行中の展開または圧縮を中断する */
    cancelTask: () => void
    onTaskProgress: (listener: (progress: TaskProgress) => void) => () => void
    /** 書庫 1 つ分が終わるたびに呼ばれる */
    onTaskOutcome: (listener: (outcome: ArchiveOutcome) => void) => () => void
  }
  dialog: {
    /** 展開先フォルダを選ぶ。取り消された場合は null */
    pickDirectory: (defaultPath?: string) => Promise<string | null>
    /** 圧縮するファイルを選ぶ。Windows ではファイルとフォルダを同時に選べないため入口を分ける */
    pickSources: () => Promise<string[]>
    pickSourceFolder: () => Promise<string | null>
    /** 作成する書庫の保存先を決める。取り消された場合は null */
    saveArchive: (defaultName: string) => Promise<string | null>
  }
  update: {
    /** 現在の版と、公開されている最新版を照らし合わせる */
    check: () => Promise<UpdateStatus>
    /** 更新の取得を始める。進み具合は onStatus で届く */
    download: () => void
    /** 取得済みの更新を適用して再起動する */
    install: () => void
    onStatus: (listener: (status: UpdateStatus) => void) => () => void
    currentVersion: () => Promise<string>
  }
  app: {
    /** この窓を閉じる。進み具合だけの窓が役目を終えたときに使う */
    close: () => void
    /** 書庫を新しい窓で開く。1 つにつき 1 窓 */
    openWindows: (paths: readonly string[]) => void
  }
  preferences: {
    get: () => Promise<AppPreferences>
    set: (next: AppPreferences) => Promise<AppPreferences>
  }
  clipboard: {
    /** 文字列を書き込む。ブラウザ側の API は file:// で権限が通らないことがある */
    write: (text: string) => void
  }
  shell: {
    /** エクスプローラーでフォルダを開く */
    reveal: (path: string) => void
    integrationStatus: () => Promise<ShellIntegrationStatus>
    register: () => Promise<ShellIntegrationStatus>
    unregister: () => Promise<ShellIntegrationStatus>
  }
}
