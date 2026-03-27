export type UserRole = 'admin' | 'reviewer'

export type TaskStatus = 'pending' | 'approved' | 'changes_requested'

export interface Task {
  id: string
  title: string
  audioUrl: string
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
