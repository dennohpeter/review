'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/app/components/ui/Card'
import { Badge } from '@/app/components/ui/Badge'
import { Button } from '@/app/components/ui/Button'
import {
  PlayCircle,
  Calendar,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronLeft,
  FileAudio,
  Filter,
  ChevronDown,
  CircleDot,
  User as UserIcon,
  CheckSquare,
  Square,
  X,
  Users,
  MinusSquare,
} from 'lucide-react'
import { formatDate, formatDuration } from '@/app/lib/utils'
import {
  AudioItemRow,
  ReviewRow,
  StatusFilter,
  Task,
  TaskStatus,
  User,
  ViewMode,
} from '@/app/types'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks'
import { supabase } from '../lib/supabase/browser'
import { UserAvatar } from '../components/ui/UserAvatar'

const FILTER_OPTIONS: {
  value: StatusFilter
  label: string
  icon: React.ReactNode
  color: string
}[] = [
  {
    value: 'all',
    label: 'All Tasks',
    icon: <CircleDot className="h-3.5 w-3.5" />,
    color: 'text-zinc-500',
  },
  {
    value: 'pending',
    label: 'Pending',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: 'text-amber-500',
  },
  {
    value: 'approved',
    label: 'Approved',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: 'text-emerald-500',
  },
  {
    value: 'changes_requested',
    label: 'Changes Requested',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: 'text-red-500',
  },
]

function deriveTaskStatus(reviews: ReviewRow[]): TaskStatus {
  if (!reviews.length) return 'pending'
  if (reviews.some((r) => r.decision === 'suggest')) return 'changes_requested'
  if (reviews.some((r) => r.decision === 'approve')) return 'approved'
  return 'pending'
}

export function DashPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()

  const onNavigate = (page: string, taskId?: string) => {
    if (page === 'review' && taskId) router.push(`/review/${taskId}`)
    else if (page === 'upload') router.push('/upload')
    else if (page === 'invite') router.push('/invite')
    else router.push('/')
  }

  const [tasks, setTasks] = useState<Task[]>([])
  const [reviewers, setReviewers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
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
              'id,title,transcript_original,created_at,assigned_to,duration_seconds'
            )
            .order('created_at', { ascending: false }),
          supabase
            .from('reviews')
            .select('id,audio_id,decision,created_at')
            .order('created_at', { ascending: false }),
        ])

        if (audioError) throw audioError
        if (reviewsError) throw reviewsError

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

        let fetchedReviewers: User[] = []

        if (currentUser?.role === 'admin') {
          const reviewerRes = await fetch('/api/admin/reviewers')
          const reviewerJson = await reviewerRes.json()

          if (!reviewerRes.ok) {
            throw new Error(reviewerJson.error || 'Failed to fetch reviewers')
          }

          fetchedReviewers = reviewerJson.reviewers ?? []
        }

        if (!mounted) return
        setTasks(mappedTasks)
        setReviewers(fetchedReviewers)
      } catch (err) {
        if (!mounted) return
        setError(
          err instanceof Error ? err.message : 'Failed to load dashboard'
        )
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (currentUser) {
      loadDashboard()
    } else {
      setLoading(false)
      setTasks([])
      setReviewers([])
    }
    return () => {
      mounted = false
    }
  }, [currentUser])

  const visibleTasks = useMemo(() => {
    if (isAdmin) return tasks
    return tasks.filter((t) => t.assignedTo === currentUser?.id)
  }, [tasks, isAdmin, currentUser?.id])

  const filteredTasks = useMemo(() => {
    return statusFilter === 'all'
      ? visibleTasks
      : visibleTasks.filter((t) => t.status === statusFilter)
  }, [visibleTasks, statusFilter])

  const pendingTasks = filteredTasks.filter((t) => t.status === 'pending')
  const completedTasks = filteredTasks.filter((t) => t.status !== 'pending')
  const showSections = statusFilter === 'all'

  const getAssigneeName = (userId?: string) => {
    if (!userId) return undefined
    return reviewers.find((u) => u.id === userId)?.name ?? userId.slice(0, 8)
  }

  const toggleSelect = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const toggleSelectAll = (taskList: Task[]) => {
    const allSelected =
      taskList.length > 0 && taskList.every((t) => selectedIds.has(t.id))

    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) taskList.forEach((t) => next.delete(t.id))
      else taskList.forEach((t) => next.add(t.id))
      return next
    })
  }

  const handleBulkAssign = async (userId: string | undefined) => {
    if (!selectedIds.size) return

    setAssigning(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskIds: Array.from(selectedIds),
          assignedTo: userId ?? null,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to assign tasks')
      }

      setTasks((prev) =>
        prev.map((task) =>
          selectedIds.has(task.id) ? { ...task, assignedTo: userId } : task
        )
      )

      setSelectedIds(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign tasks')
    } finally {
      setAssigning(false)
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  if (loading) {
    return <div className="p-8 text-sm text-zinc-500">Loading tasks...</div>
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">
            {isAdmin ? 'All Transcriptions' : 'My Reviews'}
          </h1>
          <p className="text-zinc-600 mt-2">
            {isAdmin
              ? 'Manage and monitor transcription status.'
              : 'Audio clips assigned to you for review.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusFilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            taskCounts={visibleTasks}
          />

          <ViewToggle viewMode={viewMode} onChange={setViewMode} />

          {isAdmin && (
            <Button onClick={() => onNavigate('upload')}>Upload New</Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {currentUser?.role === 'reviewer' && visibleTasks.length === 0 && (
        <div className="p-12 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
          <UserIcon className="h-10 w-10 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 mb-1">
            No tasks assigned yet
          </h3>
          <p className="text-zinc-500 text-sm">
            Your admin will assign audio files for you to review.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {showSections ? (
          <>
            <TaskSection
              title="Pending Review"
              icon={<AlertCircle className="h-5 w-5 text-amber-500" />}
              tasks={pendingTasks}
              emptyMessage="No pending tasks. Great job!"
              viewMode={viewMode}
              onNavigate={onNavigate}
              getAssigneeName={getAssigneeName}
              showAssignee={isAdmin}
              selectedIds={selectedIds}
              onToggleSelect={isAdmin ? toggleSelect : undefined}
              onToggleSelectAll={
                isAdmin ? () => toggleSelectAll(pendingTasks) : undefined
              }
            />

            <TaskSection
              title="Completed"
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              tasks={completedTasks}
              emptyMessage="No completed tasks yet."
              viewMode={viewMode}
              onNavigate={onNavigate}
              getAssigneeName={getAssigneeName}
              showAssignee={isAdmin}
              selectedIds={selectedIds}
              onToggleSelect={isAdmin ? toggleSelect : undefined}
              onToggleSelectAll={
                isAdmin ? () => toggleSelectAll(completedTasks) : undefined
              }
            />
          </>
        ) : (
          <TaskSection
            title={
              FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label || ''
            }
            icon={FILTER_OPTIONS.find((o) => o.value === statusFilter)?.icon}
            tasks={filteredTasks}
            emptyMessage={`No ${(
              FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label || ''
            ).toLowerCase()} tasks.`}
            viewMode={viewMode}
            onNavigate={onNavigate}
            getAssigneeName={getAssigneeName}
            showAssignee={isAdmin}
            selectedIds={selectedIds}
            onToggleSelect={isAdmin ? toggleSelect : undefined}
            onToggleSelectAll={
              isAdmin ? () => toggleSelectAll(filteredTasks) : undefined
            }
          />
        )}
      </div>

      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          reviewers={reviewers}
          onAssign={handleBulkAssign}
          onClear={clearSelection}
          isLoading={assigning}
        />
      )}
    </div>
  )
}

function BulkActionBar({
  count,
  reviewers,
  onAssign,
  onClear,
  isLoading,
}: {
  count: number
  reviewers: { id: string; name: string; email: string }[]
  onAssign: (userId: string | undefined) => void
  onClear: () => void
  isLoading: boolean
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

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div
        className="bg-zinc-900 text-white rounded-xl shadow-2xl shadow-zinc-900/30 px-5 py-3 flex items-center gap-4"
        ref={ref}
      >
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-medium">
            {count} task{count !== 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="w-px h-6 bg-zinc-700" />

        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setOpen(!open)}
            className="bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-700 gap-2"
            disabled={isLoading}
          >
            <Users className="h-3.5 w-3.5" />
            Assign to...
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </Button>

          {open && (
            <div className="absolute bottom-full mb-2 left-0 w-64 bg-white rounded-lg border border-zinc-200 shadow-lg py-1 text-zinc-900">
              <button
                onClick={() => {
                  onAssign(undefined)
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors text-zinc-600"
              >
                <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center">
                  <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
                </div>
                Unassign All
              </button>
              {reviewers.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onAssign(r.id)
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors text-zinc-600"
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

        <button
          onClick={onClear}
          className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function StatusFilterDropdown({
  value,
  onChange,
  taskCounts,
}: {
  value: StatusFilter
  onChange: (v: StatusFilter) => void
  taskCounts: Task[]
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

  const activeOption = FILTER_OPTIONS.find((o) => o.value === value)!
  const getCount = (status: StatusFilter) =>
    status === 'all'
      ? taskCounts.length
      : taskCounts.filter((t) => t.status === status).length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-2 h-10 px-3 rounded-lg border text-sm font-medium transition-all ${value !== 'all' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'}`}
      >
        <Filter className="h-3.5 w-3.5" />
        <span>{activeOption.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-zinc-200 shadow-lg py-1.5 z-50">
          {FILTER_OPTIONS.map((option) => {
            const count = getCount(option.value)
            const isActive = value === option.value
            return (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-zinc-50 text-zinc-900 font-medium' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}
              >
                <span className={option.color}>{option.icon}</span>
                <span className="flex-1 text-left">{option.label}</span>
                <span
                  className={`text-xs font-mono px-1.5 py-0.5 rounded-md ${isActive ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-100 text-zinc-500'}`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TaskSection({
  title,
  icon,
  tasks,
  emptyMessage,
  viewMode,
  onNavigate,
  getAssigneeName,
  showAssignee,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  title: string
  icon: React.ReactNode
  tasks: Task[]
  emptyMessage: string
  viewMode: ViewMode
  onNavigate: (page: string, taskId?: string) => void
  getAssigneeName: (id?: string) => string | undefined
  showAssignee: boolean
  selectedIds: Set<string>
  onToggleSelect?: (id: string) => void
  onToggleSelectAll?: () => void
}) {
  const [page, setPage] = useState(0)

  const allSelected =
    tasks.length > 0 && tasks.every((t) => selectedIds.has(t.id))
  const someSelected = tasks.some((t) => selectedIds.has(t.id))

  const itemsPerPage = viewMode === 'card' ? 6 : 6
  const totalPages = Math.max(1, Math.ceil(tasks.length / itemsPerPage))

  const safePage = Math.min(page, totalPages - 1)
  const pagedTasks = tasks.slice(
    safePage * itemsPerPage,
    (safePage + 1) * itemsPerPage
  )

  const canPrev = safePage > 0
  const canNext = safePage < totalPages - 1

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {onToggleSelectAll && tasks.length > 0 && (
            <button
              onClick={onToggleSelectAll}
              className="text-zinc-400 hover:text-zinc-700 transition-colors"
              title={allSelected ? 'Deselect all' : 'Select all'}
            >
              {allSelected ? (
                <CheckSquare className="h-5 w-5 text-zinc-900" />
              ) : someSelected ? (
                <MinusSquare className="h-5 w-5 text-zinc-500" />
              ) : (
                <Square className="h-5 w-5" />
              )}
            </button>
          )}
          <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            {icon} {title} ({tasks.length})
          </h2>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!canPrev}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`h-2 rounded-full transition-all ${i === safePage ? 'w-6 bg-zinc-900' : 'w-2 bg-zinc-300 hover:bg-zinc-400'}`}
                />
              ))}
            </div>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="p-8 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200 text-zinc-500">
          {emptyMessage}
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pagedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onNavigate={onNavigate}
              assigneeName={
                showAssignee ? getAssigneeName(task.assignedTo) : undefined
              }
              showAssignee={showAssignee}
              isSelected={selectedIds.has(task.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          {pagedTasks.map((task, i) => (
            <TaskRow
              key={task.id}
              task={task}
              onNavigate={onNavigate}
              isLast={i === pagedTasks.length - 1}
              assigneeName={
                showAssignee ? getAssigneeName(task.assignedTo) : undefined
              }
              assigneeId={task.assignedTo || ''}
              showAssignee={showAssignee}
              isSelected={selectedIds.has(task.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}) {
  return (
    <div className="flex items-center bg-zinc-100 rounded-lg p-1 gap-0.5">
      <button
        onClick={() => onChange('card')}
        className={`p-2 rounded-md transition-all ${viewMode === 'card' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        title="Card view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
        title="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  )
}

function TaskCard({
  task,
  onNavigate,
  assigneeName,
  assigneeId,
  showAssignee,
  isSelected,
  onToggleSelect,
}: {
  task: Task
  onNavigate: (page: string, taskId?: string) => void
  assigneeName?: string
  assigneeId?: string

  showAssignee: boolean
  isSelected: boolean
  onToggleSelect?: (id: string) => void
}) {
  return (
    <Card
      className={`transition-all cursor-pointer group ${isSelected ? 'ring-2 ring-zinc-900 ring-offset-1 shadow-md' : 'hover:shadow-md'}`}
    >
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {onToggleSelect && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleSelect(task.id)
                }}
                className="text-zinc-400 hover:text-zinc-700 transition-colors -ml-1"
              >
                {isSelected ? (
                  <CheckSquare className="h-4.5 w-4.5 text-zinc-900" />
                ) : (
                  <Square className="h-4.5 w-4.5" />
                )}
              </button>
            )}
            <Badge status={task.status}>{task.status}</Badge>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {task.duration}
          </span>
        </div>

        <div onClick={() => onNavigate('review', task.id)}>
          <h3 className="font-semibold text-zinc-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {task.title}
          </h3>
          <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
            {task.transcription}
          </p>
        </div>

        <div
          className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500"
          onClick={() => onNavigate('review', task.id)}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(task.createdAt)}
            </div>
            {showAssignee && (
              <div className="flex items-center gap-1.5">
                <UserAvatar
                  id={assigneeId || ''}
                  name={assigneeName || ''}
                  size={16}
                />
                {assigneeName ? (
                  <span className="text-zinc-700 font-medium">
                    {assigneeName}
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">Unassigned</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-zinc-900 font-medium">
            <PlayCircle className="h-4 w-4" />
            Review
          </div>
        </div>
      </div>
    </Card>
  )
}

function TaskRow({
  task,
  onNavigate,
  isLast,
  assigneeName,
  assigneeId,
  showAssignee,
  isSelected,
  onToggleSelect,
}: {
  task: Task
  onNavigate: (page: string, taskId?: string) => void
  isLast: boolean
  assigneeName?: string
  assigneeId: string
  showAssignee: boolean
  isSelected: boolean
  onToggleSelect?: (id: string) => void
}) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 transition-colors group ${!isLast ? 'border-b border-zinc-100' : ''} ${isSelected ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}
    >
      {onToggleSelect && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect(task.id)
          }}
          className="text-zinc-400 hover:text-zinc-700 transition-colors shrink-0"
        >
          {isSelected ? (
            <CheckSquare className="h-4.5 w-4.5 text-zinc-900" />
          ) : (
            <Square className="h-4.5 w-4.5" />
          )}
        </button>
      )}

      <div
        className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-zinc-200 transition-colors cursor-pointer"
        onClick={() => onNavigate('review', task.id)}
      >
        <FileAudio className="h-5 w-5 text-zinc-500" />
      </div>

      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onNavigate('review', task.id)}
      >
        <h3 className="font-medium text-zinc-900 truncate group-hover:text-blue-600 transition-colors">
          {task.title}
        </h3>
        <p className="text-sm text-zinc-500 truncate mt-0.5">
          {task.transcription}
        </p>
      </div>

      {showAssignee && (
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          {assigneeName ? (
            <div className="inline-flex items-center gap-1.5 text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-full font-medium">
              <UserAvatar id={assigneeId} name={assigneeName} size={16} />
              {assigneeName}
            </div>
          ) : (
            <div className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
              Unassigned
            </div>
          )}
        </div>
      )}

      <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 shrink-0">
        <Calendar className="h-3.5 w-3.5" />
        {formatDate(task.createdAt)}
      </div>

      <span className="text-xs text-zinc-400 font-mono shrink-0">
        {task.duration}
      </span>

      <Badge status={task.status} className="shrink-0" />

      <ChevronRight
        className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0 cursor-pointer"
        onClick={() => onNavigate('review', task.id)}
      />
    </div>
  )
}
