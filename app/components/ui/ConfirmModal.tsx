import React from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { cn } from '@/app/lib/utils'

interface ConfirmModalProps {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: React.ReactNode
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  danger = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-zinc-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                danger
                  ? 'bg-red-100 text-red-600'
                  : 'bg-amber-100 text-amber-600'
              )}
            >
              {danger ? (
                <Trash2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>

            <div>
              <h3
                id="confirm-modal-title"
                className="text-lg font-semibold text-zinc-900"
              >
                {title}
              </h3>
              {description && (
                <p className="text-sm text-zinc-500">{description}</p>
              )}
            </div>
          </div>

          {children && <div>{children}</div>}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-4">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>

          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
