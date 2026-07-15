import { parseAkariApiBootstrapDocument } from '@shared/shards/akari-api'
import type { AxiosInstance } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { AkariApiBootstrapController } from './bootstrap-controller'
import {
  AKARI_API_BOOTSTRAP_CACHE_PATH,
  AKARI_API_BOOTSTRAP_NPM_LATEST_URL,
  type AkariApiMainContext
} from './context'

const bootstrap = (generation: number) => ({
  schemaVersion: 1 as const,
  generation,
  baseUrls: {
    api: `https://api-${generation}.example.com`,
    static: `https://static-${generation}.example.com`
  }
})

function setup(localGeneration: number, remoteGeneration: number) {
  const settingService = {
    jsonConfigFileExists: vi.fn().mockResolvedValue(true),
    readFromJsonConfigFile: vi.fn().mockResolvedValue(bootstrap(localGeneration)),
    writeToJsonConfigFile: vi.fn().mockResolvedValue(undefined)
  }
  const logger = { info: vi.fn(), warn: vi.fn() }
  const npmHttp = {
    get: vi.fn().mockResolvedValue({
      data: {
        akariBootstrap: bootstrap(remoteGeneration)
      }
    })
  } as unknown as AxiosInstance
  const applyBootstrap = vi.fn((value: unknown) => parseAkariApiBootstrapDocument(value))
  const context = { settingService, logger } as unknown as AkariApiMainContext
  const controller = new AkariApiBootstrapController(context, npmHttp, applyBootstrap)

  return { applyBootstrap, controller, npmHttp, settingService }
}

describe('Akari API bootstrap controller', () => {
  it('loads local cache first and persists a newer npm generation', async () => {
    const { applyBootstrap, controller, npmHttp, settingService } = setup(1, 2)

    await controller.initFromLocal()
    await controller.updateFromNpm()

    expect(applyBootstrap).toHaveBeenNthCalledWith(1, bootstrap(1))
    expect(applyBootstrap).toHaveBeenNthCalledWith(2, bootstrap(2))
    expect(npmHttp.get).toHaveBeenCalledWith(AKARI_API_BOOTSTRAP_NPM_LATEST_URL)
    expect(settingService.writeToJsonConfigFile).toHaveBeenCalledWith(
      AKARI_API_BOOTSTRAP_CACHE_PATH,
      bootstrap(2)
    )
  })

  it('keeps the local cache when npm is not newer', async () => {
    const { applyBootstrap, controller, settingService } = setup(2, 2)

    await controller.initFromLocal()
    await controller.updateFromNpm()

    expect(applyBootstrap).toHaveBeenCalledTimes(1)
    expect(settingService.writeToJsonConfigFile).not.toHaveBeenCalled()
  })
})
