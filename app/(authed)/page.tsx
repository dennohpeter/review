import { DashPage } from '@/app/pages/DashPage'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { formatDuration } from '@/app/lib/utils'
import { redirect } from 'next/navigation'
import { AudioItemRow, ReviewRow, Task, TaskStatus, User } from '@/app/types'

function deriveTaskStatus(reviews: ReviewRow[]): TaskStatus {
  if (!reviews.length) return 'pending'
  if (reviews.some((r) => r.decision === 'suggest')) return 'changes_requested'
  if (reviews.some((r) => r.decision === 'approve')) return 'approved'
  return 'pending'
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, name, email')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  const isAdmin = profile.role === 'admin'

  const audioQuery = supabase
    .from('audio_items')
    .select(
      'id,title,transcript_original,created_at,assigned_to,duration_seconds'
    )
    .order('created_at', { ascending: false })

  const reviewsQuery = supabase
    .from('reviews')
    .select('id,audio_id,decision,created_at')
    .order('created_at', { ascending: false })

  const usersQuery = isAdmin
    ? supabase
        .from('profiles')
        .select('user_id, role, name, email')
        .order('name', { ascending: true })
    : Promise.resolve({ data: [], error: null })

  const [
    { data: audioItems, error: audioError },
    { data: reviews, error: reviewsError },
    { data: userRows, error: usersError },
  ] = await Promise.all([audioQuery, reviewsQuery, usersQuery])

  if (audioError || reviewsError || usersError) {
    throw new Error(
      audioError?.message || reviewsError?.message || usersError?.message
    )
  }

  const reviewsByAudioId = new Map<string, ReviewRow[]>()

  for (const review of (reviews ?? []) as ReviewRow[]) {
    const current = reviewsByAudioId.get(review.audio_id) ?? []
    current.push(review)
    reviewsByAudioId.set(review.audio_id, current)
  }

  const mappedTasks: Task[] = ((audioItems ?? []) as AudioItemRow[]).map(
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

  const initialTasks = isAdmin
    ? mappedTasks
    : mappedTasks.filter((t) => t.assignedTo === user.id)

  const initialUsers: User[] = (
    (userRows ?? []) as Array<{
      user_id: string
      role: 'admin' | 'reviewer'
      name: string | null
      email: string | null
    }>
  ).map((row) => ({
    id: row.user_id,
    role: row.role,
    name: row.name ?? row.email?.split('@')[0] ?? 'User',
    email: row.email ?? '',
    avatar: '',
  }))

  return (
    <DashPage
      initialTasks={initialTasks}
      initialUsers={initialUsers}
      currentUserId={user.id}
      currentUserRole={profile.role}
    />
  )
}
