import React from 'react'
import { cn } from '@/app/lib/utils'
import { TaskStatus } from '@/app/types'
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: TaskStatus
  variant?: 'default' | 'outline'
}
export function Badge({
  className,
  status,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  const statusStyles = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    changes_requested: 'bg-red-100 text-red-700 border-red-200',
  }
  const defaultStyles = 'bg-zinc-100 text-zinc-900 border-zinc-200'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2',
        status ? statusStyles[status] : defaultStyles,
        className
      )}
      {...props}
    >
      {status ? status.replace('_', ' ') : children}
    </span>
  )
}
