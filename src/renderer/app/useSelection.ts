import { useEffect, useState } from 'react'

export interface SelectionController {
  selected: ReadonlySet<string>
  select: (next: ReadonlySet<string>) => void
}

/** 一覧の選択状態。resetKey が変わったら、前の選択は意味を失うので捨てる */
export function useSelection(resetKey: string | null): SelectionController {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    setSelected(new Set())
  }, [resetKey])

  return { selected, select: setSelected }
}
