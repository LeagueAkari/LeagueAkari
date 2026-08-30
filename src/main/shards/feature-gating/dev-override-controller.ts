import { AkariFeatureGateKeySchema } from '@shared/shards/akari-api'
import {
  type FeatureGateDevOverride,
  FeatureGateDevOverrideSchema,
  type FeatureGateDevOverrides
} from '@shared/shards/feature-gating'

import { AkariIpcError } from '../ipc'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { FeatureGatingSettings } from './state'

export const FEATURE_GATE_DEV_OVERRIDES_UNAVAILABLE_ERROR = 'FeatureGateDevOverridesUnavailable'
export const INVALID_FEATURE_GATE_KEY_ERROR = 'InvalidFeatureGateKey'
export const INVALID_FEATURE_GATE_OVERRIDE_ERROR = 'InvalidFeatureGateOverride'

export class FeatureGateDevOverrideController {
  constructor(
    private readonly _settings: FeatureGatingSettings,
    private readonly _settingService: SetterSettingService<FeatureGatingSettings>,
    private readonly _isDevelopment: boolean
  ) {}

  get activeOverrides(): FeatureGateDevOverrides | undefined {
    return this._isDevelopment ? this._settings.devOverrides : undefined
  }

  async setDevOverride(key: string, value: FeatureGateDevOverride | null) {
    if (!this._isDevelopment) {
      throw new AkariIpcError(
        'Feature gate development overrides are unavailable outside development mode',
        FEATURE_GATE_DEV_OVERRIDES_UNAVAILABLE_ERROR
      )
    }

    if (typeof key !== 'string') {
      throw new AkariIpcError('Feature gate key must be a string', INVALID_FEATURE_GATE_KEY_ERROR)
    }

    const normalizedKey = key.trim()
    if (!AkariFeatureGateKeySchema.safeParse(normalizedKey).success) {
      throw new AkariIpcError(
        `Invalid feature gate key: ${normalizedKey}`,
        INVALID_FEATURE_GATE_KEY_ERROR
      )
    }

    let normalizedOverride: FeatureGateDevOverride | null = null
    if (value !== null) {
      const parsedOverride = FeatureGateDevOverrideSchema.safeParse(value)
      if (!parsedOverride.success) {
        throw new AkariIpcError(
          parsedOverride.error.issues[0]?.message ?? 'Invalid feature gate development override',
          INVALID_FEATURE_GATE_OVERRIDE_ERROR
        )
      }
      normalizedOverride = parsedOverride.data
    }

    const devOverrides = { ...this._settings.devOverrides }
    if (normalizedOverride === null) {
      delete devOverrides[normalizedKey]
    } else {
      devOverrides[normalizedKey] = normalizedOverride
    }

    await this._settingService.set('devOverrides', devOverrides)
    return { key: normalizedKey, value: normalizedOverride }
  }
}
