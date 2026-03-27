'use client'

import React, { useEffect, useState, useRef, useMemo, useContext } from 'react'
import { Card } from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { Textarea } from '@/app/components/ui/Textarea'
import { Badge } from '@/app/components/ui/Badge'
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
import { AppContext, AuthContext } from '../context'

interface ReviewInterfaceProps {
  taskId: string
  onNavigate: (page: string, taskId?: string) => void
}

export function ReviewInterface({ taskId, onNavigate }: ReviewInterfaceProps) {
  const { tasks, updateTaskStatus, assignTask } = useContext(AppContext)
  const { invitedUsers } = useContext(AuthContext)

  // Optional improvement: reviewers should only navigate within assigned tasks
  const visibleTasks = useMemo(() => {
    if (currentUser.role === 'admin') return tasks
    return tasks.filter((t) => t.assignedTo === currentUser.id)
  }, [tasks])

  const currentIndex = visibleTasks.findIndex((t) => t.id === taskId)
  const task = currentIndex >= 0 ? visibleTasks[currentIndex] : undefined
  const prevTask = currentIndex > 0 ? visibleTasks[currentIndex - 1] : undefined
  const nextTask =
    currentIndex >= 0 && currentIndex < visibleTasks.length - 1
      ? visibleTasks[currentIndex + 1]
      : undefined

  const [suggestion, setSuggestion] = useState('')
  const [mode, setMode] = useState<'view' | 'edit'>('view')

  // Swipe State
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const minSwipeDistance = 50

  const reviewers = invitedUsers.filter((u) => u.role === 'reviewer')

  const assigneeName = task?.assignedTo
    ? invitedUsers.find((u) => u.id === task.assignedTo)?.name
    : undefined

  useEffect(() => {
    if (!task) return

    if (task.suggestedChanges) {
      setSuggestion(task.suggestedChanges)
      setMode('view')
    } else if (task.transcription) {
      setSuggestion(task.transcription)
      setMode('view')
    } else {
      setSuggestion('')
      setMode('view')
    }
  }, [task?.id]) // depend on task id (avoids extra resets)

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'edit') return

      if (e.key === 'ArrowLeft' && prevTask) onNavigate('review', prevTask.id)
      if (e.key === 'ArrowRight' && nextTask) onNavigate('review', nextTask.id)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prevTask?.id, nextTask?.id, onNavigate, mode])

  // Swipe Handlers
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

    if (distance > minSwipeDistance && nextTask)
      onNavigate('review', nextTask.id)
    if (distance < -minSwipeDistance && prevTask)
      onNavigate('review', prevTask.id)
  }

  if (!task) return <div>Task not found</div>

  const handleApprove = () => {
    updateTaskStatus(task.id, 'approved')
    onNavigate('dashboard')
  }

  const handleRequestChanges = () => {
    updateTaskStatus(task.id, 'changes_requested', suggestion)
    onNavigate('dashboard')
  }

  return (
    <div
      className="max-w-4xl mx-auto space-y-6 min-h-[80vh]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header Navigation Bar */}
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
            disabled={!prevTask}
            onClick={() => prevTask && onNavigate('review', prevTask.id)}
            title="Previous Task (Left Arrow)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-xs font-medium text-zinc-500 px-2 min-w-[80px] text-center select-none">
            Task {currentIndex + 1} of {visibleTasks.length}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={!nextTask}
            onClick={() => nextTask && onNavigate('review', nextTask.id)}
            title="Next Task (Right Arrow)"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-zinc-900">{task.title}</h1>
            <Badge status={task.status} />
          </div>

          <div className="flex items-center gap-4 text-zinc-500 text-sm">
            <span>
              Task ID: {task.id} • Created{' '}
              {new Date(task.createdAt).toLocaleDateString()}
            </span>

            <span className="flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5" />
              {assigneeName ? (
                <span className="text-zinc-700 font-medium">
                  {assigneeName}
                </span>
              ) : (
                <span className="text-amber-600 font-medium">Unassigned</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentUser.role === 'admin' && (
            <AssignDropdown
              reviewers={reviewers}
              value={task.assignedTo}
              onChange={(userId) => assignTask(task.id, userId)}
            />
          )}

          {task.status === 'pending' && currentUser.role === 'reviewer' && (
            <>
              <Button variant="danger" onClick={() => setMode('edit')}>
                <X className="h-4 w-4 mr-2" />
                Suggest Changes
              </Button>

              <Button variant="success" onClick={handleApprove}>
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          )}
        </div>
      </div>

      <AudioPlayer
        key={task.id}
        src={task.audioUrl}
        duration={task.duration}
        className="shadow-sm"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="h-full flex flex-col">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl">
            <h3 className="font-semibold text-zinc-900">
              Original Transcription
            </h3>
          </div>

          <div className="p-6 text-zinc-600 leading-relaxed text-lg">
            {task.transcription}
          </div>
        </Card>

        <Card
          className={`h-full flex flex-col ${
            mode === 'edit' ? 'ring-2 ring-amber-500 ring-offset-2' : ''
          }`}
        >
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl flex justify-between items-center">
            <h3 className="font-semibold text-zinc-900">
              {task.status === 'changes_requested'
                ? 'Suggested Changes'
                : 'Reviewer Notes'}
            </h3>

            {mode === 'edit' && (
              <span className="text-xs font-medium text-amber-600 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Editing Mode
              </span>
            )}
          </div>

          <div className="p-6 flex-1 flex flex-col">
            {mode === 'edit' ? (
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

                  <Button size="sm" onClick={handleRequestChanges}>
                    <Save className="h-4 w-4 mr-2" />
                    Submit Changes
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-zinc-600 leading-relaxed text-lg">
                {task.suggestedChanges ? (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-zinc-800">
                    {task.suggestedChanges}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-sm italic min-h-[200px]">
                    <p>No changes suggested yet.</p>

                    {task.status === 'pending' &&
                      currentUser.role === 'reviewer' && (
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
    </div>
  )
}

function AssignDropdown({
  reviewers,
  value,
  onChange,
}: {
  reviewers: { id: string; name: string; email: string }[]
  value?: string
  onChange: (id: string | undefined) => void
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
      >
        <UserIcon className="h-3.5 w-3.5" />
        {selected ? `Assigned: ${selected.name}` : 'Assign Reviewer'}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
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
              <div className="h-6 w-6 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-medium text-zinc-600">
                {r.name.charAt(0)}
              </div>
              <span>{r.name}</span>
              <span className="text-zinc-400 text-xs ml-auto">{r.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
