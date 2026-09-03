import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface IconButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** スクリーンリーダー向けの操作名。視覚的なラベルを持たないため必須とする */
  label: string
  children: ReactNode
}

/** Fluent の Subtle button。地は透明で、ホバー時にだけ薄い塗りが乗る */
export function IconButton({ label, children, className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'app-no-drag inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control',
        'text-secondary transition-colors duration-fast ease-fluent',
        'hover:bg-subtle-hover hover:text-primary active:bg-subtle-pressed',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
        'disabled:pointer-events-none disabled:opacity-40',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
