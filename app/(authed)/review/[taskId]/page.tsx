'use client'

import { use } from 'react'
import { ReviewInterface } from '@/app/pages/ReviewInterface'

export default function ReviewPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = use(params)

  return <ReviewInterface taskId={taskId} />
}
