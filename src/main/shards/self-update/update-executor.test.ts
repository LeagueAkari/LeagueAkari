import type { SelfUpdateReleaseInfo } from '@shared/shards/self-update'
import cp from 'node:child_process'
import fs from 'node:fs'
import { Readable } from 'node:stream'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { SELF_UPDATE_MAIN_NAMESPACE, type SelfUpdateMainContext } from './context'
import { SelfUpdateSettings, SelfUpdateState } from './state'
import { SelfUpdateExecutor } from './update-executor'

vi.mock('electron', async () => {
  const os = await import('node:os')
  const path = await import('node:path')
  const testPathRoot = path.join(os.tmpdir(), 'league-akari-test')

  return {
    app: {
      getPath: (name: string) => path.join(testPathRoot, name),
      getVersion: () => '1.0.0',
      isPackaged: false
    },
    Notification: class {
      show() {}
    }
  }
})

vi.mock('@main/i18n', () => ({
  i18next: {
    t: (key: string) => key
  }
}))

vi.mock('@resources/LA_ICON.ico?asset', () => ({ default: 'icon' }))
vi.mock('@resources/akari-updater.exe?asset', () => ({ default: 'akari-updater.exe' }))
vi.mock('node:child_process', () => ({
  default: {
    spawn: vi.fn()
  }
}))
vi.mock('./platform', () => ({
  shouldDownloadUpdateArchive: () => true,
  shouldApplyDownloadedUpdate: () => true,
  shouldLaunchUpdaterOnQuit: () => false
}))
vi.mock('node:original-fs', async () => {
  const fs = await vi.importActual<typeof import('node:fs')>('node:fs')
  return { default: fs, ...fs }
})

function createRelease(): SelfUpdateReleaseInfo {
  return {
    version: '2.0.0',
    currentVersion: '1.0.0',
    publishedAt: '2026-01-01T00:00:00.000Z',
    description: '',
    isNew: true,
    isUpdateSupported: true,
    artifact: {
      platform: 'win32',
      arch: 'x64',
      fileName: 'LeagueAkari-2.0.0-win.7z',
      size: 100,
      downloadUrl: 'https://example.com/LeagueAkari-2.0.0-win.7z',
      contentType: 'application/x-7z-compressed',
      sha256: null
    }
  }
}

function createContext(httpClient: SelfUpdateMainContext['httpClient']): SelfUpdateMainContext {
  return {
    namespace: SELF_UPDATE_MAIN_NAMESPACE,
    settings: new SelfUpdateSettings(),
    state: new SelfUpdateState(),
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    } as unknown as SelfUpdateMainContext['logger'],
    appCommon: {
      settings: {
        locale: 'zh-CN',
        httpProxy: { strategy: 'auto' }
      }
    } as unknown as SelfUpdateMainContext['appCommon'],
    ipc: {
      sendEvent: vi.fn()
    } as unknown as SelfUpdateMainContext['ipc'],
    mobxUtils: {
      reaction: vi.fn()
    } as unknown as SelfUpdateMainContext['mobxUtils'],
    akariApi: {} as SelfUpdateMainContext['akariApi'],
    httpClient
  }
}

describe('SelfUpdateExecutor', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('aborts an in-flight update request when cancelled before the response arrives', async () => {
    let signal: AbortSignal | undefined
    let rejectRequest!: (error: Error) => void

    const httpClient = {
      get: vi.fn((_url: string, options: { signal?: AbortSignal }) => {
        signal = options.signal
        return new Promise((_resolve, reject) => {
          rejectRequest = reject
        })
      }),
      defaults: {}
    } as unknown as SelfUpdateMainContext['httpClient']

    const context = createContext(httpClient)
    const executor = new SelfUpdateExecutor(context)

    const started = executor.start(createRelease())

    expect(context.state.updateProgressInfo?.phase).toBe('downloading')
    expect(signal).toBeDefined()

    executor.cancel()

    expect(signal?.aborted).toBe(true)

    rejectRequest(new Error('aborted'))
    await expect(started).resolves.toEqual({ result: 'ok' })
    expect(context.state.updateProgressInfo).toBeNull()
  })

  test('rejects a release without a selected update artifact', async () => {
    const httpClient = {
      get: vi.fn(),
      defaults: {}
    } as unknown as SelfUpdateMainContext['httpClient']
    const context = createContext(httpClient)
    const executor = new SelfUpdateExecutor(context)
    const release = createRelease()
    release.isUpdateSupported = false
    release.artifact = null

    await expect(executor.start(release)).resolves.toEqual({
      result: 'failed',
      reason: 'platform-unsupported'
    })
    expect(httpClient.get).not.toHaveBeenCalled()
  })

  test('settles the update process and keeps failure state when the download stream fails', async () => {
    const brokenStream = new Readable({
      read() {
        this.destroy(new Error('stream failed'))
      }
    })
    const httpClient = {
      get: vi.fn(async () => ({
        data: brokenStream,
        headers: { 'content-length': '100' }
      })),
      defaults: {}
    } as unknown as SelfUpdateMainContext['httpClient']

    const context = createContext(httpClient)
    const executor = new SelfUpdateExecutor(context)

    const result = await Promise.race([
      executor.start(createRelease()),
      new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 50))
    ])

    expect(result).not.toBe('timeout')
    expect(context.state.updateProgressInfo?.phase).toBe('download-failed')
  })

  test('marks the update as failed when the updater task cannot be prepared after download', async () => {
    vi.spyOn(fs.promises, 'copyFile').mockRejectedValueOnce(new Error('copy failed'))

    const httpClient = {
      get: vi.fn(async () => ({
        data: Readable.from(['update archive']),
        headers: { 'content-length': '14' }
      })),
      defaults: {}
    } as unknown as SelfUpdateMainContext['httpClient']

    const context = createContext(httpClient)
    const executor = new SelfUpdateExecutor(context)

    await expect(executor.start(createRelease())).resolves.toMatchObject({
      result: 'failed'
    })
    expect(context.state.updateProgressInfo?.phase).toBe('download-failed')
  })

  test('cancels a prepared update instead of launching the updater from a development build', async () => {
    vi.spyOn(fs.promises, 'copyFile').mockResolvedValueOnce(undefined)
    const spawn = vi.mocked(cp.spawn)
    spawn.mockClear()

    const httpClient = {
      get: vi.fn(async () => ({
        data: Readable.from(['update archive']),
        headers: { 'content-length': '14' }
      })),
      defaults: {}
    } as unknown as SelfUpdateMainContext['httpClient']

    const context = createContext(httpClient)
    const executor = new SelfUpdateExecutor(context)

    await expect(executor.start(createRelease())).resolves.toEqual({ result: 'ok' })
    expect(context.state.updateProgressInfo?.phase).toBe('waiting-for-restart')

    await executor.runUpdateOnQuit()

    expect(spawn).not.toHaveBeenCalled()
    expect(context.state.updateProgressInfo).toBeNull()
  })
})
