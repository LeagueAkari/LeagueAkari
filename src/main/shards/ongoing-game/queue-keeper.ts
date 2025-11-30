import { TaskOptions } from 'node_modules/p-queue/dist/options'
import PriorityQueue from 'node_modules/p-queue/dist/priority-queue'
import PQueue, { Options, QueueAddOptions } from 'p-queue'

const TASK_TAG = Symbol('task')

type TaskRecord = {
  controller: AbortController
  tags: (string | symbol)[]
}

type QueueCreateOptions = {
  id: string
  options?: Options<PriorityQueue, QueueAddOptions>
}

type TaskAddOptions = QueueAddOptions & { tags?: string | string[] }

/**
 * 我们需要一个方便的管理工具
 */
export class QueueKeeper {
  private _queues = new Map<string, PQueue<PriorityQueue, QueueAddOptions>>()
  private _tasks = new Map<string, TaskRecord>()
  private _tags = new Map<string | symbol, Set<string>>()

  constructor(queues: QueueCreateOptions[] = []) {
    for (const queue of queues) {
      this._queues.set(queue.id, new PQueue(queue.options))
    }
  }

  async add<T>(
    queueId: string,
    taskId: string,
    task: (options: Omit<TaskOptions, 'signal'>) => PromiseLike<T>,
    options?: TaskAddOptions
  ): Promise<T> {
    const queue = this._queues.get(queueId)
    if (!queue) {
      throw new Error(`Queue ${queueId} does not exist`)
    }

    if (this._tasks.has(taskId)) {
      throw new Error(`Task ${taskId} already exists in queue ${queueId}`)
    }

    const controller = new AbortController()
    const tags = ([TASK_TAG] as (string | symbol)[]).concat(
      options?.tags ? (Array.isArray(options.tags) ? options.tags : [options.tags]) : []
    )

    const taskRecord: TaskRecord = { controller, tags }
    const enqueueOptions: QueueAddOptions = {
      ...options,
      id: taskId,
      signal: controller.signal
    }

    for (const tag of tags) {
      if (!this._tags.has(tag)) {
        this._tags.set(tag, new Set())
      }

      this._tags.get(tag)!.add(taskId)
    }

    this._tasks.set(taskId, taskRecord)

    try {
      return await queue.add<T>((o) => task(o), enqueueOptions)
    } finally {
      this._tasks.delete(taskId)
      this._removeTags(tags, taskId)
    }
  }

  private _removeTags(tags: (string | symbol)[], taskId: string) {
    for (const tag of tags) {
      const set = this._tags.get(tag)

      if (set) {
        set.delete(taskId)

        if (set.size === 0) {
          this._tags.delete(tag)
        }
      }
    }
  }

  hasTask(taskId: string): boolean {
    return this._tasks.has(taskId)
  }

  /**
   * 取消某 task
   * @param taskId
   * @returns 是否成功取消
   */
  cancelById(taskId: string): boolean {
    const taskRecord = this._tasks.get(taskId)
    if (!taskRecord) {
      return false
    }

    const { controller, tags } = taskRecord

    controller.abort()

    this._tasks.delete(taskId)
    this._removeTags(tags, taskId)

    return true
  }

  /**
   * 取消某 tags 关联的所有 task
   * @param tags
   * @param mode 'and' | 'or' default 'or'
   */
  cancelByTags(tags: string | string[], mode: 'and' | 'or' = 'or') {
    const tagList = Array.isArray(tags) ? tags : [tags]

    if (tagList.length === 0) {
      return
    }

    const maps = tagList.map((tag) => this._tags.get(tag) || new Set<string>())

    const toCancel =
      mode === 'or'
        ? maps.reduce((acc, set) => acc.union(set))
        : maps.reduce((acc, set) => acc.intersection(set))

    for (const taskId of toCancel) {
      this.cancelById(taskId)
    }
  }

  cancelAll() {
    // internal use
    this.cancelByTags(TASK_TAG as unknown as string)
  }

  setConcurrency(id: string, concurrency: number) {
    const queue = this._queues.get(id)
    if (!queue) {
      throw new Error(`Queue ${id} does not exist`)
    }
    queue.concurrency = concurrency
  }

  get queues() {
    return this._queues
  }

  get tasks() {
    return this._tasks
  }

  get tags() {
    return this._tags
  }
}

export function isAbortError(error: any): error is Error {
  return error instanceof Error && error.name === 'AbortError'
}
