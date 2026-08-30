import { describe, expect, it } from 'vitest'

import {
  FeatureGateDevOverrideSchema,
  FeatureGateDevOverridesSchema,
  restoreFeatureGateDevOverrides
} from './schemas'

describe('feature gate development override schemas', () => {
  it('restores legacy booleans as force modes alongside current values', () => {
    expect(
      restoreFeatureGateDevOverrides({
        'legacy.enabled': true,
        'legacy.disabled': false,
        'current.rule': {
          mode: 'rule',
          config: { platforms: ['win32'] }
        }
      })
    ).toEqual({
      'legacy.enabled': { mode: 'force-on' },
      'legacy.disabled': { mode: 'force-off' },
      'current.rule': {
        mode: 'rule',
        config: { platforms: ['win32'] }
      }
    })
  })

  it('drops invalid persisted entries while preserving valid entries', () => {
    expect(
      restoreFeatureGateDevOverrides({
        invalid: true,
        'valid.feature': { mode: 'unknown' },
        'another.feature': { mode: 'force-on' }
      })
    ).toEqual({ 'another.feature': { mode: 'force-on' } })
  })

  it('requires rule overrides to contain at least one constraint', () => {
    expect(FeatureGateDevOverrideSchema.safeParse({ mode: 'rule', config: {} }).success).toBe(false)
    expect(
      FeatureGateDevOverrideSchema.safeParse({
        mode: 'rule',
        config: { sgpServers: ['NA1'] }
      }).success
    ).toBe(true)
  })

  it('reuses remote SemVer and version interval validation', () => {
    expect(
      FeatureGateDevOverrideSchema.safeParse({
        mode: 'rule',
        config: { minVersionInclusive: 'not-semver' }
      }).success
    ).toBe(false)
    expect(
      FeatureGateDevOverrideSchema.safeParse({
        mode: 'rule',
        config: {
          minVersionInclusive: '2.0.0',
          maxVersionExclusive: '1.0.0'
        }
      }).success
    ).toBe(false)
  })

  it('accepts only valid dotted keys in the persisted record', () => {
    expect(
      FeatureGateDevOverridesSchema.safeParse({
        'valid.feature': { mode: 'force-on' }
      }).success
    ).toBe(true)
    expect(
      FeatureGateDevOverridesSchema.safeParse({
        invalid: { mode: 'force-on' }
      }).success
    ).toBe(false)
  })
})
