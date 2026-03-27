'use client'

import { useParams, useRouter } from 'next/navigation'
import { ReviewInterface } from '@/app/pages/ReviewInterface'

export default function ReviewList() {
  const router = useRouter()
  const params = useParams<{ taskId: string }>()
  const taskId = params.taskId

  const onNavigate = (page: string, nextTaskId?: string) => {
    if (page === 'dashboard') router.push('/')
    else if (page === 'upload') router.push('/upload')
    else if (page === 'invite') router.push('/invite')
    else if (page === 'review' && nextTaskId)
      router.push(`/review/${nextTaskId}`)
    else router.push('/')
  }

  return <ReviewInterface taskId={taskId} onNavigate={onNavigate} />
}
