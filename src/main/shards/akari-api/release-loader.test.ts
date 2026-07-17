import { AxiosError } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AkariApiMainContext } from './context'
import { AkariApiReleaseLoader } from './release-loader'
import { AkariApiSettings, AkariApiState } from './state'

vi.mock('electron', () => ({
  app: {
    getVersion: () => '1.4.0'
  }
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Akari API release loader', () => {
  it('loads the flat latest release document', async () => {
    const context = {
      api: {
        getLatestRelease: vi.fn().mockResolvedValue({
          data: {
            version: '1.5.0',
            publishedAt: '2026-07-16T06:00:00.000Z',
            description: '更新内容',
            artifacts: [
              {
                platform: 'windows',
                arch: 'x64',
                fileName: 'League Akari-1.5.0-win.7z',
                size: 2048,
                contentType: 'application/x-7z-compressed',
                sha256: null,
                downloadUrl: 'https://akari-static.yuru-yuri.com/League%20Akari-1.5.0-win.7z'
              }
            ]
          }
        })
      },
      appCommon: { settings: { locale: 'zh-CN' } },
      logger: { info: vi.fn(), warn: vi.fn() },
      settings: new AkariApiSettings(),
      state: new AkariApiState()
    } as unknown as AkariApiMainContext
    const loader = new AkariApiReleaseLoader(context)

    const release = await loader.updateLatestReleaseManually()

    expect(release).toMatchObject({
      version: '1.5.0',
      currentVersion: '1.4.0',
      isNew: true,
      description: '更新内容',
      archiveFile: { size: 2048 }
    })
    loader.dispose()
  })

  it('uses last-resort while the new release endpoint has no published release', async () => {
    const responseError = new AxiosError('Not Found')
    responseError.response = { status: 404 } as never

    const context = {
      api: {
        getLatestRelease: vi.fn().mockRejectedValue(responseError),
        getLastResortLatestRelease: vi.fn().mockResolvedValue({
          data: {
            version: 'v1.4.3',
            publishedAt: '2026-01-25T00:00:00.000Z',
            descriptions: {
              'zh-CN': '更新内容',
              en: 'Release notes'
            },
            archiveFileGitHub: {
              name: 'League Akari-1.4.3-win.7z',
              size: 1024,
              downloadUrl: 'https://akari-static.yuru-yuri.com/League%20Akari-1.4.3-win.7z',
              contentType: 'application/x-7z-compressed'
            }
          }
        })
      },
      appCommon: { settings: { locale: 'zh-CN' } },
      logger: { info: vi.fn(), warn: vi.fn() },
      settings: new AkariApiSettings(),
      state: new AkariApiState()
    } as unknown as AkariApiMainContext
    const loader = new AkariApiReleaseLoader(context)

    const release = await loader.updateLatestReleaseManually()

    expect(release).toMatchObject({
      version: 'v1.4.3',
      currentVersion: '1.4.0',
      isNew: true,
      description: '更新内容',
      archiveFile: {
        downloadUrl: 'https://akari-static.yuru-yuri.com/League%20Akari-1.4.3-win.7z'
      }
    })
    expect(context.api.getLastResortLatestRelease).toHaveBeenCalledOnce()
    loader.dispose()
  })
})
