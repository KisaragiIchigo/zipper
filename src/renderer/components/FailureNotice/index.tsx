import { m } from 'framer-motion'
import { FileWarning } from 'lucide-react'
import type { ArchiveFailureKind } from '@shared/types'
import { baseNameOf } from '@/lib/pathUtils'

const MESSAGES: Record<ArchiveFailureKind, string> = {
  'password-required': 'この書庫を開くにはパスワードが必要です。',
  'wrong-password': 'パスワードが正しくありません。',
  busy: 'この書庫は別の窓で書き換えている最中です。終わってからやり直してください。',
  'not-archive': 'このファイルは、対応している書庫として認識できませんでした。',
  'not-found': 'ファイルが見つかりませんでした。移動または削除された可能性があります。',
  corrupted: 'この書庫は壊れています。中身を最後まで読み取れませんでした。',
  unknown: '書庫を開けませんでした。'
}

interface FailureNoticeProps {
  path: string
  kind: ArchiveFailureKind
}

export function FailureNotice({ path, kind }: FailureNoticeProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0, 0, 0, 1] }}
      className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center"
    >
      <FileWarning className="h-12 w-12 text-danger-text" strokeWidth={1} />
      <p className="font-display text-fluid-lg font-medium text-primary">{MESSAGES[kind]}</p>
      <p className="max-w-md truncate text-fluid text-secondary" title={path}>
        {baseNameOf(path)}
      </p>
    </m.div>
  )
}
