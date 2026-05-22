import { describe, expect, it, vi } from 'vitest'

import { AkariManager, ExternalShardConstructor } from './manager'

class FastShard {
  static id = 'fast-shard'
  static priority = 0
  static dependencies: string[] = []

  async onInit() {}
}

class SlowShard {
  static id = 'slow-shard'
  static priority = 0
  static dependencies = [FastShard.id]

  async onInit() {
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
}

class FailingShard {
  static id = 'failing-shard'
  static priority = 0
  static dependencies: string[] = []

  async onInit() {
    await new Promise((resolve) => setTimeout(resolve, 5))
    throw new Error('init failed')
  }
}

describe('AkariManager init timing', () => {
  it('records per-shard init durations without producing logs', async () => {
    const manager = new AkariManager()
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    ;(manager.global as any).logger = logger

    manager.useExternal(FastShard as ExternalShardConstructor)
    manager.useExternal(SlowShard as ExternalShardConstructor)

    await manager.setup()

    const report = manager._getInitializationReport()
    const { timings } = report
    const fastTiming = timings.find((timing) => timing.id === FastShard.id)
    const slowTiming = timings.find((timing) => timing.id === SlowShard.id)

    expect(report.order).toEqual([FastShard.id, SlowShard.id, AkariManager.INTERNAL_RUNNER_ID])
    expect(fastTiming).toMatchObject({ id: FastShard.id, ok: true })
    expect(slowTiming).toMatchObject({ id: SlowShard.id, ok: true })
    expect(fastTiming!.durationMs).toBeGreaterThanOrEqual(0)
    expect(slowTiming!.durationMs).toBeGreaterThanOrEqual(0)
    expect(report.summary.totalDurationMs).toBeGreaterThanOrEqual(
      fastTiming!.durationMs + slowTiming!.durationMs
    )
    expect(logger.info).not.toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('records timing summary when shard init fails without producing logs', async () => {
    const manager = new AkariManager()
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    ;(manager.global as any).logger = logger

    manager.useExternal(FailingShard as ExternalShardConstructor)

    await expect(manager.setup()).rejects.toThrow('Failed to initialize shard failing-shard')

    const report = manager._getInitializationReport()
    const { timings } = report
    expect(timings).toHaveLength(1)
    expect(timings[0]).toMatchObject({
      id: FailingShard.id,
      ok: false,
      error: 'init failed'
    })
    expect(report.summary).toMatchObject({
      shardCount: 1,
      slowestShard: null
    })
    expect(logger.info).not.toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })
})
