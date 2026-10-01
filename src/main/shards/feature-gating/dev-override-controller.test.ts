import type { FeatureGateDevOverrides } from '@shared/shards/feature-gating'
import { describe, expect, it, vi } from 'vitest'

import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import {
  FEATURE_GATE_DEV_OVERRIDES_UNAVAILABLE_ERROR,
  FeatureGateDevOverrideController,
  INVALID_FEATURE_GATE_KEY_ERROR,
  INVALID_FEATURE_GATE_OVERRIDE_ERROR
} from './dev-override-controller'
import { FeatureGatingSettings } from './state'

function createController(isDevelopment: boolean, initial: FeatureGateDevOverrides = {}) {
  const settings = new FeatureGatingSettings()
  settings.setDevOverrides(initial)
  const settingService = {
    set: vi.fn(async (_key: string, value: FeatureGateDevOverrides) =>
      settings.setDevOverrides(value)
    )
  } as unknown as SetterSettingService<FeatureGatingSettings>

  return {
    controller: new FeatureGateDevOverrideController(settings, settingService, isDevelopment),
    settingService,
    settings
  }
}

describe('FeatureGateDevOverrideController', () => {
  it('renames an override with one persisted update', async () => {
    const { controller, settingService, settings } = createController(true, {
      'old.feature': { mode: 'force-on' },
      'other.feature': { mode: 'force-off' }
    })

    await controller.setDevOverride('new.feature', { mode: 'force-off' }, 'old.feature')

    expect(settings.devOverrides).toEqual({
      'new.feature': { mode: 'force-off' },
      'other.feature': { mode: 'force-off' }
    })
    expect(settingService.set).toHaveBeenCalledOnce()
  })

  it('rejects a rename that would overwrite another override', async () => {
    const initial: FeatureGateDevOverrides = {
      'old.feature': { mode: 'force-on' },
      'existing.feature': { mode: 'force-off' }
    }
    const { controller, settingService, settings } = createController(true, initial)

    await expect(
      controller.setDevOverride('existing.feature', { mode: 'force-on' }, 'old.feature')
    ).rejects.toMatchObject({ code: 'FeatureGateDevOverrideExists' })

    expect(settings.devOverrides).toEqual(initial)
    expect(settingService.set).not.toHaveBeenCalled()
  })

  it('keeps the old override when persisting a rename fails', async () => {
    const initial: FeatureGateDevOverrides = { 'old.feature': { mode: 'force-on' } }
    const { controller, settingService, settings } = createController(true, initial)
    vi.mocked(settingService.set).mockRejectedValueOnce(new Error('write failed'))

    await expect(
      controller.setDevOverride('new.feature', { mode: 'force-off' }, 'old.feature')
    ).rejects.toThrow('write failed')

    expect(settings.devOverrides).toEqual(initial)
  })

  it('persists normalized additions, replacements, and removals', async () => {
    const { controller, settingService, settings } = createController(true, {
      'existing.feature': { mode: 'force-on' }
    })

    await controller.setDevOverride('  champion-data.opgg  ', {
      mode: 'rule',
      config: { platforms: ['darwin'] }
    })
    expect(settings.devOverrides).toEqual({
      'existing.feature': { mode: 'force-on' },
      'champion-data.opgg': {
        mode: 'rule',
        config: { platforms: ['darwin'] }
      }
    })

    await controller.setDevOverride('existing.feature', null)
    expect(settings.devOverrides).toEqual({
      'champion-data.opgg': {
        mode: 'rule',
        config: { platforms: ['darwin'] }
      }
    })
    expect(settingService.set).toHaveBeenCalledTimes(2)
  })

  it('rejects invalid keys', async () => {
    const { controller } = createController(true)

    await expect(
      controller.setDevOverride('not-valid', { mode: 'force-on' })
    ).rejects.toMatchObject({
      code: INVALID_FEATURE_GATE_KEY_ERROR
    })
  })

  it('rejects invalid and empty rule overrides', async () => {
    const { controller } = createController(true)

    await expect(
      controller.setDevOverride('valid.feature', {
        mode: 'rule',
        config: {}
      })
    ).rejects.toMatchObject({ code: INVALID_FEATURE_GATE_OVERRIDE_ERROR })
  })

  it('keeps persisted values inactive and rejects writes outside development mode', async () => {
    const { controller } = createController(false, {
      'existing.feature': { mode: 'force-on' }
    })

    expect(controller.activeOverrides).toBeUndefined()
    await expect(
      controller.setDevOverride('existing.feature', { mode: 'force-off' })
    ).rejects.toMatchObject({ code: FEATURE_GATE_DEV_OVERRIDES_UNAVAILABLE_ERROR })
  })
})
