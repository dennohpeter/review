'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { Textarea } from '@/app/components/ui/Textarea'
import { Badge } from '@/app/components/ui/Badge'
import { ConfirmModal } from '@/app/components/ui/ConfirmModal'
import { AudioPlayer } from '@/app/components/AudioPlayer'
import {
  Check,
  X,
  ArrowLeft,
  Save,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react'
import { useAuth } from '@/app/hooks'
import { supabase } from '@/app/lib/supabase/browser'
import { ReviewRow, TaskStatus, AudioItemRow, Reviewer } from '@/app/types'
import { UserAvatar } from '@/app/components/ui/UserAvatar'

interface ReviewInterfaceProps {
  taskId: string
  onNavigate: (page: string, taskId?: string) => void
}

function deriveTaskStatus(reviews: ReviewRow[]): TaskStatus {
  if (!reviews.length) return 'pending'
  if (reviews.some((r) => r.decision === 'suggest')) return 'changes_requested'
  if (reviews.some((r) => r.decision === 'approve')) return 'approved'
  return 'pending'
}

export function ReviewInterface({ taskId, onNavigate }: ReviewInterfaceProps) {
  const { user: currentUser } = useAuth()

  const [tasks, setTasks] = useState<AudioItemRow[]>([])
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [reviewsByAudioId, setReviewsByAudioId] = useState<
    Record<string, ReviewRow[]>
  >({})
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(true)
  const [audioLoading, setAudioLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [suggestion, setSuggestion] = useState('')
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [pendingAssignment, setPendingAssignment] = useState<{
    userId?: string
    reviewerName: string
  } | null>(null)

  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const minSwipeDistance = 50

  useEffect(() => {
    let mounted = true

    const load = async () => {
      if (!currentUser) return

      setLoading(true)
      setError(null)

      try {
        const [
          { data: audioItems, error: audioError },
          { data: reviews, error: reviewsError },
        ] = await Promise.all([
          supabase
            .from('audio_items')
            .select(
              'id,title,transcript_original,created_at,assigned_to,audio_key,duration_seconds'
            )
            .order('created_at', { ascending: false }),
          supabase
            .from('reviews')
            .select('id,audio_id,decision,suggested_text,comment,created_at')
            .order('created_at', { ascending: false }),
        ])

        if (audioError) throw audioError
        if (reviewsError) throw reviewsError

        const taskRows = (audioItems ?? []) as AudioItemRow[]

        const groupedReviews: Record<string, ReviewRow[]> = {}
        for (const review of (reviews ?? []) as ReviewRow[]) {
          groupedReviews[review.audio_id] =
            groupedReviews[review.audio_id] ?? []
          groupedReviews[review.audio_id].push(review)
        }

        let reviewerRows: Reviewer[] = []
        if (currentUser.role === 'admin') {
          const reviewerRes = await fetch('/api/admin/users')
          const reviewerJson = await reviewerRes.json()

          if (reviewerRes.ok) {
            reviewerRows = reviewerJson.users ?? []
          }
        }

        if (!mounted) return
        setTasks(taskRows)
        setReviewsByAudioId(groupedReviews)
        setReviewers(reviewerRows)
      } catch (err) {
        if (!mounted) return
        setError(
          err instanceof Error ? err.message : 'Failed to load review page'
        )
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [currentUser])

  const visibleTasks = useMemo(() => {
    if (!currentUser) return []
    if (currentUser.role === 'admin') return tasks
    return tasks.filter((t) => t.assigned_to === currentUser.id)
  }, [tasks, currentUser])

  const currentIndex = visibleTasks.findIndex((t) => t.id === taskId)
  const task = currentIndex >= 0 ? visibleTasks[currentIndex] : undefined
  const prevTask = currentIndex > 0 ? visibleTasks[currentIndex - 1] : undefined
  const nextTask =
    currentIndex >= 0 && currentIndex < visibleTasks.length - 1
      ? visibleTasks[currentIndex + 1]
      : undefined

  const taskReviews = task ? (reviewsByAudioId[task.id] ?? []) : []
  const status = deriveTaskStatus(taskReviews)
  const latestSuggestion =
    [...taskReviews].find((r) => r.decision === 'suggest')?.suggested_text ??
    null

  const assigneeName = task?.assigned_to
    ? reviewers.find((u) => u.id === task.assigned_to)?.name
    : undefined

  const currentTaskId = task?.id
  const currentTranscript = task?.transcript_original
  const currentAudioUrl = currentTaskId ? audioUrls[currentTaskId] : undefined

  useEffect(() => {
    if (!currentTranscript) return
    setSuggestion(latestSuggestion || currentTranscript)
    setMode('view')
  }, [currentTranscript, latestSuggestion])

  useEffect(() => {
    let mounted = true

    const loadAudioUrl = async () => {
      if (!currentTaskId || currentAudioUrl) return

      setAudioLoading(true)

      try {
        const res = await fetch(`/api/audio-url?audioId=${currentTaskId}`)
        const json = await res.json()

        if (!mounted) return

        if (!res.ok) {
          setError(json.error || 'Failed to load audio')
          return
        }

        setAudioUrls((prev) => ({
          ...prev,
          [currentTaskId]: json.url,
        }))
      } finally {
        if (mounted) setAudioLoading(false)
      }
    }

    loadAudioUrl()
    return () => {
      mounted = false
    }
  }, [currentTaskId, currentAudioUrl])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'edit') return
      if (e.key === 'ArrowLeft' && prevTask?.id) {
        onNavigate('review', prevTask.id)
      }
      if (e.key === 'ArrowRight' && nextTask?.id) {
        onNavigate('review', nextTask.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prevTask?.id, nextTask?.id, onNavigate, mode])

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null
    touchStartX.current = e.targetTouches[0].clientX
  }

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const onTouchEnd = () => {
    if (touchStartX.current == null || touchEndX.current == null) return
    const distance = touchStartX.current - touchEndX.current

    if (distance > minSwipeDistance && nextTask?.id) {
      onNavigate('review', nextTask.id)
    }
    if (distance < -minSwipeDistance && prevTask?.id) {
      onNavigate('review', prevTask.id)
    }
  }

  const refreshReviewsForTask = async (audioId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select('id,audio_id,decision,suggested_text,comment,created_at')
      .eq('audio_id', audioId)
      .order('created_at', { ascending: false })

    if (error) throw error

    setReviewsByAudioId((prev) => ({
      ...prev,
      [audioId]: (data ?? []) as ReviewRow[],
    }))
  }

  const handleApprove = async () => {
    if (!task) return

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase.from('reviews').insert({
        audio_id: task.id,
        decision: 'approve',
        suggested_text: null,
        comment: null,
      })

      if (error) throw error

      await refreshReviewsForTask(task.id)
      onNavigate('dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setSaving(false)
    }
  }

  const handleRequestChanges = async () => {
    if (!task) return
    if (!suggestion.trim()) {
      setError('Please enter suggested changes before submitting.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase.from('reviews').insert({
        audio_id: task.id,
        decision: 'suggest',
        suggested_text: suggestion.trim(),
        comment: null,
      })

      if (error) throw error

      await refreshReviewsForTask(task.id)
      onNavigate('dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit changes')
    } finally {
      setSaving(false)
    }
  }

  const requestAssign = (userId: string | undefined) => {
    const reviewerName = userId
      ? (reviewers.find((u) => u.id === userId)?.name ?? 'selected reviewer')
      : 'Unassigned'

    setPendingAssignment({
      userId,
      reviewerName,
    })
  }

  const confirmAssign = async () => {
    if (!task || !pendingAssignment) return

    setAssigning(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds: [task.id],
          assignedTo: pendingAssignment.userId ?? null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to assign reviewer')

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, assigned_to: pendingAssignment.userId ?? null }
            : t
        )
      )

      setPendingAssignment(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign reviewer')
    } finally {
      setAssigning(false)
    }
  }

  if (!loading && !task) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-sm text-zinc-500">
        Task not found
      </div>
    )
  }

  return (
    <div
      className="max-w-4xl mx-auto space-y-6 min-h-[80vh]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="pl-0 hover:bg-transparent hover:text-zinc-600"
          onClick={() => onNavigate('dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-2 bg-white rounded-full border border-zinc-200 p-1 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={loading || !prevTask}
            onClick={() => prevTask && onNavigate('review', prevTask.id)}
            title="Previous Task (Left Arrow)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-xs font-medium text-zinc-500 px-2 min-w-[80px] text-center select-none">
            {loading
              ? 'Loading...'
              : `Task ${currentIndex + 1} of ${visibleTasks.length}`}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={loading || !nextTask}
            onClick={() => nextTask && onNavigate('review', nextTask.id)}
            title="Next Task (Right Arrow)"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {loading ? (
              <>
                <div className="h-8 w-56 rounded bg-zinc-200 animate-pulse" />
                <div className="h-6 w-24 rounded bg-zinc-200 animate-pulse" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-zinc-900">
                  {task?.title}
                </h1>
                <Badge status={status} />
              </>
            )}
          </div>

          <div className="flex items-center gap-4 text-zinc-500 text-sm flex-wrap">
            {loading ? (
              <>
                <div className="h-4 w-48 rounded bg-zinc-100 animate-pulse" />
                <div className="h-4 w-28 rounded bg-zinc-100 animate-pulse" />
              </>
            ) : (
              <>
                <span>
                  Task ID: {task?.id} • Created{' '}
                  {task ? new Date(task.created_at).toLocaleDateString() : ''}
                </span>

                <div className="flex items-center gap-1.5">
                  <UserAvatar
                    id={task?.assigned_to || ''}
                    name={assigneeName || 'Unassigned'}
                    size={16}
                  />
                  {assigneeName ? (
                    <span className="text-zinc-700 font-medium">
                      {assigneeName}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">
                      Unassigned
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!loading && currentUser?.role === 'admin' && (
            <AssignDropdown
              reviewers={reviewers}
              value={task?.assigned_to ?? undefined}
              onChange={requestAssign}
              disabled={assigning}
            />
          )}

          {!loading && currentUser?.role === 'reviewer' && (
            <>
              <Button
                variant="danger"
                onClick={() => setMode('edit')}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Suggest Changes
              </Button>

              <Button
                variant="success"
                onClick={handleApprove}
                disabled={saving}
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading || audioLoading || !task ? (
        <AudioPlayerSkeleton />
      ) : (
        <AudioPlayer
          key={task.id}
          src={audioUrls[task.id]}
          className="shadow-sm"
        />
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="h-full flex flex-col">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl">
            <h3 className="font-semibold text-zinc-900">
              Original Transcription
            </h3>
          </div>

          <div className="p-6 text-zinc-600 leading-relaxed text-lg whitespace-pre-wrap">
            {loading ? (
              <TextBlockSkeleton lines={8} />
            ) : (
              task?.transcript_original
            )}
          </div>
        </Card>

        <Card
          className={`h-full flex flex-col ${
            mode === 'edit' ? 'ring-2 ring-amber-500 ring-offset-2' : ''
          }`}
        >
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl flex justify-between items-center">
            <h3 className="font-semibold text-zinc-900">
              {status === 'changes_requested'
                ? 'Suggested Changes'
                : 'Reviewer Notes'}
            </h3>

            {mode === 'edit' && !loading && (
              <span className="text-xs font-medium text-amber-600 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Editing Mode
              </span>
            )}
          </div>

          <div className="p-6 flex-1 flex flex-col">
            {loading ? (
              <TextBlockSkeleton lines={8} />
            ) : mode === 'edit' ? (
              <>
                <Textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  className="flex-1 min-h-[300px] text-lg leading-relaxed resize-none border-0 focus-visible:ring-0 p-0"
                  placeholder="Make corrections here..."
                />

                <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode('view')}
                  >
                    Cancel
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleRequestChanges}
                    isLoading={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Submit Changes
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-zinc-600 leading-relaxed text-lg">
                {latestSuggestion ? (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-zinc-800 whitespace-pre-wrap">
                    {latestSuggestion}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-sm italic min-h-[200px]">
                    <p>No changes suggested yet.</p>

                    {currentUser?.role === 'reviewer' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setMode('edit')}
                      >
                        Start Editing
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <ConfirmModal
        open={!!pendingAssignment}
        title={
          pendingAssignment?.userId
            ? 'Assign this task?'
            : 'Unassign this task?'
        }
        description={
          pendingAssignment?.userId
            ? `This will assign "${task?.title ?? 'this task'}" to ${pendingAssignment.reviewerName}.`
            : `This will remove the reviewer assignment from "${task?.title ?? 'this task'}".`
        }
        confirmText={
          pendingAssignment?.userId ? 'Confirm Assignment' : 'Confirm Unassign'
        }
        cancelText="Cancel"
        loading={assigning}
        onCancel={() => setPendingAssignment(null)}
        onConfirm={confirmAssign}
      >
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm text-zinc-600">
            {pendingAssignment?.userId ? 'Reviewer' : 'Action'}
          </div>
          <div className="mt-1 font-medium text-zinc-900">
            {pendingAssignment?.reviewerName}
          </div>
          <div className="mt-3 text-sm text-zinc-600">
            Task: {task?.title ?? 'Current task'}
          </div>
        </div>
      </ConfirmModal>
    </div>
  )
}

function AssignDropdown({
  reviewers,
  value,
  onChange,
  disabled,
}: {
  reviewers: { id: string; name: string; email: string }[]
  value?: string
  onChange: (id: string | undefined) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = reviewers.find((r) => r.id === value)

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2"
        disabled={disabled}
      >
        <UserIcon className="h-3.5 w-3.5" />
        {selected ? `Assigned: ${selected.name}` : 'Assign Reviewer'}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg border border-zinc-200 shadow-lg py-1 z-50">
          <button
            onClick={() => {
              onChange(undefined)
              setOpen(false)
            }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors ${
              !value ? 'bg-zinc-50 font-medium' : 'text-zinc-600'
            }`}
          >
            <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center">
              <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
            </div>
            Unassigned
          </button>

          {reviewers.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onChange(r.id)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors ${
                value === r.id
                  ? 'bg-zinc-50 font-medium text-zinc-900'
                  : 'text-zinc-600'
              }`}
            >
              <UserAvatar id={r.id} name={r.name} size={24} />
              {r.name ? (
                <span>{r.name}</span>
              ) : (
                <span className="text-zinc-400 text-xs">{r.email}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AudioPlayerSkeleton() {
  return (
    <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-zinc-200 animate-pulse shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-12 rounded bg-zinc-100 animate-pulse" />
          <div className="h-2 rounded bg-zinc-100 animate-pulse" />
          <div className="flex justify-between">
            <div className="h-3 w-10 rounded bg-zinc-100 animate-pulse" />
            <div className="h-3 w-10 rounded bg-zinc-100 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

function TextBlockSkeleton({ lines = 6 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 rounded bg-zinc-100 animate-pulse ${
            i === lines - 1 ? 'w-2/3' : 'w-full'
          }`}
        />
      ))}
    </div>
  )
}
