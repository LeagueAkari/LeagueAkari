export class DelayedTaskScheduler {
  private _tasks = new Map<string, DelayedTask>()
  private _drains = new Map<string, Promise<void>>()

  add(
    key: string,
    fn: () => Promise<unknown> | unknown,
    delay = 1000,
    config?: { onComplete?: (ret: unknown) => void; onError?: (error: unknown) => void }
  ) {
    const task = this._tasks.get(key)

    if (task) {
      clearTimeout(task.timerId)
    }

    let pendingTask: DelayedTask
    const timerId = setTimeout(() => {
      this._markDueAndDrain(key, pendingTask)
    }, delay)

    pendingTask = { delay, due: false, fn, timerId, ...config }
    this._tasks.set(key, pendingTask)
  }

  /**
   * 删除任务, 对于队列中存在的任务会立即取消
   *
   * @param key
   */
  remove(key: string) {
    const task = this._tasks.get(key)
    if (task) {
      clearTimeout(task.timerId)
      return this._tasks.delete(key)
    }

    return false
  }

  clear() {
    for (const task of this._tasks.values()) {
      clearTimeout(task.timerId)
    }

    this._tasks.clear()
  }

  async flush() {
    const tasks = Array.from(this._tasks.entries())

    for (const [, task] of tasks) {
      clearTimeout(task.timerId)
      task.due = true
    }

    await Promise.all(tasks.map(([key]) => this._ensureDrain(key)))
    await Promise.all(this._drains.values())
  }

  private _markDueAndDrain(key: string, task: DelayedTask) {
    if (this._tasks.get(key) !== task) {
      return
    }

    task.due = true
    void this._ensureDrain(key)
  }

  private async _ensureDrain(key: string) {
    const existingDrain = this._drains.get(key)
    if (existingDrain) {
      return existingDrain
    }

    const drain = (async () => {
      while (true) {
        const task = this._tasks.get(key)
        if (!task?.due) {
          return
        }

        this._tasks.delete(key)
        clearTimeout(task.timerId)
        await this._runTask(task)
      }
    })()

    this._drains.set(key, drain)

    try {
      return await drain
    } finally {
      if (this._drains.get(key) === drain) {
        this._drains.delete(key)
      }
    }
  }

  private async _runTask(task: DelayedTask) {
    try {
      const ret = await task.fn()
      task.onComplete?.(ret)
    } catch (error) {
      task.onError?.(error)
    }
  }
}

interface DelayedTask {
  delay: number
  due: boolean
  fn: () => Promise<unknown> | unknown
  timerId: NodeJS.Timeout
  onComplete?: (ret: unknown) => void
  onError?: (error: unknown) => void
}
