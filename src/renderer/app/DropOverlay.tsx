import { m } from 'framer-motion'
import { PackagePlus } from 'lucide-react'

/** ファイルをウィンドウ上へ運んでいる間だけ現れる、受け入れ先の目印 */
export function DropOverlay() {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: [0, 0, 0, 1] }}
      className="absolute inset-3 z-[40] flex flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-accent bg-accent/[0.06]"
    >
      <PackagePlus className="h-10 w-10 text-accent" strokeWidth={1.25} />
      <p className="font-display text-fluid-lg font-medium text-primary">ドロップして書庫を開く</p>
    </m.div>
  )
}
