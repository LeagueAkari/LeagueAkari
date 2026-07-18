import type { AxiosInstance } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import {
  AKARI_API_BOOTSTRAP_CACHE_PATH,
  AKARI_API_BOOTSTRAP_NPM_LATEST_URL,
  AkariApiBootstrapController
} from './bootstrap-controller'

vi.mock('electron', () => ({
  app: {
    getVersion: () => '1.5.0'
  }
}))

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
    writeToJsonConfigFile: vi.fn().mockResolvedValue(undefined),
    deleteJsonConfigFile: vi.fn().mockResolvedValue(undefined)
  }
  const logger = { info: vi.fn(), warn: vi.fn() }
  let resolveRemote: (value: unknown) => void = () => {}
  const npmHttp = {
    get: vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveRemote = resolve
      })
    )
  } as unknown as AxiosInstance
  const controller = new AkariApiBootstrapController(
    settingService as never,
    logger as never,
    npmHttp
  )

  return {
    controller,
    logger,
    npmHttp,
    resolveRemote: () =>
      resolveRemote({
        data: {
          akariBootstrap: bootstrap(remoteGeneration)
        }
      }),
    settingService
  }
}

describe('Akari API bootstrap controller', () => {
  it('loads local cache first and persists a newer npm generation', async () => {
    const { controller, npmHttp, resolveRemote, settingService } = setup(1, 2)

    await controller.init()

    expect(controller.apiHttp.defaults.baseURL).toBe('https://api-1.example.com')
    expect(controller.staticHttp.defaults.baseURL).toBe('https://static-1.example.com')
    expect(npmHttp.get).toHaveBeenCalledWith(AKARI_API_BOOTSTRAP_NPM_LATEST_URL)

    resolveRemote()

    await vi.waitFor(() => {
      expect(controller.apiHttp.defaults.baseURL).toBe('https://api-2.example.com')
      expect(controller.staticHttp.defaults.baseURL).toBe('https://static-2.example.com')
      expect(settingService.writeToJsonConfigFile).toHaveBeenCalledWith(
        AKARI_API_BOOTSTRAP_CACHE_PATH,
        bootstrap(2)
      )
    })
  })

  it('keeps the local cache when npm is not newer', async () => {
    const { controller, logger, resolveRemote, settingService } = setup(2, 2)

    await controller.init()
    resolveRemote()

    await vi.waitFor(() => {
      expect(logger.info).toHaveBeenCalledWith('Bootstrap generation 2 is up to date')
    })

    expect(controller.apiHttp.defaults.baseURL).toBe('https://api-2.example.com')
    expect(controller.staticHttp.defaults.baseURL).toBe('https://static-2.example.com')
    expect(settingService.writeToJsonConfigFile).not.toHaveBeenCalled()
  })

  it('deletes a local bootstrap cache that does not match the current schema', async () => {
    const settingService = {
      jsonConfigFileExists: vi.fn().mockResolvedValue(true),
      readFromJsonConfigFile: vi.fn().mockResolvedValue({ schemaVersion: 2 }),
      writeToJsonConfigFile: vi.fn(),
      deleteJsonConfigFile: vi.fn().mockResolvedValue(undefined)
    }
    const npmHttp = {
      get: vi.fn().mockReturnValue(new Promise(() => {}))
    } as unknown as AxiosInstance
    const controller = new AkariApiBootstrapController(
      settingService as never,
      { info: vi.fn(), warn: vi.fn() } as never,
      npmHttp
    )

    await controller.init()

    expect(settingService.deleteJsonConfigFile).toHaveBeenCalledWith(AKARI_API_BOOTSTRAP_CACHE_PATH)
  })
})
