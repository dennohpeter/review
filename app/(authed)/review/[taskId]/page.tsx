'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ReviewInterface } from '@/app/pages/ReviewInterface'

export default function ReviewPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const router = useRouter()
  const { taskId } = use(params)

  const onNavigate = (page: string, nextTaskId?: string) => {
    if (page === 'dashboard') {
      router.push('/')
      return
    }

    if (page === 'review' && nextTaskId) {
      router.push(`/review/${nextTaskId}`)
      return
    }

    if (page === 'upload') {
      router.push('/upload')
      return
    }

    if (page === 'invite') {
      router.push('/invite')
      return
    }

    router.push('/')
  }

  return <ReviewInterface taskId={taskId} onNavigate={onNavigate} />
}
