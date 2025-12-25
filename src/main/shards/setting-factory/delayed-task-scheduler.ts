export class DelayedTaskScheduler {
  private _tasks: Map<
    string,
    {
      delay: number
      fn: () => Promise<any> | any
      timerId: NodeJS.Timeout
      onComplete?: (ret: any) => void
      onError?: (error: any) => void
    }
  > = new Map()

  async add(
    key: string,
    fn: () => Promise<any> | any,
    delay = 1000,
    config?: { onComplete?: (ret: any) => void; onError?: (error: any) => void }
  ) {
    const task = this._tasks.get(key)

    if (task) {
      clearTimeout(task.timerId)
    }

    const timerId = setTimeout(async () => {
      try {
        const ret = await fn()
        config?.onComplete?.(ret)
      } catch (error) {
        config?.onError?.(error)
      }
    }, delay)

    this._tasks.set(key, { delay, fn, timerId, ...config })
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
    const tasks = Array.from(this._tasks.values())

    for (const task of tasks) {
      clearTimeout(task.timerId)
    }

    this._tasks.clear()

    await Promise.all(
      tasks.map(async ({ fn, onComplete, onError }) => {
        try {
          const ret = await fn()
          onComplete?.(ret)
        } catch (error) {
          onError?.(error)
        }
      })
    )
  }
}
