import { cn } from '@/lib/cn'

export const PRIMARY_BUTTON = cn(
  'h-8 rounded-control bg-accent px-3 text-fluid font-medium text-white',
  'transition-all duration-fast ease-fluent hover:bg-accent-hover active:scale-[0.98]',
  'disabled:pointer-events-none disabled:opacity-40'
)

export const SECONDARY_BUTTON = cn(
  'h-8 rounded-control border border-line px-3 text-fluid text-primary',
  'transition-colors duration-fast ease-fluent hover:bg-subtle-hover',
  'disabled:pointer-events-none disabled:opacity-40'
)
