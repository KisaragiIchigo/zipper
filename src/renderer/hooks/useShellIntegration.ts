import { useCallback, useEffect, useState } from 'react'
import type { ShellIntegrationStatus } from '@shared/types'

export interface ShellIntegrationController {
  status: ShellIntegrationStatus | null
  busy: boolean
  error: string | null
  register: () => void
  unregister: () => void
}

export function useShellIntegration(active: boolean): ShellIntegrationController {
  const [status, setStatus] = useState<ShellIntegrationStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return
    let alive = true
    void window.zipper.shell.integrationStatus().then((next) => {
      if (alive) setStatus(next)
    })
    return () => {
      alive = false
    }
  }, [active])

  const apply = useCallback(async (action: () => Promise<ShellIntegrationStatus>) => {
    setBusy(true)
    setError(null)
    try {
      setStatus(await action())
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'レジストリの更新に失敗しました。時間をおいて再度お試しください。'
      )
    } finally {
      setBusy(false)
    }
  }, [])

  const register = useCallback(() => {
    void apply(() => window.zipper.shell.register())
  }, [apply])

  const unregister = useCallback(() => {
    void apply(() => window.zipper.shell.unregister())
  }, [apply])

  return { status, busy, error, register, unregister }
}
