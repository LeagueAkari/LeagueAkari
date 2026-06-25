import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DelayedTaskScheduler } from './delayed-task-scheduler'

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

describe('DelayedTaskScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('replaces pending tasks with the same key', async () => {
    const scheduler = new DelayedTaskScheduler()
    const first = vi.fn()
    const second = vi.fn()

    scheduler.add('setting-key', first, 1000)
    scheduler.add('setting-key', second, 1000)

    await vi.advanceTimersByTimeAsync(1000)

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('does not flush a task again after its timer has completed', async () => {
    const scheduler = new DelayedTaskScheduler()
    const task = vi.fn()

    scheduler.add('setting-key', task, 1000)
    await vi.advanceTimersByTimeAsync(1000)
    await scheduler.flush()

    expect(task).toHaveBeenCalledTimes(1)
  })

  it('flush waits for a task that already started from its timer', async () => {
    const scheduler = new DelayedTaskScheduler()
    const taskCompletion = deferred()
    const task = vi.fn(() => taskCompletion.promise)
    const onComplete = vi.fn()

    scheduler.add('setting-key', task, 1000, { onComplete })
    await vi.advanceTimersByTimeAsync(1000)

    const flushPromise = scheduler.flush()
    await vi.advanceTimersByTimeAsync(0)

    expect(task).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()

    taskCompletion.resolve()
    await flushPromise

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('only runs the latest pending task for the same key after a running task finishes', async () => {
    const scheduler = new DelayedTaskScheduler()
    const calls: string[] = []
    const firstCompletion = deferred()

    scheduler.add(
      'setting-key',
      async () => {
        calls.push('first-start')
        await firstCompletion.promise
        calls.push('first-end')
      },
      1000
    )

    await vi.advanceTimersByTimeAsync(1000)

    scheduler.add(
      'setting-key',
      () => {
        calls.push('second')
      },
      1000
    )

    await vi.advanceTimersByTimeAsync(500)

    scheduler.add(
      'setting-key',
      () => {
        calls.push('third')
      },
      1000
    )

    const flushPromise = scheduler.flush()
    await vi.advanceTimersByTimeAsync(0)

    expect(calls).toEqual(['first-start'])

    firstCompletion.resolve()
    await flushPromise

    expect(calls).toEqual(['first-start', 'first-end', 'third'])
  })
})
