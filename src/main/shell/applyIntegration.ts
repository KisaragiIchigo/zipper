import { app } from 'electron'
import type { ShellIntegrationStatus } from '@shared/types'
import { buildRegisterScript, buildUnregisterScript, PROBE_KEY } from './buildRegistryScript'
import { notifyAssociationChanged } from './notifyShell'
import { isPackageRegistered } from './packageStatus'
import { importRegistry, keyExists } from './registry'

/** インストーラからも設定画面からも同じ経路を通す */
export async function registerShellIntegration(): Promise<void> {
  await importRegistry(buildRegisterScript(app.getPath('exe')))
  await notifyAssociationChanged()
}

export async function unregisterShellIntegration(): Promise<void> {
  await importRegistry(buildUnregisterScript())
  await notifyAssociationChanged()
}

export async function shellIntegrationStatus(): Promise<ShellIntegrationStatus> {
  const [registered, packageRegistered] = await Promise.all([
    keyExists(PROBE_KEY),
    isPackageRegistered()
  ])

  return {
    registered,
    packageRegistered,
    packaged: app.isPackaged,
    executablePath: app.getPath('exe')
  }
}

/** 画面を出さずに登録だけを行う起動。インストーラとアンインストーラから呼ばれる */
export type ShellCommand = 'register' | 'unregister'

export function parseShellCommand(
  argv: readonly string[],
  packaged: boolean
): ShellCommand | null {
  for (const arg of argv.slice(packaged ? 1 : 2)) {
    if (arg === '--register-shell') return 'register'
    if (arg === '--unregister-shell') return 'unregister'
  }
  return null
}

export async function applyShellCommand(command: ShellCommand): Promise<void> {
  if (command === 'register') await registerShellIntegration()
  else await unregisterShellIntegration()
}
