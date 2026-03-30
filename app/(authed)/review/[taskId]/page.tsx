import { ReviewInterface } from '@/app/pages/ReviewInterface'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params

  console.log('Rendering ReviewPage for taskId:', taskId)

  return <ReviewInterface taskId={taskId} />
}
