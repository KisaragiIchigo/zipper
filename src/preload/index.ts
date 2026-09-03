import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { IPC } from '@shared/ipc'
import type {
  AppPreferences,
  ArchiveOutcome,
  ArchiveResult,
  BatchExtractRequest,
  BatchExtractResult,
  UpdateStatus,
  PreviewRequest,
  OverwriteMode,
  OverwriteQuestion,
  PreviewResult,
  StartDragRequest,
  ModifyArchiveRequest,
  ModifyArchiveResult,
  TaskProgress,
  TestArchiveRequest,
  TestArchiveResult,
  OpenEntryRequest,
  OpenEntryResult,
  LaunchIntent,
  ShellIntegrationStatus,
  ConflictQuery,
  CreateArchiveRequest,
  CreateArchiveResult,
  ExtractRequest,
  ExtractResult,
  OpenArchiveRequest,
  SevenZipProbe,
  ThemeMode,
  ThemeState,
  ZipperApi
} from '@shared/types'

/** ipcRenderer.on の登録と解除を対で返す。呼び出し側は必ず解除関数を保持する */
function subscribe<T>(channel: string, listener: (value: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, value: T): void => listener(value)
  ipcRenderer.on(channel, handler)
  return () => {
    ipcRenderer.off(channel, handler)
  }
}

/** 描き始める前に決まっている必要があるため、引数から同期的に読む */
const launchMode: ZipperApi['launchMode'] =
  process.argv.some((argument) => argument === '--zipper-mode=progress') ? 'progress' : 'normal'

const api: ZipperApi = {
  launchMode,
  theme: {
    get: () => ipcRenderer.invoke(IPC.themeGet) as Promise<ThemeState>,
    set: (mode: ThemeMode) => ipcRenderer.invoke(IPC.themeSet, mode) as Promise<ThemeState>,
    onChanged: (listener) => subscribe<ThemeState>(IPC.themeChanged, listener)
  },
  sevenZip: {
    probe: () => ipcRenderer.invoke(IPC.sevenZipProbe) as Promise<SevenZipProbe>
  },
  archive: {
    open: (request: OpenArchiveRequest) =>
      ipcRenderer.invoke(IPC.archiveOpen, request) as Promise<ArchiveResult>,
    resolvePath: (path: string) =>
      ipcRenderer.invoke(IPC.archiveResolvePath, path) as Promise<string>,
    pick: () => ipcRenderer.invoke(IPC.archivePick) as Promise<string | null>,
    // Electron 32 以降 File.path は廃止されており、実体パスはこの経路でしか取れない
    pathForFile: (file: File) => webUtils.getPathForFile(file),
    takePending: () =>
      ipcRenderer.invoke(IPC.archivePending) as Promise<LaunchIntent | null>,
    checkConflicts: (query: ConflictQuery) =>
      ipcRenderer.invoke(IPC.archiveCheckConflicts, query) as Promise<string[]>,
    openEntry: (request: OpenEntryRequest) =>
      ipcRenderer.invoke(IPC.archiveOpenEntry, request) as Promise<OpenEntryResult>,
    preview: (request: PreviewRequest) =>
      ipcRenderer.invoke(IPC.archivePreview, request) as Promise<PreviewResult>,
    startDrag: (request: StartDragRequest) => ipcRenderer.send(IPC.archiveStartDrag, request),
    onAskOverwrite: (listener) => subscribe<OverwriteQuestion>(IPC.archiveAskOverwrite, listener),
    answerOverwrite: (id: number, mode: OverwriteMode | null) =>
      ipcRenderer.send(IPC.archiveAnswerOverwrite, { id, mode }),
    extract: (request: ExtractRequest) =>
      ipcRenderer.invoke(IPC.archiveExtract, request) as Promise<ExtractResult>,
    extractBatch: (request: BatchExtractRequest) =>
      ipcRenderer.invoke(IPC.archiveExtractBatch, request) as Promise<BatchExtractResult>,
    create: (request: CreateArchiveRequest) =>
      ipcRenderer.invoke(IPC.archiveCreate, request) as Promise<CreateArchiveResult>,
    test: (request: TestArchiveRequest) =>
      ipcRenderer.invoke(IPC.archiveTest, request) as Promise<TestArchiveResult>,
    add: (request: ModifyArchiveRequest) =>
      ipcRenderer.invoke(IPC.archiveAdd, request) as Promise<ModifyArchiveResult>,
    remove: (request: ModifyArchiveRequest) =>
      ipcRenderer.invoke(IPC.archiveDelete, request) as Promise<ModifyArchiveResult>,
    cancelTask: () => ipcRenderer.send(IPC.archiveTaskCancel),
    onTaskProgress: (listener) => subscribe<TaskProgress>(IPC.archiveTaskProgress, listener),
    onTaskOutcome: (listener) => subscribe<ArchiveOutcome>(IPC.archiveTaskOutcome, listener)
  },
  dialog: {
    pickDirectory: (defaultPath?: string) =>
      ipcRenderer.invoke(IPC.dialogPickDirectory, defaultPath) as Promise<string | null>,
    pickSources: () => ipcRenderer.invoke(IPC.dialogPickSources) as Promise<string[]>,
    pickSourceFolder: () =>
      ipcRenderer.invoke(IPC.dialogPickSourceFolder) as Promise<string | null>,
    saveArchive: (defaultName: string) =>
      ipcRenderer.invoke(IPC.dialogSaveArchive, defaultName) as Promise<string | null>
  },
  update: {
    check: () => ipcRenderer.invoke(IPC.updateCheck) as Promise<UpdateStatus>,
    download: () => ipcRenderer.send(IPC.updateDownload),
    install: () => ipcRenderer.send(IPC.updateInstall),
    onStatus: (listener) => subscribe<UpdateStatus>(IPC.updateStatus, listener),
    currentVersion: () => ipcRenderer.invoke(IPC.appVersion) as Promise<string>
  },
  app: {
    close: () => ipcRenderer.send(IPC.appClose),
    openWindows: (paths: readonly string[]) => ipcRenderer.send(IPC.windowOpen, [...paths])
  },
  preferences: {
    get: () => ipcRenderer.invoke(IPC.preferencesGet) as Promise<AppPreferences>,
    set: (next: AppPreferences) =>
      ipcRenderer.invoke(IPC.preferencesSet, next) as Promise<AppPreferences>
  },
  clipboard: {
    write: (text: string) => ipcRenderer.send(IPC.clipboardWrite, text)
  },
  shell: {
    reveal: (path: string) => ipcRenderer.send(IPC.shellReveal, path),
    integrationStatus: () =>
      ipcRenderer.invoke(IPC.shellIntegrationStatus) as Promise<ShellIntegrationStatus>,
    register: () => ipcRenderer.invoke(IPC.shellRegister) as Promise<ShellIntegrationStatus>,
    unregister: () => ipcRenderer.invoke(IPC.shellUnregister) as Promise<ShellIntegrationStatus>
  }
}

contextBridge.exposeInMainWorld('zipper', api)
