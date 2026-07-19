import type { AkariRelease } from '@shared/shards/akari-api'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AkariApiMainContext } from './context'
import { AkariApiReleaseLoader } from './release-loader'
import { AkariApiState } from './state'

const latestRelease: AkariRelease = {
  version: '1.5.0',
  publishedAt: '2026-07-16T06:00:00.000Z',
  description: '更新内容',
  artifacts: [
    {
      platform: 'win32',
      arch: 'x64',
      fileName: 'League Akari-1.5.0-win.7z',
      size: 2048,
      contentType: 'application/x-7z-compressed',
      sha256: null,
      downloadUrl: 'https://akari-static.yuru-yuri.com/League%20Akari-1.5.0-win.7z'
    }
  ]
}

function createContext(getLatestRelease = vi.fn().mockResolvedValue({ data: latestRelease })) {
  return {
    api: { getLatestRelease },
    appCommon: { settings: { locale: 'zh-CN' } },
    logger: { info: vi.fn(), warn: vi.fn() },
    state: new AkariApiState()
  } as unknown as AkariApiMainContext
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Akari API release loader', () => {
  it('keeps the native release document unchanged', async () => {
    const context = createContext()
    const loader = new AkariApiReleaseLoader(context)

    const release = await loader.updateLatestRelease('zh-CN')

    expect(release).toEqual(latestRelease)
    expect(context.state.latestRelease).toEqual(latestRelease)
  })

  it('does not filter artifacts at the Akari API boundary', async () => {
    const unsupportedRelease: AkariRelease = {
      ...latestRelease,
      artifacts: [
        {
          ...latestRelease.artifacts[0],
          contentType: 'application/octet-stream',
          fileName: 'League Akari-1.5.0-win.zip'
        }
      ]
    }
    const context = createContext(vi.fn().mockResolvedValue({ data: unsupportedRelease }))
    const loader = new AkariApiReleaseLoader(context)

    await loader.updateLatestRelease('zh-CN')

    expect(context.state.latestRelease).toEqual(unsupportedRelease)
  })

  it('shares an in-flight request without changing its data', async () => {
    const getLatestRelease = vi.fn().mockResolvedValue({ data: latestRelease })
    const context = createContext(getLatestRelease)
    const loader = new AkariApiReleaseLoader(context)

    const firstUpdate = loader.updateLatestRelease('zh-CN')
    const secondUpdate = loader.updateLatestRelease('zh-CN')

    await expect(firstUpdate).resolves.toEqual(latestRelease)
    await expect(secondUpdate).resolves.toEqual(latestRelease)
    expect(getLatestRelease).toHaveBeenCalledTimes(1)
  })

  it('tracks whether the latest release is being updated', async () => {
    let resolveRequest!: (value: { data: AkariRelease }) => void
    const getLatestRelease = vi.fn().mockReturnValue(
      new Promise<{ data: AkariRelease }>((resolve) => {
        resolveRequest = resolve
      })
    )
    const context = createContext(getLatestRelease)
    const loader = new AkariApiReleaseLoader(context)

    const update = loader.updateLatestRelease('zh-CN')

    expect(context.state.isUpdatingLatestRelease).toBe(true)
    resolveRequest({ data: latestRelease })
    await update
    expect(context.state.isUpdatingLatestRelease).toBe(false)
  })

  it('does not fall back to the legacy endpoint when the request fails', async () => {
    const context = createContext(vi.fn().mockRejectedValue(new Error('request failed')))
    const loader = new AkariApiReleaseLoader(context)

    await expect(loader.updateLatestRelease('zh-CN')).rejects.toThrow('request failed')

    expect(context.state.latestRelease).toBeNull()
    expect(context.logger.warn).toHaveBeenCalled()
  })
})
