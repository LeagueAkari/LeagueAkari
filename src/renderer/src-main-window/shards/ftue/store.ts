import { defineStore } from 'pinia'
import { ref } from 'vue'

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
  const completed = ref<Record<string, boolean>>({})

  const queue = ref<FtueTask[]>([])
  const active = ref<FtueTask | null>(null)

  const log = (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info('[FTUE]', ...args)
    }
  }

  const isCompleted = (id: string) => !!completed.value[id]

  const _drainQueue = () => {
    if (active.value || queue.value.length === 0) {
      return
    }

    active.value = queue.value.shift() || null
  }

  const enqueue = (task: FtueTask) => {
    if (isCompleted(task.id)) {
      log('skip enqueue (completed)', task.id)
      return
    }

    if (active.value?.id === task.id || queue.value.some((t) => t.id === task.id)) {
      log('skip enqueue (duplicated)', task.id)
      return
    }

    log('enqueue', task.id)
    queue.value.push(task)
    _drainQueue()
  }

  const confirmActive = () => {
    if (!active.value) {
      return
    }

    completed.value[active.value.id] = true
    log('confirm', active.value.id, Object.keys(completed.value))
    active.value = null
    _drainQueue()
  }

  const closeActive = () => {
    if (active.value) {
      completed.value[active.value.id] = true
      log('dismiss -> mark completed', active.value.id, Object.keys(completed.value))
    }

    active.value = null
    _drainQueue()
  }

  const reset = (id: string) => {
    delete completed.value[id]
    log('reset', id, Object.keys(completed.value))
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
