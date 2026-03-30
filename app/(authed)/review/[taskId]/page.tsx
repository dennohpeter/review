import { ReviewInterface } from '@/app/pages/ReviewInterface'

export default function ReviewPage({ params }: { params: { taskId: string } }) {
  return <ReviewInterface taskId={params.taskId} />
}
