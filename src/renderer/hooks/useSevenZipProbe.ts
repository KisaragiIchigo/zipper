import { useEffect, useState } from 'react'
import type { SevenZipProbe } from '@shared/types'

/** 同梱 7-Zip の可用性。null は判定前を意味する */
export function useSevenZipProbe(): SevenZipProbe | null {
  const [probe, setProbe] = useState<SevenZipProbe | null>(null)

  useEffect(() => {
    let alive = true
    void window.zipper.sevenZip.probe().then((result) => {
      if (alive) setProbe(result)
    })
    return () => {
      alive = false
    }
  }, [])

  return probe
}
