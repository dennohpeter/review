'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import {
  UploadCloud,
  CheckCircle2,
  ChevronDown,
  FileArchive,
  User as UserIcon,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/app/hooks'
import { ImportSummary } from '@/app/types'

interface AdminUploadProps {
  onNavigate: (page: string) => void
}

export function AdminUpload({ onNavigate }: AdminUploadProps) {
  const { reviewers: invitedUsers } = useAuth()

  const [language, setLanguage] = useState('')
  const [assignedTo, setAssignedTo] = useState<string | undefined>(undefined)
  const [file, setFile] = useState<File | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadStep, setUploadStep] = useState<
    'upload' | 'details' | 'success'
  >('upload')
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const reviewers = invitedUsers.filter((u) => u.role === 'reviewer')

  const handleChooseFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = (selected: File | null) => {
    if (!selected) return

    setError(null)

    if (!selected.name.toLowerCase().endsWith('.zip')) {
      setError('Please choose a ZIP file.')
      return
    }

    setFile(selected)
    setUploadStep('details')
  }

  const resetForm = () => {
    setLanguage('')
    setAssignedTo(undefined)
    setFile(null)
    setError(null)
    setSummary(null)
    setUploadStep('upload')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Please upload a ZIP file.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (language.trim())
        formData.append('language', language.trim().toUpperCase())
      if (assignedTo) formData.append('assigned_to', assignedTo)

      const res = await fetch('/api/admin/import-zip', {
        method: 'POST',
        body: formData,
      })

      const json = (await res.json()) as ImportSummary | { error: string }

      if (!res.ok) {
        throw new Error('error' in json ? json.error : 'Batch import failed')
      }

      setSummary(json as ImportSummary)
      setUploadStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch import failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (uploadStep === 'success' && summary) {
    return (
      <div className="max-w-3xl mx-auto mt-12">
        <div className="text-center mb-8">
          <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Batch Import Complete
          </h2>

          <p className="text-zinc-600">
            Imported {summary.importedCount} matched audio/transcript pair(s)
            {assignedTo &&
              ` and assigned them to ${
                reviewers.find((r) => r.id === assignedTo)?.name || 'a reviewer'
              }`}
            .
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4">
                <div className="text-sm text-zinc-500">Imported</div>
                <div className="text-2xl font-bold text-zinc-900">
                  {summary.importedCount}
                </div>
              </div>

              <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4">
                <div className="text-sm text-zinc-500">Skipped</div>
                <div className="text-2xl font-bold text-zinc-900">
                  {summary.skippedCount}
                </div>
              </div>

              <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4">
                <div className="text-sm text-zinc-500">Errors</div>
                <div className="text-2xl font-bold text-zinc-900">
                  {summary.errorCount}
                </div>
              </div>
            </div>

            {!!summary.imported.length && (
              <div>
                <h3 className="font-semibold text-zinc-900 mb-2">
                  Imported files
                </h3>
                <div className="rounded-lg border border-zinc-200 divide-y divide-zinc-100">
                  {summary.imported.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 text-sm flex items-center justify-between"
                    >
                      <span className="text-zinc-900">{item.title}</span>
                      <span className="text-emerald-600 font-medium">
                        Imported
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!!summary.errors.length && (
              <div>
                <h3 className="font-semibold text-zinc-900 mb-2">
                  Import errors
                </h3>
                <div className="rounded-lg border border-red-200 bg-red-50 divide-y divide-red-100">
                  {summary.errors.map((item, idx) => (
                    <div
                      key={`${item.file}-${idx}`}
                      className="px-4 py-3 text-sm"
                    >
                      <div className="font-medium text-red-700">
                        {item.file}
                      </div>
                      <div className="text-red-600">{item.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!!summary.skipped.length && (
              <div>
                <h3 className="font-semibold text-zinc-900 mb-2">
                  Skipped files
                </h3>
                <div className="rounded-lg border border-amber-200 bg-amber-50 divide-y divide-amber-100">
                  {summary.skipped.map((item, idx) => (
                    <div
                      key={`${item.file}-${idx}`}
                      className="px-4 py-3 text-sm"
                    >
                      <div className="font-medium text-amber-700">
                        {item.file}
                      </div>
                      <div className="text-amber-600">{item.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex gap-4 justify-center">
            <Button onClick={resetForm}>Import Another ZIP</Button>
            <Button variant="outline" onClick={() => onNavigate('dashboard')}>
              View Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Batch ZIP Import</h1>
        <p className="text-zinc-600 mt-2">
          Upload a ZIP containing audio files and matching transcript files with
          the same base filename, for example: <code>clip001.wav</code> and{' '}
          <code>clip001.txt</code>.
        </p>
      </div>

      <Card>
        {uploadStep === 'upload' ? (
          <div
            className="p-12 text-center border-2 border-dashed border-zinc-200 rounded-xl m-4 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer"
            onClick={handleChooseFile}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
            />

            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                <UploadCloud className="h-8 w-8 text-zinc-900" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">
                Click to upload ZIP batch
              </h3>
              <p className="text-zinc-500 text-sm mb-6">
                ZIP must contain matching audio + transcript pairs
              </p>
              <Button
                variant="secondary"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleChooseFile()
                }}
              >
                Select ZIP File
              </Button>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                  <FileArchive className="h-5 w-5 text-zinc-600" />
                </div>

                <div>
                  <p className="font-medium text-zinc-900">{file?.name}</p>
                  <p className="text-xs text-zinc-500">
                    {file
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB ZIP`
                      : ''}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={resetForm}
                >
                  Remove
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                <div className="font-medium text-zinc-900 mb-2">
                  Expected ZIP format
                </div>
                <div>clip001.wav + clip001.txt</div>
                <div>clip002.mp3 + clip002.txt</div>
                <div>speaker_a_01.m4a + speaker_a_01.txt</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Language (optional)
                </label>

                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="">Infer from transcript</option>
                  <option value="ND">ND (Low German)</option>
                  <option value="HD">HD (High German)</option>
                  <option value="E">E (English)</option>
                </select>

                <p className="text-xs text-zinc-500">
                  If not selected, language will be inferred from transcript
                  tags (ND, HD, E)
                </p>
              </div>

              <ReviewerPicker
                reviewers={reviewers}
                value={assignedTo}
                onChange={setAssignedTo}
              />

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-end gap-3 bg-zinc-50/50 border-t border-zinc-100">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>

              <Button type="submit" isLoading={isSubmitting}>
                Import ZIP Batch
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
