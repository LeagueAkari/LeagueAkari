import type { AkariContactChannels, AkariNotice } from '@shared/shards/akari-api'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AKARI_API_NOTICE_UPDATE_INTERVAL, type AkariApiMainContext } from './context'
import { AkariApiNoticeLoader } from './notice-loader'
import { AkariApiState } from './state'

const notice: AkariNotice = {
  revision: 'notice-revision',
  language: 'zh-CN',
  severity: 'medium',
  summary: '测试公告',
  contentType: 'text/markdown',
  content: '# 测试公告',
  updatedAt: '2026-07-20T04:00:00.000Z'
}

const contactChannels: AkariContactChannels = {
  updatedAt: '2026-07-20T04:00:00.000Z',
  channels: [
    {
      id: 'qq-outpost',
      platform: 'qq',
      name: '据点',
      identifier: '123456',
      url: 'https://qm.qq.com/q/example',
      password: 'akari'
    }
  ]
}

function createContext(options?: { noticeError?: Error; contactChannelsError?: Error }) {
  const getLatestNotice = options?.noticeError
    ? vi.fn().mockRejectedValue(options.noticeError)
    : vi.fn().mockResolvedValue({ data: notice })
  const getContactChannels = options?.contactChannelsError
    ? vi.fn().mockRejectedValue(options.contactChannelsError)
    : vi.fn().mockResolvedValue({ data: contactChannels })

  const context = {
    api: { getLatestNotice, getContactChannels },
    appCommon: { settings: { locale: 'zh-CN' } },
    logger: { info: vi.fn(), warn: vi.fn() },
    mobxUtils: {
      reaction: vi.fn(
        (
          _expression: () => unknown,
          effect: () => void,
          reactionOptions?: { fireImmediately?: boolean }
        ) => {
          if (reactionOptions?.fireImmediately) {
            effect()
          }
        }
      )
    },
    state: new AkariApiState()
  } as unknown as AkariApiMainContext

  return { context, getContactChannels, getLatestNotice }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Akari API notice loader', () => {
  it('refreshes notice content every hour', () => {
    expect(AKARI_API_NOTICE_UPDATE_INTERVAL).toBe(60 * 60 * 1000)
  })

  it('loads the notice and contact channels in the same refresh', async () => {
    const { context, getContactChannels, getLatestNotice } = createContext()
    const loader = new AkariApiNoticeLoader(context)

    loader.watch()

    await vi.waitFor(() => {
      expect(context.state.notice).toEqual(notice)
      expect(context.state.contactChannels).toEqual(contactChannels)
    })
    expect(getLatestNotice).toHaveBeenCalledWith('zh-CN')
    expect(getContactChannels).toHaveBeenCalledOnce()
    expect(context.state.isUpdatingNotice).toBe(false)
    expect(context.state.isUpdatingContactChannels).toBe(false)
    loader.dispose()
  })

  it('tracks both resources while the combined refresh is in flight', async () => {
    let resolveNotice!: (value: { data: AkariNotice }) => void
    let resolveContactChannels!: (value: { data: AkariContactChannels }) => void
    const context = {
      api: {
        getLatestNotice: vi.fn().mockReturnValue(
          new Promise<{ data: AkariNotice }>((resolve) => {
            resolveNotice = resolve
          })
        ),
        getContactChannels: vi.fn().mockReturnValue(
          new Promise<{ data: AkariContactChannels }>((resolve) => {
            resolveContactChannels = resolve
          })
        )
      },
      appCommon: { settings: { locale: 'zh-CN' } },
      logger: { info: vi.fn(), warn: vi.fn() },
      mobxUtils: {
        reaction: vi.fn(
          (
            _expression: () => unknown,
            effect: () => void,
            reactionOptions?: { fireImmediately?: boolean }
          ) => {
            if (reactionOptions?.fireImmediately) {
              effect()
            }
          }
        )
      },
      state: new AkariApiState()
    } as unknown as AkariApiMainContext
    const loader = new AkariApiNoticeLoader(context)

    loader.watch()

    expect(context.state.isUpdatingNotice).toBe(true)
    expect(context.state.isUpdatingContactChannels).toBe(true)

    resolveNotice({ data: notice })
    resolveContactChannels({ data: contactChannels })
    await vi.waitFor(() => {
      expect(context.state.isUpdatingNotice).toBe(false)
      expect(context.state.isUpdatingContactChannels).toBe(false)
    })
    loader.dispose()
  })

  it('keeps contact channels up to date when the notice request fails', async () => {
    const requestError = new Error('notice unavailable')
    const { context } = createContext({ noticeError: requestError })
    const loader = new AkariApiNoticeLoader(context)

    loader.watch()

    await vi.waitFor(() => {
      expect(context.state.contactChannels).toEqual(contactChannels)
    })
    expect(context.state.notice).toBeNull()
    expect(context.logger.warn).toHaveBeenCalledWith('Update notice failed', requestError)
    loader.dispose()
  })

  it('keeps the notice up to date when the contact channels request fails', async () => {
    const requestError = new Error('contact channels unavailable')
    const { context } = createContext({ contactChannelsError: requestError })
    const loader = new AkariApiNoticeLoader(context)

    loader.watch()

    await vi.waitFor(() => {
      expect(context.state.notice).toEqual(notice)
    })
    expect(context.state.contactChannels).toBeNull()
    expect(context.logger.warn).toHaveBeenCalledWith('Update contact channels failed', requestError)
    loader.dispose()
  })
})
