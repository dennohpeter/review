import { ReviewInterface } from '@/app/pages/ReviewInterface'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params

  return <ReviewInterface taskId={taskId} />
}
