import { CanceledError } from 'axios'
import { getEventListeners } from 'node:events'
import { describe, expect, it } from 'vitest'

import { QueueKeeper, isAbortError } from '.'

function deferred<T = void>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

const nextTurn = () => new Promise<void>((resolve) => setImmediate(resolve))

function observe<T>(promise: Promise<T>) {
  return promise.then(
    (value) => ({ status: 'fulfilled', value }) as const,
    (reason) => ({ status: 'rejected', reason }) as const
  )
}

describe('QueueKeeper', () => {
  it('keeps a replacement tracked after the cancelled task settles', async () => {
    const keeper = new QueueKeeper([{ id: 'network' }])
    const oldWork = deferred()
    const newWork = deferred()
    const first = keeper.add('network', 'hero', () => oldWork.promise, { tags: ['opgg'] })
    const firstRejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
    keeper.cancelById('hero')
    const second = keeper.add('network', 'hero', () => newWork.promise, { tags: ['opgg'] })
    const secondRejected = expect(second).rejects.toMatchObject({ name: 'AbortError' })
    await firstRejected
    expect(keeper.hasTask('hero')).toBe(true)
    expect(keeper.cancelByTags('opgg')).toBe(1)
    await secondRejected
    oldWork.resolve()
    newWork.resolve()
    expect(keeper.tasks.size).toBe(0)
  })

  it('rejects pre-cancelled work without replacing valid work', async () => {
    const keeper = new QueueKeeper([{ id: 'network' }])
    const pending = deferred()
    const first = keeper.add('network', 'hero', () => pending.promise)
    const abort = new AbortController()
    abort.abort()
    let started = false
    await expect(
      keeper.replace(
        'network',
        'hero',
        () => {
          started = true
        },
        {
          signal: abort.signal
        }
      )
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(started).toBe(false)
    expect(keeper.hasTask('hero')).toBe(true)
    pending.resolve()
    await first
  })

  it('propagates external cancellation to running and queued tasks', async () => {
    const keeper = new QueueKeeper([{ id: 'network', options: { concurrency: 1 } }])
    const work = deferred()
    const external = new AbortController()
    let signal!: AbortSignal
    let queuedStarted = false
    const first = keeper.add(
      'network',
      'first',
      (context) => {
        signal = context.signal
        return work.promise
      },
      { signal: external.signal }
    )
    const second = keeper.add(
      'network',
      'second',
      () => {
        queuedStarted = true
      },
      {
        signal: external.signal
      }
    )
    const rejected = Promise.all([
      expect(first).rejects.toMatchObject({ name: 'AbortError' }),
      expect(second).rejects.toMatchObject({ name: 'AbortError' })
    ])
    external.abort()
    await rejected
    expect(signal.aborted).toBe(true)
    expect(queuedStarted).toBe(false)
    expect(keeper.tasks.size).toBe(0)
    work.resolve()
  })

  it.each(['success', 'pending', 'failure', 'throw'] as const)(
    'rejects synchronous startup cancellation followed by %s and releases the queue',
    async (completion) => {
      const keeper = new QueueKeeper([{ id: 'network', options: { concurrency: 1 } }])
      const work = deferred<string>()
      const taskError = new Error('old task failed')
      let outcome: Awaited<ReturnType<typeof observe<string>>> | undefined
      const first = observe(
        keeper.add('network', 'hero', () => {
          keeper.cancelById('hero')
          if (completion === 'throw') {
            throw taskError
          }
          if (completion === 'success') {
            return 'old value'
          }
          if (completion === 'failure') {
            work.reject(taskError)
          }
          return work.promise
        })
      ).then((result) => {
        outcome = result
      })
      let nextStarted = false
      const second = keeper.add('network', 'next', () => {
        nextStarted = true
      })

      // One event-loop turn drains the microtasks without waiting for the old operation.
      await nextTurn()
      const immediately = { outcome, nextStarted }
      work.resolve('late value')
      await Promise.all([first, second])

      expect(immediately.outcome).toMatchObject({
        status: 'rejected',
        reason: { name: 'AbortError' }
      })
      expect(immediately.nextStarted).toBe(true)
      expect(keeper.tasks.size).toBe(0)
    }
  )

  it.each(['resolve-cancel', 'reject-cancel', 'cancel-resolve', 'cancel-reject'] as const)(
    'honors accepted cancellation when completion and cancellation share a turn: %s',
    async (order) => {
      const keeper = new QueueKeeper([{ id: 'network' }])
      const work = deferred<string>()
      const external = new AbortController()
      const reason = new Error('caller cancelled')
      const result = observe(
        keeper.add('network', 'hero', () => work.promise, { signal: external.signal })
      )
      for (const action of order.split('-')) {
        if (action === 'cancel') {
          external.abort(reason)
        } else if (action === 'resolve') {
          work.resolve('old value')
        } else {
          work.reject(new Error('old failure'))
        }
      }

      expect(await result).toEqual({ status: 'rejected', reason })
      expect(getEventListeners(external.signal, 'abort')).toHaveLength(0)
    }
  )

  it('observes late failures after startup cancellation without leaving abort listeners', async () => {
    const keeper = new QueueKeeper([{ id: 'network' }])
    const work = deferred()
    const external = new AbortController()
    let taskSignal!: AbortSignal
    const result = observe(
      keeper.add(
        'network',
        'hero',
        ({ signal }) => {
          taskSignal = signal
          external.abort()
          return work.promise
        },
        { signal: external.signal }
      )
    )
    await nextTurn()
    work.reject(new Error('late failure'))
    expect(await result).toMatchObject({ status: 'rejected', reason: { name: 'AbortError' } })
    await nextTurn()
    expect(getEventListeners(external.signal, 'abort')).toHaveLength(0)
    expect(getEventListeners(taskSignal, 'abort')).toHaveLength(0)
  })

  it.each(['success', 'failure'] as const)(
    'honors the cancelById result across microtask boundaries after task %s',
    async (completion) => {
      const keeper = new QueueKeeper([{ id: 'network' }])
      const taskError = new Error('task failed')
      for (let delay = 0; delay < 12; delay++) {
        const work = deferred<string>()
        const cancellation = deferred<boolean>()
        const result = observe(keeper.add('network', 'hero', () => work.promise))
        if (completion === 'success') {
          work.resolve('value')
        } else {
          work.reject(taskError)
        }
        const cancelAfter = (remaining: number) => {
          if (remaining === 0) {
            cancellation.resolve(keeper.cancelById('hero'))
          } else {
            queueMicrotask(() => cancelAfter(remaining - 1))
          }
        }
        cancelAfter(delay)
        const [outcome, accepted] = await Promise.all([result, cancellation.promise])

        // 不限定内部有几层 Promise，只验证：接受取消就必须按取消结束。
        if (accepted) {
          expect(outcome).toMatchObject({ status: 'rejected', reason: { name: 'AbortError' } })
        } else {
          expect(outcome).toEqual(
            completion === 'success'
              ? { status: 'fulfilled', value: 'value' }
              : { status: 'rejected', reason: taskError }
          )
        }
        expect(keeper.tasks.size).toBe(0)
      }
    }
  )

  it.each(['success', 'failure', 'throw'] as const)(
    'preserves ordinary task %s and removes both signal subscriptions',
    async (completion) => {
      const keeper = new QueueKeeper([{ id: 'network' }])
      const external = new AbortController()
      const taskError = new Error('task failed')
      let taskSignal!: AbortSignal
      const result = await observe(
        keeper.add(
          'network',
          'hero',
          ({ signal }) => {
            taskSignal = signal
            if (completion === 'throw') {
              throw taskError
            }
            return completion === 'failure' ? Promise.reject(taskError) : 'value'
          },
          { signal: external.signal }
        )
      )
      expect(result).toEqual(
        completion === 'success'
          ? { status: 'fulfilled', value: 'value' }
          : { status: 'rejected', reason: taskError }
      )
      expect(getEventListeners(external.signal, 'abort')).toHaveLength(0)
      expect(getEventListeners(taskSignal, 'abort')).toHaveLength(0)
      expect(keeper.cancelById('hero')).toBe(false)
      expect(taskSignal.aborted).toBe(false)
    }
  )

  it('preserves the newest replacement when cancellation re-enters', async () => {
    const keeper = new QueueKeeper([{ id: 'network' }])
    const work = deferred()
    let inner!: Promise<string>
    const first = keeper.add('network', 'hero', ({ signal }) => {
      signal.addEventListener('abort', () => {
        inner = keeper.replace('network', 'hero', () => 'newest', { tags: 'opgg' })
      })
      return work.promise
    })
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
    let staleStarted = false
    const outer = keeper.replace('network', 'hero', () => {
      staleStarted = true
    })
    await expect(outer).rejects.toMatchObject({ name: 'AbortError' })
    await rejected
    await expect(inner).resolves.toBe('newest')
    expect(staleStarted).toBe(false)
    expect(keeper.tags.size).toBe(0)
    work.resolve()
  })

  it('cancels the underlying operation on timeout while preserving TimeoutError', async () => {
    const keeper = new QueueKeeper([{ id: 'network', options: { timeout: 5 } }])
    const work = deferred()
    const external = new AbortController()
    let signal!: AbortSignal
    await expect(
      keeper.add(
        'network',
        'hero',
        (context) => {
          signal = context.signal
          signal.addEventListener('abort', () => work.reject(new CanceledError()), { once: true })
          return work.promise
        },
        { signal: external.signal }
      )
    ).rejects.toMatchObject({ name: 'TimeoutError' })
    expect(signal.aborted).toBe(true)
    expect(isAbortError(signal.reason)).toBe(false)
    expect(getEventListeners(external.signal, 'abort')).toHaveLength(0)
    await expect(keeper.add('network', 'next', () => 'next')).resolves.toBe('next')
    expect(getEventListeners(signal, 'abort')).toHaveLength(0)
  })

  it('keeps and-tag cancellation compatible with other queued work', async () => {
    const keeper = new QueueKeeper([{ id: 'network', options: { concurrency: 1 } }])
    const work = deferred()
    const first = keeper.add('network', 'first', () => work.promise, { tags: ['player', 'stats'] })
    const second = keeper.add('network', 'second', () => 'second', { tags: ['player', 'games'] })
    const firstRejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
    expect(keeper.cancelByTags(['player', 'stats'], 'and')).toBe(1)
    await firstRejected
    await expect(second).resolves.toBe('second')
    work.resolve()
    expect(isAbortError(new CanceledError())).toBe(true)
  })

  it('enforces concurrency and priority without leaking completed task records', async () => {
    const keeper = new QueueKeeper([{ id: 'network', options: { concurrency: 1 } }])
    const work = deferred()
    const order: string[] = []
    const first = keeper.add('network', 'first', () => work.promise)
    const low = keeper.add('network', 'low', () => order.push('low'), { priority: 1 })
    const high = keeper.add('network', 'high', () => order.push('high'), { priority: 2 })
    await expect(keeper.add('network', 'high', () => {})).rejects.toThrow('already exists')
    work.resolve()
    await Promise.all([first, low, high])
    expect(order).toEqual(['high', 'low'])
    expect(keeper.tasks.size).toBe(0)
  })

  it.each(['tags', 'all'] as const)(
    'cancels the original batch without cancelling replacements created by abort callbacks: %s',
    async (method) => {
      const keeper = new QueueKeeper([{ id: 'network' }])
      const oldWork = deferred<string>()
      const newWork = deferred<string>()
      let replacement!: Promise<string>
      const first = observe(
        keeper.add(
          'network',
          'hero',
          ({ signal }) => {
            signal.addEventListener(
              'abort',
              () => {
                replacement = keeper.replace('network', 'hero', () => newWork.promise, {
                  tags: ['player', 'details']
                })
              },
              { once: true }
            )
            return oldWork.promise
          },
          { tags: ['player', 'details'] }
        )
      )
      const second = observe(
        keeper.add('network', 'stats', () => oldWork.promise, { tags: 'stats' })
      )
      const count =
        method === 'tags' ? keeper.cancelByTags(['player', 'stats']) : keeper.cancelAll()
      expect(count).toBe(2)
      expect(await first).toMatchObject({ status: 'rejected', reason: { name: 'AbortError' } })
      expect(await second).toMatchObject({ status: 'rejected', reason: { name: 'AbortError' } })
      expect(keeper.hasTask('hero')).toBe(true)
      oldWork.reject(new Error('late old failure'))
      newWork.resolve('new value')
      await expect(replacement).resolves.toBe('new value')
      expect(keeper.tags.size).toBe(0)
    }
  )

  it('settles 10000 rapid completion/cancellation interleavings without stale results or listeners', async () => {
    const keeper = new QueueKeeper([{ id: 'network', options: { concurrency: 1 } }])
    const failures: number[] = []
    for (let index = 0; index < 10_000; index++) {
      const work = deferred<number>()
      const external = new AbortController()
      let taskSignal!: AbortSignal
      const result = observe(
        keeper.add(
          'network',
          'hero',
          ({ signal }) => {
            taskSignal = signal
            return work.promise
          },
          { tags: ['player', 'details'], signal: external.signal }
        )
      )
      if (index % 2 === 0) {
        work.resolve(index)
      } else {
        work.reject(new Error('old failure'))
      }
      external.abort()
      const outcome = await result
      if (
        outcome.status !== 'rejected' ||
        outcome.reason !== external.signal.reason ||
        getEventListeners(external.signal, 'abort').length ||
        getEventListeners(taskSignal, 'abort').length
      ) {
        failures.push(index)
      }
    }
    expect(failures).toEqual([])
    expect(keeper.tasks.size).toBe(0)
    expect(keeper.tags.size).toBe(0)
    expect(keeper.queues.get('network')).toMatchObject({ size: 0, pending: 0 })
  })

  it('keeps only the newest of 10000 replacements while cancelled operations settle late', async () => {
    const keeper = new QueueKeeper([{ id: 'network', options: { concurrency: 1 } }])
    const external = new AbortController()
    const started = new Map<number, ReturnType<typeof deferred<number>>>()
    const results: ReturnType<typeof observe<number>>[] = []
    for (let index = 0; index < 10_000; index++) {
      results.push(
        observe(
          keeper.replace(
            'network',
            'hero',
            () => {
              const work = deferred<number>()
              started.set(index, work)
              return work.promise
            },
            { signal: external.signal, tags: ['player', 'details'] }
          )
        )
      )
      if (index % 50 === 0) {
        await nextTurn()
      }
    }
    await nextTurn()
    expect(keeper.tasks.size).toBe(1)
    expect(keeper.tags.get('details')).toEqual(['hero'])
    for (const [index, work] of started) {
      if (index % 2 === 0 && index !== 9999) {
        work.reject(new Error('late old failure'))
      } else {
        work.resolve(index)
      }
    }
    const outcomes = await Promise.all(results)
    expect(outcomes.filter((result) => result.status === 'fulfilled')).toEqual([
      { status: 'fulfilled', value: 9999 }
    ])
    expect(
      outcomes
        .slice(0, -1)
        .every((result) => result.status === 'rejected' && isAbortError(result.reason))
    ).toBe(true)
    expect(getEventListeners(external.signal, 'abort')).toHaveLength(0)
    expect(keeper.tasks.size).toBe(0)
    expect(keeper.tags.size).toBe(0)
    expect(keeper.queues.get('network')).toMatchObject({ size: 0, pending: 0 })
  })
})
