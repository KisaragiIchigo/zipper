import { m } from 'framer-motion'
import { PackageOpen } from 'lucide-react'

/** アーカイブを開いていないときの待機画面 */
export function EmptyState() {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0, 0, 0, 1] }}
      className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center"
    >
      <PackageOpen className="h-12 w-12 text-muted" strokeWidth={1} />
      <p className="font-display text-fluid-lg font-medium text-primary">
        アーカイブが開かれていません
      </p>
      <p className="max-w-md text-fluid text-secondary">
        ZIP、7Z、RAR、TAR などの書庫ファイルをこのウィンドウにドラッグ＆ドロップすると、
        中身の一覧を表示します。
      </p>
    </m.div>
  )
}
