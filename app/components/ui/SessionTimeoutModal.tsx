'use client'

import { Clock3, LogOut, ShieldCheck } from 'lucide-react'
import { ConfirmModal } from '@/app/components/ui/ConfirmModal'
import { formatCountdown } from '@/app/lib'

interface SessionTimeoutModalProps {
  open: boolean
  secondsLeft: number
  onStaySignedIn: () => void
  onLogoutNow: () => void
  loading?: boolean
}

export function SessionTimeoutModal({
  open,
  secondsLeft,
  onStaySignedIn,
  onLogoutNow,
  loading = false,
}: SessionTimeoutModalProps) {
  return (
    <ConfirmModal
      open={open}
      title="Session expiring soon"
      description="You’ve been inactive for a while."
      confirmText="Stay Signed In"
      cancelText="Log Out Now"
      loading={loading}
      onConfirm={onStaySignedIn}
      onCancel={onLogoutNow}
      disableBackdropClose
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>

            <div>
              <div className="text-sm text-zinc-600">Automatic logout in</div>
              <div
                className={`text-2xl font-semibold ${
                  secondsLeft <= 30
                    ? 'text-red-600 animate-pulse'
                    : 'text-zinc-900'
                }`}
              >
                {formatCountdown(secondsLeft)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
            <ShieldCheck className="h-4 w-4" />
            Security reminder
          </div>

          <p className="text-sm text-zinc-600">
            Staying signed in will reset your inactivity timer. Logging out
            helps protect your account on shared or unattended devices.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <LogOut className="h-3.5 w-3.5" />
          This applies across your open tabs.
        </div>
      </div>
    </ConfirmModal>
  )
}
