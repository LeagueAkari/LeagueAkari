import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export interface FtueTask {
  id: string
  title: string
  description: string
  targetSelector: string
  placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right'
  spotlightPadding?: number
  offset?: number
  dismissOnMaskClick?: boolean
  confirmText?: string
}

export const useFtueStore = defineStore('shard:ftue-renderer', () => {
  const completed = reactive<Record<string, boolean>>({})

  const queue = ref<FtueTask[]>([])
  const active = ref<FtueTask | null>(null)

  const isCompleted = (id: string) => !!completed[id]

  const _drainQueue = () => {
    if (active.value || queue.value.length === 0) {
      return
    }

    active.value = queue.value.shift() || null
  }

  const enqueue = (task: FtueTask) => {
    if (isCompleted(task.id)) {
      return
    }

    if (active.value?.id === task.id || queue.value.some((t) => t.id === task.id)) {
      return
    }

    queue.value.push(task)
    _drainQueue()
  }

  const confirmActive = () => {
    if (!active.value) {
      return
    }

    completed[active.value.id] = true
    active.value = null
    _drainQueue()
  }

  const closeActive = () => {
    active.value = null
    _drainQueue()
  }

  const reset = (id: string) => {
    delete completed[id]
  }

  return {
    completed,
    queue,
    active,
    isCompleted,
    enqueue,
    confirmActive,
    closeActive,
    reset
  }
})
