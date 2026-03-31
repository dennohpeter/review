import { redirect } from 'next/navigation'
import { ReviewInterface } from '@/app/pages/ReviewInterface'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { formatDuration } from '@/app/lib/utils'
import { AudioItemRow, ReviewRow, Task, TaskStatus } from '@/app/types'

function deriveTaskStatus(reviews: ReviewRow[]): TaskStatus {
  if (!reviews.length) return 'pending'
  if (reviews.some((r) => r.decision === 'suggest')) return 'changes_requested'
  if (reviews.some((r) => r.decision === 'approve')) return 'approved'
  return 'pending'
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  const isAdmin = profile.role === 'admin'

  const [
    { data: audioItems, error: audioError },
    { data: reviews, error: reviewsError },
  ] = await Promise.all([
    supabase
      .from('audio_items')
      .select(
        'id,title,transcript_original,created_at,assigned_to,duration_seconds'
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id,audio_id,decision,created_at')
      .order('created_at', { ascending: false }),
  ])

  if (audioError || reviewsError) {
    throw new Error(audioError?.message || reviewsError?.message)
  }

  const reviewsByAudioId = new Map<string, ReviewRow[]>()

  for (const review of (reviews ?? []) as ReviewRow[]) {
    const current = reviewsByAudioId.get(review.audio_id) ?? []
    current.push(review)
    reviewsByAudioId.set(review.audio_id, current)
  }

  const allTasks: Task[] = ((audioItems ?? []) as AudioItemRow[]).map(
    (item) => {
      const itemReviews = reviewsByAudioId.get(item.id) ?? []

      return {
        id: item.id,
        title: item.title,
        transcription: item.transcript_original,
        status: deriveTaskStatus(itemReviews),
        createdAt: new Date(item.created_at),
        assignedTo: item.assigned_to ?? undefined,
        duration: formatDuration(item.duration_seconds),
      }
    }
  )

  const tasks = isAdmin
    ? allTasks
    : allTasks.filter((t) => t.assignedTo === user.id)

  return <ReviewInterface taskId={taskId} tasks={tasks} />
}
