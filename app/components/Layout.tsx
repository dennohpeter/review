'use client'

import React, { useMemo } from 'react'
import { Button } from '@/app/components/ui/Button'
import { Headphones, LogOut } from 'lucide-react'
import { useAuth } from '@/app/hooks/useAuth'
import { UserAvatar } from './ui/UserAvatar'
import { usePathname, useRouter } from 'next/navigation'

interface LayoutProps {
  children: React.ReactNode
}

function pageKeyFromPath(path: string) {
  if (path === '/') return 'dashboard'
  if (path.startsWith('/upload')) return 'upload'
  if (path.startsWith('/invite')) return 'invite'
  if (path.startsWith('/review/')) return 'review'
  return 'dashboard'
}

export function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user: currentUser, logout } = useAuth()

  const currentPage = useMemo(() => pageKeyFromPath(pathname), [pathname])

  const handleLogout = () => logout()

  const onNavigate = (page: string, taskId?: string) => {
    switch (page) {
      case 'dashboard':
        router.push('/')
        break
      case 'upload':
        router.push('/upload')
        break
      case 'invite':
        router.push('/invite')
        break
      case 'review':
        router.push(taskId ? `/review/${taskId}` : '/')
        break
      default:
        router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate('dashboard')}
          >
            <div className="h-8 w-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
              <Headphones className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              AudioScribe
            </span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`hover:text-zinc-900 transition-colors ${
                  currentPage === 'dashboard' ? 'text-zinc-900' : ''
                }`}
              >
                Dashboard
              </button>

              {currentUser?.role === 'admin' && (
                <>
                  <button
                    onClick={() => onNavigate('upload')}
                    className={`hover:text-zinc-900 transition-colors ${
                      currentPage === 'upload' ? 'text-zinc-900' : ''
                    }`}
                  >
                    Upload New
                  </button>

                  <button
                    onClick={() => onNavigate('invite')}
                    className={`hover:text-zinc-900 transition-colors ${
                      currentPage === 'invite' ? 'text-zinc-900' : ''
                    }`}
                  >
                    Team
                  </button>
                </>
              )}
            </nav>

            <div className="h-6 w-px bg-zinc-200 hidden md:block" />

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end mr-1">
                <span className="text-sm font-medium">{currentUser?.name}</span>
                <span className="text-xs text-zinc-500 capitalize">
                  {currentUser?.role}
                </span>
              </div>

              <div className="h-9 w-9 rounded-full bg-zinc-200 overflow-hidden ring-2 ring-white">
                <UserAvatar
                  id={currentUser?.id || ''}
                  name={currentUser?.name || ''}
                  size={36}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Sign Out"
                className="text-zinc-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
