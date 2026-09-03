import { useCallback, useEffect, useState } from 'react'
import type { ArchiveFormat, CompressionLevel, ZipEncryption, TaskProgress } from '@shared/types'
import { directoryOf, joinPath } from '@/lib/pathUtils'
import type { FailureKind } from '@/lib/taskView'
import { EMPTY_PROGRESS } from '@/lib/taskTiming'
import { defaultArchiveName } from './compress/archiveName'

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
}

export type CompressState =
  | { status: 'idle' }
  | { status: 'configuring'; sources: string[] }
  | { status: 'running'; progress: TaskProgress; startedAt: number }
  | { status: 'done'; destination: string }
  | { status: 'failed'; kind: FailureKind }

export const DEFAULT_SETTINGS: CompressSettings = {
  format: 'zip',
  level: 5,
  password: '',
  encryptHeader: true,
  // ZipCrypto は既知平文攻撃に弱いため、既定は AES256 とする
  zipEncryption: 'AES256',
  volumeSize: '',
  selfExtracting: false
}

export interface CompressController {
  state: CompressState
  /** ファイルを選ばせて設定画面へ進む */
  begin: () => void
  /** すでに決まっている対象で設定画面を開く。シェルの右クリックから使う */
  beginWith: (paths: readonly string[]) => void
  /** 設定画面を挟まず、対象と同じ場所へ既定の設定で作る */
  compressNow: (paths: readonly string[], format: ArchiveFormat) => void
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

  const submit = useCallback((settings: CompressSettings) => {
    setState((current) => {
      if (current.status !== 'configuring') return current
      const sources = current.sources

      void (async () => {
        const sfx = settings.format === '7z' && settings.selfExtracting
        const suggested = defaultArchiveName(sources, settings.format)
        const destination = await window.zipper.dialog.saveArchive(
          sfx ? suggested.replace(/\.7z$/, '.exe') : suggested
        )
        if (destination === null) return

        setState({ status: 'running', progress: EMPTY_PROGRESS, startedAt: Date.now() })
        const result = await window.zipper.archive.create({
          sources,
          destination,
          format: settings.format,
          level: settings.level,
          ...(settings.password === '' ? {} : { password: settings.password }),
          ...(settings.format === '7z' ? { encryptHeader: settings.encryptHeader } : {}),
          ...(settings.format === 'zip' ? { zipEncryption: settings.zipEncryption } : {}),
          // 自己解凍は先頭のファイルだけが実行できるため、分割とは併用しない
          ...(sfx ? { selfExtracting: true } : {}),
          ...(settings.volumeSize === '' || sfx ? {} : { volumeSize: settings.volumeSize })
        })

        setState(
          result.ok
            ? { status: 'done', destination: result.destination }
            : { status: 'failed', kind: result.kind }
        )
      })()

      return current
    })
  }, [])

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

  const close = useCallback(() => setState({ status: 'idle' }), [])
  const cancel = useCallback(() => window.zipper.archive.cancelTask(), [])
  const dismiss = useCallback(() => setState({ status: 'idle' }), [])
  const reveal = useCallback((destination: string) => window.zipper.shell.reveal(destination), [])

  return {
    state,
    begin,
    beginWith: addPaths,
    compressNow,
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
