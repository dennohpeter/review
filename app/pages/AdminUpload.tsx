'use client'

import React, { useEffect, useState, useRef, useContext } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { Input } from '@/app/components/ui/Input'
import { Textarea } from '@/app/components/ui/Textarea'
import {
  UploadCloud,
  FileAudio,
  CheckCircle2,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react'
import { AppContext, AuthContext } from '../context'

interface AdminUploadProps {
  onNavigate: (page: string) => void
}

export function AdminUpload({ onNavigate }: AdminUploadProps) {
  const { addTask } = useContext(AppContext)
  const { reviewers: invitedUsers } = useContext(AuthContext)

  const [title, setTitle] = useState('')
  const [transcription, setTranscription] = useState('')
  const [assignedTo, setAssignedTo] = useState<string | undefined>(undefined)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadStep, setUploadStep] = useState<
    'upload' | 'details' | 'success'
  >('upload')

  const reviewers = invitedUsers.filter((u) => u.role === 'reviewer')

  const handleUpload = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setUploadStep('details')
    }, 1500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !transcription) return

    setIsSubmitting(true)
    setTimeout(() => {
      addTask(title, transcription, assignedTo)
      setIsSubmitting(false)
      setUploadStep('success')
    }, 1000)
  }

  if (uploadStep === 'success') {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <h2 className="text-2xl font-bold text-zinc-900 mb-2">
          Upload Successful!
        </h2>

        <p className="text-zinc-600 mb-8">
          The audio file and transcription have been added to the review queue
          {assignedTo &&
            ` and assigned to ${
              reviewers.find((r) => r.id === assignedTo)?.name || 'a reviewer'
            }`}
          .
        </p>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => {
              setTitle('')
              setTranscription('')
              setAssignedTo(undefined)
              setUploadStep('upload')
            }}
          >
            Upload Another
          </Button>

          <Button variant="outline" onClick={() => onNavigate('dashboard')}>
            View Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Upload New Task</h1>
        <p className="text-zinc-600 mt-2">
          Upload an audio file and its initial transcription for review.
        </p>
      </div>

      <Card>
        {uploadStep === 'upload' ? (
          <div
            className="p-12 text-center border-2 border-dashed border-zinc-200 rounded-xl m-4 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer"
            onClick={handleUpload}
          >
            {isSubmitting ? (
              <div className="flex flex-col items-center animate-pulse">
                <UploadCloud className="h-12 w-12 text-zinc-400 mb-4" />
                <p className="text-zinc-900 font-medium">
                  Uploading audio file...
                </p>
                <p className="text-zinc-500 text-sm mt-1">Please wait</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                  <UploadCloud className="h-8 w-8 text-zinc-900" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-1">
                  Click to upload audio
                </h3>
                <p className="text-zinc-500 text-sm mb-6">
                  MP3, WAV, or M4A (Max 50MB)
                </p>
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUpload()
                  }}
                >
                  Select File
                </Button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                  <FileAudio className="h-5 w-5 text-zinc-600" />
                </div>

                <div>
                  <p className="font-medium text-zinc-900">
                    uploaded_interview_recording.mp3
                  </p>
                  <p className="text-xs text-zinc-500">
                    4.2 MB • Uploaded just now
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setUploadStep('upload')}
                >
                  Remove
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Input
                label="Task Title"
                placeholder="e.g., Q3 Earnings Call - Opening Remarks"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Textarea
                label="Initial Transcription"
                placeholder="Paste the generated transcription here..."
                className="min-h-[200px] font-mono text-sm"
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                required
              />

              <ReviewerPicker
                reviewers={reviewers}
                value={assignedTo}
                onChange={setAssignedTo}
              />
            </CardContent>

            <CardFooter className="flex justify-end gap-3 bg-zinc-50/50 border-t border-zinc-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setUploadStep('upload')}
              >
                Cancel
              </Button>

              <Button type="submit" isLoading={isSubmitting}>
                Create Task
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}

function ReviewerPicker({
  reviewers,
  value,
  onChange,
}: {
  reviewers: { id: string; name: string; email: string }[]
  value: string | undefined
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
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-700">
        Assign to Reviewer
      </label>

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm hover:bg-zinc-50 transition-colors"
        >
          {selected ? (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-medium text-zinc-600">
                {selected.name.charAt(0)}
              </div>
              <span className="text-zinc-900">{selected.name}</span>
              <span className="text-zinc-400 text-xs">{selected.email}</span>
            </div>
          ) : (
            <span className="text-zinc-500">Select a reviewer (optional)</span>
          )}

          <ChevronDown
            className={`h-4 w-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-zinc-200 shadow-lg py-1">
            <button
              type="button"
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
              <span>Unassigned</span>
            </button>

            {reviewers.map((r) => (
              <button
                key={r.id}
                type="button"
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
    </div>
  )
}
