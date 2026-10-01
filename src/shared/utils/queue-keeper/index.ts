import PQueue, {
  type Options,
  type PriorityQueue,
  type QueueAddOptions,
  TimeoutError
} from 'p-queue'

export interface QueueTaskContext {
  signal: AbortSignal
}

type QueueCreateOptions = {
  id: string
  options?: Options<PriorityQueue, QueueAddOptions>
}

type TaskAddOptions = Omit<QueueAddOptions, 'id'> & { tags?: string | string[] }
type Task<T> = (context: QueueTaskContext) => T | PromiseLike<T>
type TaskOutcome<T> = { status: 'fulfilled'; value: T } | { status: 'rejected'; error: unknown }
type TaskRecord = {
  id: string
  queueId: string
  controller: AbortController
  tags: Set<string>
  removeExternalListener: () => void
}

/**
 * 管理任务实例。任务仍在记录表中时，接受的取消优先于尚未返回的结果或错误。
 * 取消会结束等待；底层异步操作仍需响应 signal，同步代码不能被抢占。
 */
export class QueueKeeper {
  private readonly _queues = new Map<string, PQueue>()
  private readonly _tasks = new Map<string, TaskRecord>()
  private readonly _tags = new Map<string, Set<TaskRecord>>()

  constructor(queues: QueueCreateOptions[] = []) {
    for (const queue of queues) {
      this._queues.set(queue.id, new PQueue(queue.options))
    }
  }

  add<T>(queueId: string, taskId: string, task: Task<T>, options?: TaskAddOptions): Promise<T> {
    return this._schedule(queueId, taskId, task, options, false)
  }

  replace<T>(queueId: string, taskId: string, task: Task<T>, options?: TaskAddOptions): Promise<T> {
    return this._schedule(queueId, taskId, task, options, true)
  }

  private async _schedule<T>(
    queueId: string,
    taskId: string,
    task: Task<T>,
    options: TaskAddOptions = {},
    replace: boolean
  ): Promise<T> {
    const queue = this._getQueue(queueId)
    options.signal?.throwIfAborted()
    const previous = this._tasks.get(taskId)

    if (previous && !replace) {
      throw new Error(`Task ${taskId} already exists in queue ${previous.queueId}`)
    }

    const record: TaskRecord = {
      id: taskId,
      queueId,
      controller: new AbortController(),
      tags: new Set(typeof options.tags === 'string' ? [options.tags] : options.tags),
      removeExternalListener: () => {}
    }

    // 先登记新任务。取消旧任务会触发业务回调，回调可能再次替换同一个 ID。
    this._tasks.set(taskId, record)
    for (const tag of record.tags) {
      const records = this._tags.get(tag) ?? new Set<TaskRecord>()
      records.add(record)
      this._tags.set(tag, records)
    }

    if (options.signal) {
      const externalSignal = options.signal
      const abort = () => this._cancel(record, externalSignal.reason)
      externalSignal.addEventListener('abort', abort, { once: true })
      record.removeExternalListener = () => externalSignal.removeEventListener('abort', abort)
    }

    if (previous) {
      this._cancel(previous)
    }

    const signal = record.controller.signal
    let outcome: TaskOutcome<T>

    // 队列负责排队、并发和超时；先收集执行结果，统一交给 _finishTask 判定。
    try {
      const value = await queue.add(() => this._runTask(task, signal), {
        id: taskId,
        priority: options.priority,
        timeout: options.timeout ?? queue.timeout,
        signal
      })
      outcome = { status: 'fulfilled', value }
    } catch (error) {
      outcome = { status: 'rejected', error }
    }

    return this._finishTask(record, outcome)
  }

  /** 给队列一个可取消的 Promise，底层操作是否真正停止由业务 task 响应 signal。 */
  private async _runTask<T>(task: Task<T>, signal: AbortSignal): Promise<T> {
    const completion = Promise.withResolvers<T>()
    const onAbort = () => completion.reject(signal.reason)

    // 先监听取消，再启动业务函数，业务函数同步触发的取消也能收到。
    signal.addEventListener('abort', onAbort, { once: true })
    try {
      signal.throwIfAborted()
      const operation = task({ signal })
      // 成功、失败、取消都结束同一个 Promise，只有第一次生效。
      // 即使取消先到，仍接收 operation 的迟到错误，避免未处理的拒绝。
      Promise.resolve(operation).then(completion.resolve, completion.reject)
    } catch (error) {
      // 同步抛错也走同一个完成入口。
      completion.reject(error)
    }

    try {
      return await completion.promise
    } finally {
      signal.removeEventListener('abort', onAbort)
    }
  }

  /** 最终判定只在这里发生：取消优先，其次失败，否则成功。 */
  private _finishTask<T>(record: TaskRecord, outcome: TaskOutcome<T>): T {
    const { controller } = record
    try {
      if (outcome.status === 'rejected' && outcome.error instanceof TimeoutError) {
        // 队列超时只结束等待；通知底层取消，并保留 TimeoutError 作为原因。
        controller.abort(outcome.error)
      }

      // await 恢复时可能已经接受了取消，不能再返回旧结果或旧业务错误。
      if (controller.signal.aborted) {
        throw controller.signal.reason
      }

      if (outcome.status === 'rejected') {
        throw outcome.error
      }

      return outcome.value
    } finally {
      this._remove(record)
    }
  }

  private _remove(record: TaskRecord) {
    if (this._tasks.get(record.id) === record) {
      this._tasks.delete(record.id)
    }

    record.removeExternalListener()
    for (const tag of record.tags) {
      const records = this._tags.get(tag)
      records?.delete(record)
      if (records?.size === 0) {
        this._tags.delete(tag)
      }
    }
  }

  private _cancel(record: TaskRecord, reason?: unknown): boolean {
    if (record.controller.signal.aborted) {
      return false
    }

    this._remove(record)
    record.controller.abort(reason)
    return true
  }

  private _getQueue(id: string) {
    const queue = this._queues.get(id)
    if (!queue) {
      throw new Error(`Queue ${id} does not exist`)
    }
    return queue
  }

  hasTask(taskId: string): boolean {
    return this._tasks.has(taskId)
  }

  cancelById(taskId: string): boolean {
    const record = this._tasks.get(taskId)
    return record ? this._cancel(record) : false
  }

  cancelByTags(tags: string | string[], mode: 'and' | 'or' = 'or'): number {
    const list = typeof tags === 'string' ? [tags] : tags
    if (!list.length) {
      return 0
    }

    // 固定本次要取消的任务实例，取消回调中新增的同 ID 任务不属于这一批。
    const records = [...this._tasks.values()].filter((record) =>
      mode === 'and'
        ? list.every((tag) => record.tags.has(tag))
        : list.some((tag) => record.tags.has(tag))
    )
    let cancelledCount = 0
    for (const record of records) {
      if (this._cancel(record)) {
        cancelledCount++
      }
    }
    return cancelledCount
  }

  cancelAll(): number {
    const records = [...this._tasks.values()]
    let cancelledCount = 0
    for (const record of records) {
      if (this._cancel(record)) {
        cancelledCount++
      }
    }
    return cancelledCount
  }

  setConcurrency(id: string, concurrency: number) {
    this._getQueue(id).concurrency = concurrency
  }

  get queues() {
    return new Map(
      [...this._queues].map(([id, queue]) => [
        id,
        {
          size: queue.size,
          pending: queue.pending,
          concurrency: queue.concurrency
        }
      ])
    )
  }

  get tasks() {
    return new Map(
      [...this._tasks].map(([id, record]) => [
        id,
        {
          queueId: record.queueId,
          tags: [...record.tags]
        }
      ])
    )
  }

  get tags() {
    return new Map(
      [...this._tags].map(([tag, records]) => [tag, [...records].map((record) => record.id)])
    )
  }
}

export function isAbortError(error: unknown): error is Error {
  if (!error || typeof error !== 'object') {
    return false
  }

  return (
    ('name' in error && error.name === 'AbortError') ||
    ('code' in error && error.code === 'ERR_CANCELED')
  )
}
