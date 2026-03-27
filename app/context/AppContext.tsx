'use client'

import { createContext } from 'react'
import { Task } from '@/app/types'

interface AppContextType {
  tasks: Task[]
  addTask: (title: string, transcription: string, assignedTo?: string) => void
  assignTask: (taskId: string, userId: string | undefined) => void
  bulkAssignTasks: (taskIds: string[], userId: string | undefined) => void
  updateTaskStatus: (
    taskId: string,
    status: Task['status'],
    suggestions?: string
  ) => void
}

const defaultValue: AppContextType = {
  tasks: [],
  addTask: () => {},
  assignTask: () => {},
  bulkAssignTasks: () => {},
  updateTaskStatus: () => {},
}

export const AppContext = createContext<AppContextType>(defaultValue)
