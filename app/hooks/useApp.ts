import { generateId } from '@/app/lib'
import { Task } from '@/app/types'

type UseAppParams = {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
}

export const useApp = ({ tasks, setTasks }: UseAppParams) => {
  const addTask = (
    title: string,
    transcription: string,
    assignedTo?: string
  ) => {
    const newTask: Task = {
      id: generateId(),
      title,
      audioUrl: 'mock-audio-new.mp3',
      duration: '00:00',
      transcription,
      status: 'pending',
      createdAt: new Date(),
      assignedTo,
    }

    // IMPORTANT: functional update to avoid stale closure
    setTasks((prev) => [newTask, ...prev])
  }

  const assignTask = (taskId: string, userId: string | undefined) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, assignedTo: userId } : task
      )
    )
  }

  const bulkAssignTasks = (taskIds: string[], userId: string | undefined) => {
    setTasks((prev) =>
      prev.map((task) =>
        taskIds.includes(task.id) ? { ...task, assignedTo: userId } : task
      )
    )
  }

  const updateTaskStatus = (
    taskId: string,
    status: Task['status'],
    suggestions?: string
  ) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              suggestedChanges: suggestions,
              // reviewerId: user.id,
            }
          : task
      )
    )
  }

  return {
    tasks,
    addTask,
    assignTask,
    bulkAssignTasks,
    updateTaskStatus,
  }
}
