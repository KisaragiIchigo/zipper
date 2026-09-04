import { useCallback, useEffect, useState } from 'react'
import type { ArchiveFormat, CompressionLevel, ZipEncryption, TaskProgress } from '@shared/types'
import { directoryOf, joinPath } from '@/lib/pathUtils'
import type { FailureKind } from '@/lib/taskView'
import { EMPTY_PROGRESS } from '@/lib/taskTiming'
import { defaultArchiveName } from './compress/archiveName'
import {
  buildBatchRequest,
  buildCreateRequest,
  isSelfExtracting
} from './compress/buildCreateRequest'

export interface CompressSettings {
  format: ArchiveFormat
  level: CompressionLevel
  password: string
  /** 7z のみ有効。ファイル名まで暗号化する */
  encryptHeader: boolean
  zipEncryption: ZipEncryption
  /** 7-Zip の記法（100m など）。空なら分割しない */
  volumeSize: string
  /** 7z のみ。実行するだけで展開できる exe にする */
  selfExtracting: boolean
  /** 1 つにまとめず、対象ごとに別々の書庫を作る */
  separateArchives: boolean
}

export type CompressState =
  | { status: 'idle' }
  | { status: 'configuring'; sources: string[] }
  | { status: 'running'; progress: TaskProgress; startedAt: number }
  | { status: 'done'; destination: string; summary?: string }
  | { status: 'failed'; kind: FailureKind }

export const DEFAULT_SETTINGS: CompressSettings = {
  format: 'zip',
  level: 5,
  password: '',
  encryptHeader: true,
  // ZipCrypto は既知平文攻撃に弱いため、既定は AES256 とする
  zipEncryption: 'AES256',
  volumeSize: '',
  selfExtracting: false,
  separateArchives: false
}

/** 何件できたかを 1 行で伝える。まとめて 1 つ作ったときと見分けが付くようにする */
function batchSummary(succeeded: number, failed: number): string {
  const base = succeeded + ' 件の書庫を作成しました'
  return failed > 0 ? base + '（' + failed + ' 件は失敗）' : base
}

export interface CompressController {
  state: CompressState
  /** ファイルを選ばせて設定画面へ進む */
  begin: () => void
  /** すでに決まっている対象で設定画面を開く。シェルの右クリックから使う */
  beginWith: (paths: readonly string[]) => void
  /** 設定画面を挟まず、対象と同じ場所へ既定の設定で作る */
  compressNow: (paths: readonly string[], format: ArchiveFormat) => void
  /** 設定画面を挟まず、対象と同じ場所へ対象ごとの書庫を作る */
  compressEachNow: (paths: readonly string[], format: ArchiveFormat) => void
  addFiles: () => void
  addFolder: () => void
  removeSource: (path: string) => void
  submit: (settings: CompressSettings) => void
  close: () => void
  cancel: () => void
  dismiss: () => void
  reveal: (destination: string) => void
}

export function useCompress(): CompressController {
  const [state, setState] = useState<CompressState>({ status: 'idle' })

  useEffect(
    () =>
      window.zipper.archive.onTaskProgress((progress) => {
        setState((current) => (current.status === 'running' ? { ...current, progress } : current))
      }),
    []
  )

  const addPaths = useCallback((paths: readonly string[]) => {
    if (paths.length === 0) return
    setState((current) => {
      const existing = current.status === 'configuring' ? current.sources : []
      const merged = [...existing]
      for (const path of paths) if (!merged.includes(path)) merged.push(path)
      return { status: 'configuring', sources: merged }
    })
  }, [])

  const begin = useCallback(() => {
    void window.zipper.dialog.pickSources().then(addPaths)
  }, [addPaths])

  const addFiles = begin

  const addFolder = useCallback(() => {
    void window.zipper.dialog.pickSourceFolder().then((path) => {
      if (path !== null) addPaths([path])
    })
  }, [addPaths])

  const removeSource = useCallback((path: string) => {
    setState((current) => {
      if (current.status !== 'configuring') return current
      const sources = current.sources.filter((item) => item !== path)
      return sources.length === 0 ? { status: 'idle' } : { status: 'configuring', sources }
    })
  }, [])

  /** 対象をまとめて 1 つの書庫にする。保存先はファイル名まで選んでもらう */
  const runSingle = useCallback(async (sources: readonly string[], settings: CompressSettings) => {
    const first = sources[0]
    const suggested = defaultArchiveName(sources, settings.format)
    // 対象と同じ場所から開く。別の場所へ出したいときだけ選び直してもらう
    const destination = await window.zipper.dialog.saveArchive(
      isSelfExtracting(settings) ? suggested.replace(/\.7z$/, '.exe') : suggested,
      first === undefined ? undefined : directoryOf(first)
    )
    if (destination === null) return

    setState({ status: 'running', progress: EMPTY_PROGRESS, startedAt: Date.now() })
    const result = await window.zipper.archive.create(
      buildCreateRequest(sources, destination, settings)
    )

    setState(
      result.ok
        ? { status: 'done', destination: result.destination }
        : { status: 'failed', kind: result.kind }
    )
  }, [])

  /**
   * 対象ごとに別々の書庫を作る。
   * 書庫が複数生まれるため、保存先はファイル名ではなく置き場所を選んでもらう。
   */
  const runSeparate = useCallback(
    async (sources: readonly string[], settings: CompressSettings) => {
      const first = sources[0]
      const folder = await window.zipper.dialog.pickDirectory(
        first === undefined ? undefined : directoryOf(first)
      )
      if (folder === null) return

      setState({ status: 'running', progress: EMPTY_PROGRESS, startedAt: Date.now() })
      const result = await window.zipper.archive.createBatch(
        buildBatchRequest(sources, folder, settings)
      )

      if (!result.ok) {
        setState({ status: 'failed', kind: result.kind })
        return
      }

      setState({
        status: 'done',
        destination: result.destination,
        summary: batchSummary(result.succeeded, result.failed)
      })
    },
    []
  )

  const submit = useCallback(
    (settings: CompressSettings) => {
      setState((current) => {
        if (current.status !== 'configuring') return current
        const sources = current.sources

        // 対象が 1 つなら分ける意味がないので、まとめる経路に落とす
        void (settings.separateArchives && sources.length > 1
          ? runSeparate(sources, settings)
          : runSingle(sources, settings))

        return current
      })
    },
    [runSeparate, runSingle]
  )

  const compressNow = useCallback((paths: readonly string[], format: ArchiveFormat) => {
    const first = paths[0]
    if (first === undefined) return

    // 保存先は選ばせない。対象と同じ場所へ、対象の名前で作る
    const destination = joinPath(directoryOf(first), defaultArchiveName(paths, format))

    void (async () => {
      setState({ status: 'running', progress: EMPTY_PROGRESS, startedAt: Date.now() })
      const result = await window.zipper.archive.create({
        sources: [...paths],
        destination,
        format,
        level: DEFAULT_SETTINGS.level
      })
      setState(
        result.ok
          ? { status: 'done', destination: result.destination }
          : { status: 'failed', kind: result.kind }
      )
    })()
  }, [])

  const compressEachNow = useCallback((paths: readonly string[], format: ArchiveFormat) => {
    const first = paths[0]
    if (first === undefined) return

    // 保存先は選ばせない。右クリックで一度に選べるのは同じ場所にあるものだけ
    const destination = directoryOf(first)

    void (async () => {
      setState({ status: 'running', progress: EMPTY_PROGRESS, startedAt: Date.now() })
      const result = await window.zipper.archive.createBatch({
        sources: [...paths],
        destination,
        format,
        level: DEFAULT_SETTINGS.level
      })

      if (!result.ok) {
        setState({ status: 'failed', kind: result.kind })
        return
      }
      setState({
        status: 'done',
        destination: result.destination,
        summary: batchSummary(result.succeeded, result.failed)
      })
    })()
  }, [])

  const close = useCallback(() => setState({ status: 'idle' }), [])
  const cancel = useCallback(() => window.zipper.archive.cancelTask(), [])
  const dismiss = useCallback(() => setState({ status: 'idle' }), [])
  const reveal = useCallback((destination: string) => window.zipper.shell.reveal(destination), [])

  return {
    state,
    begin,
    beginWith: addPaths,
    compressNow,
    compressEachNow,
    addFiles,
    addFolder,
    removeSource,
    submit,
    close,
    cancel,
    dismiss,
    reveal
  }
}
