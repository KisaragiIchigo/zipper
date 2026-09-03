import { useEffect, useState } from 'react'

/** 経過時間を進めるために、動いている間だけ現在時刻を刻む */
export function useTicker(active: boolean, intervalMs = 500): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [active, intervalMs])

  return now
}
