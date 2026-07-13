import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createElevatedStartupNotificationSetup } from './elevated-startup-notification'

const mocks = vi.hoisted(() => ({
  appCommonStore: {
    isElevated: false
  },
  info: vi.fn()
}))

vi.mock('@renderer-shared/shards/app-common/store', () => ({
  useAppCommonStore: () => mocks.appCommonStore
}))
vi.mock('i18next-vue', () => ({
  useTranslation: (_namespace: unknown, options?: { keyPrefix?: string }) => ({
    t: (key: string) => (options?.keyPrefix ? `${options.keyPrefix}.${key}` : key)
  })
}))
vi.mock('naive-ui', () => ({
  useNotification: () => ({ info: mocks.info })
}))

describe('elevated startup notification', () => {
  beforeEach(() => {
    mocks.appCommonStore.isElevated = false
    mocks.info.mockReset()
  })

  test('shows one two-second info notification per elevated renderer lifecycle', () => {
    mocks.appCommonStore.isElevated = true
    const setup = createElevatedStartupNotificationSetup()

    setup()
    setup()

    expect(mocks.info).toHaveBeenCalledTimes(1)
    expect(mocks.info).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: 2000,
        title: expect.any(Function),
        content: expect.any(Function)
      })
    )

    const options = mocks.info.mock.calls[0][0]
    expect(options.title()).toBe('notifications.simple.elevatedStartup.title')
    expect(options.content()).toBe('notifications.simple.elevatedStartup.content')
  })

  test('does not show the notification without elevation', () => {
    const setup = createElevatedStartupNotificationSetup()

    setup()

    expect(mocks.info).not.toHaveBeenCalled()
  })
})
