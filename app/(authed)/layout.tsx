'use client'

import { useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Layout } from '@/app/components/Layout'
import { useAuth } from '../hooks'

function pageKeyFromPath(path: string) {
  if (path === '/') return 'dashboard'
  if (path.startsWith('/upload')) return 'upload'
  if (path.startsWith('/invite')) return 'invite'
  if (path.startsWith('/review/')) return 'review'
  return 'dashboard'
}

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const currentPage = useMemo(() => pageKeyFromPath(pathname), [pathname])
  const { user, isLoading } = useAuth()

  const handleNavigate = (page: string, taskId?: string) => {
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [user, isLoading, router])
  return (
    <Layout onNavigate={handleNavigate} currentPage={currentPage}>
      {children}
    </Layout>
  )
}
