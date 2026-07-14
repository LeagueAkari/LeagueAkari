import { runInAction } from 'mobx'
import { describe, expect, it, vi } from 'vitest'

import { AutoSelectConfigManager } from './config-manager'
import type { AutoSelectMainContext } from './context'
import { AutoSelectSettings } from './state'

const GROUP_ID = 'normal'

function createContext(groupIds: string[] = [GROUP_ID]) {
  const settings = new AutoSelectSettings()
  const settingService = { set: vi.fn() }

  const context = {
    settings,
    settingService,
    state: {
      groups: groupIds.map((groupId) => ({ groupId }))
    }
  } as unknown as AutoSelectMainContext

  return { context, settings, settingService }
}

describe('fillAutoBanPickConfig', () => {
  it('creates a full default config for a group that has none', async () => {
    const { context, settings } = createContext()

    await new AutoSelectConfigManager(context).fillAutoBanPickConfig()

    expect(settings.pickConfig[GROUP_ID]).toEqual(settings.createNewEmptyPickConfig())
    expect(settings.banConfig[GROUP_ID]).toEqual(settings.createNewEmptyBanConfig())
  })

  it('fills a field missing from a saved group without touching its champions', async () => {
    const { context, settings } = createContext()
    const { strategy, ...savedPickConfig } = settings.createNewEmptyPickConfig()
    savedPickConfig.champions.middle = [1, 2, 3]

    runInAction(() => {
      settings.pickConfig = { [GROUP_ID]: savedPickConfig as typeof savedPickConfig & { strategy } }
      settings.banConfig = { [GROUP_ID]: settings.createNewEmptyBanConfig() }
    })

    await new AutoSelectConfigManager(context).fillAutoBanPickConfig()

    expect(settings.pickConfig[GROUP_ID].strategy).toBe('show-and-lock-in')
    expect(settings.pickConfig[GROUP_ID].champions.middle).toEqual([1, 2, 3])
  })

  it('keeps saved falsy values instead of overwriting them with defaults', async () => {
    const { context, settings } = createContext()
    const savedPickConfig = {
      ...settings.createNewEmptyPickConfig(),
      enabled: true,
      delaySeconds: 0,
      ignoreIntent: false,
      benchSwapAccumulatedDelaySeconds: 0
    }
    savedPickConfig.champions.top = []

    runInAction(() => {
      settings.pickConfig = { [GROUP_ID]: savedPickConfig }
      settings.banConfig = { [GROUP_ID]: settings.createNewEmptyBanConfig() }
    })

    await new AutoSelectConfigManager(context).fillAutoBanPickConfig()

    expect(settings.pickConfig[GROUP_ID].enabled).toBe(true)
    expect(settings.pickConfig[GROUP_ID].delaySeconds).toBe(0)
    expect(settings.pickConfig[GROUP_ID].ignoreIntent).toBe(false)
    expect(settings.pickConfig[GROUP_ID].benchSwapAccumulatedDelaySeconds).toBe(0)
    expect(settings.pickConfig[GROUP_ID].champions.top).toEqual([])
  })

  it('fills a field missing from a saved ban config', async () => {
    const { context, settings } = createContext()
    const { strategy, ...savedBanConfig } = settings.createNewEmptyBanConfig()
    savedBanConfig.champions.default = [10]

    runInAction(() => {
      settings.pickConfig = { [GROUP_ID]: settings.createNewEmptyPickConfig() }
      settings.banConfig = { [GROUP_ID]: savedBanConfig as typeof savedBanConfig & { strategy } }
    })

    await new AutoSelectConfigManager(context).fillAutoBanPickConfig()

    expect(settings.banConfig[GROUP_ID].strategy).toBe('show-and-lock-in')
    expect(settings.banConfig[GROUP_ID].champions.default).toEqual([10])
  })

  it('does not persist anything when every group is already complete', async () => {
    const { context, settings, settingService } = createContext()

    runInAction(() => {
      settings.pickConfig = { [GROUP_ID]: settings.createNewEmptyPickConfig() }
      settings.banConfig = { [GROUP_ID]: settings.createNewEmptyBanConfig() }
    })

    await new AutoSelectConfigManager(context).fillAutoBanPickConfig()

    expect(settingService.set).not.toHaveBeenCalled()
  })
})
