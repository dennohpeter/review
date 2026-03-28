'use client'
import { useState } from 'react'
import { Task } from '@/app/types'
import { AppContext } from './AppContext'
import { useApp } from '@/app/hooks/useApp'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])

  const { addTask, assignTask, bulkAssignTasks, updateTaskStatus } = useApp({
    tasks,
    setTasks,
  })

  return (
    <AppContext.Provider
      value={{
        tasks,
        addTask,
        assignTask,
        bulkAssignTasks,
        updateTaskStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
