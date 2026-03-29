export type UserRole = 'admin' | 'reviewer'

export type TaskStatus = 'pending' | 'approved' | 'changes_requested'

export interface Task {
  id: string
  title: string
  audioUrl?: string
  duration: string
  transcription: string
  status: TaskStatus
  suggestedChanges?: string
  createdAt: Date
  reviewerId?: string
  assignedTo?: string // User ID of assigned reviewer
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string
}

export type ViewMode = 'card' | 'list'
export type StatusFilter = 'all' | TaskStatus

export type AudioItemRow = {
  id: string
  title: string
  transcript_original: string
  created_at: string
  assigned_to: string | null
  duration_seconds: number | null
}

export type MatchedEntry = {
  baseName: string
  audio?: {
    entryName: string
    fileName: string
    ext: string
    data: Buffer
    size: number
  }
  transcript?: {
    entryName: string
    fileName: string
    ext: string
    data: Buffer
    size: number
  }
}

export type ImportSummary = {
  ok: boolean
  importBatchId: string
  importedCount: number
  skippedCount: number
  errorCount: number
  imported: Array<{ id: string; title: string; audio_key: string }>
  skipped: Array<{ file: string; reason: string }>
  errors: Array<{ file: string; reason: string }>
}

export type ReviewerUser = {
  id: string
  name: string
  email: string
  role: 'reviewer' | 'admin'
  avatar?: string
}

export type ReviewRow = {
  id: string
  audio_id: string
  decision: 'approve' | 'suggest'
  suggested_text: string | null
  comment: string | null
  created_at: string
}

export type Reviewer = {
  id: string
  name: string
  email: string
}
