import { AkariSupportedQueuesConfigSchema } from '@shared/shards/akari-api'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CachedResource } from './cached-resources'
import { AkariApiConfigLoader } from './config-loader'
import type { AkariApiMainContext } from './context'
import { AkariApiState } from './state'

const resource: CachedResource<ReturnType<typeof AkariSupportedQueuesConfigSchema.parse>> = {
  id: 'supportedQueues',
  name: 'supported queues',
  resource: 'sgp/supported-queues',
  cachePath: 'config/v1/sgp/supported-queues.json',
  intervalMs: 60_000,
  schema: AkariSupportedQueuesConfigSchema,
  getCurrentUpdatedAt: (state) => state.supportedQueues.updatedAt,
  apply: (state, data) => state.setSupportedQueues(data),
  getUpdating: (state) => state.isUpdatingSupportedQueues,
  setUpdating: (state, value) => state.setUpdatingSupportedQueues(value)
}

function setup(remoteUpdatedAt: string) {
  const state = new AkariApiState()
  const writeToJsonConfigFile = vi.fn().mockResolvedValue(undefined)
  const context = {
    api: {
      getConfig: vi.fn().mockResolvedValue({
        data: {
          updatedAt: remoteUpdatedAt,
          queues: [420, 1700]
        }
      })
    },
    logger: {
      info: vi.fn(),
      warn: vi.fn()
    },
    settingService: {
      jsonConfigFileExists: vi.fn().mockResolvedValue(false),
      readFromJsonConfigFile: vi.fn(),
      writeToJsonConfigFile
    },
    state
  } as unknown as AkariApiMainContext
  const loader = new AkariApiConfigLoader(context, [resource])

  return { context, loader, state, writeToJsonConfigFile }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Akari API config loader', () => {
  it('applies and persists a newer resource', async () => {
    const { loader, state, writeToJsonConfigFile } = setup('2099-01-01T00:00:00.000Z')

    loader.watch()

    await vi.waitFor(() => {
      expect(writeToJsonConfigFile).toHaveBeenCalledWith(resource.cachePath, {
        updatedAt: '2099-01-01T00:00:00.000Z',
        queues: [420, 1700]
      })
    })
    expect(state.supportedQueues.queues).toEqual([420, 1700])
    loader.dispose()
  })

  it('keeps the current value when the response is older', async () => {
    const { context, loader, state, writeToJsonConfigFile } = setup('2020-01-01T00:00:00.000Z')
    const current = state.supportedQueues

    loader.watch()

    await vi.waitFor(() => {
      expect(context.logger.info).toHaveBeenCalledWith(
        'supported queues is up to date',
        expect.any(String)
      )
    })
    expect(state.supportedQueues).toBe(current)
    expect(writeToJsonConfigFile).not.toHaveBeenCalled()
    loader.dispose()
  })
})
