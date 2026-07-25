import type { AkariFeatureGateSnapshot } from '@shared/shards/akari-api'
import { describe, expect, it } from 'vitest'

import { type FeatureGateContext, FeatureGateEvaluator, isFeatureGateEnabled } from '.'

const config: AkariFeatureGateSnapshot = {
  updatedAt: '2026-07-25T04:00:00.000Z',
  gates: {
    'match-history.bulk-collection': {
      platforms: ['win32'],
      minVersionInclusive: '1.5.0-rabi.2',
      maxVersionExclusive: '1.6.0',
      sgpServers: ['NA1']
    }
  }
}

const context = (overrides: Partial<FeatureGateContext> = {}): FeatureGateContext => ({
  platform: 'win32',
  version: '1.5.0-rabi.2',
  sgpServerId: 'NA1',
  ...overrides
})

const evaluate = (
  snapshot: AkariFeatureGateSnapshot | null,
  overrides: Partial<FeatureGateContext> = {}
) => new FeatureGateEvaluator().evaluate(snapshot, context(overrides))

describe('feature gate evaluation', () => {
  it('enables a gate when every configured condition matches', () => {
    expect(isFeatureGateEnabled('match-history.bulk-collection', false, evaluate(config))).toBe(
      true
    )
  })

  it('uses the caller fallback until a snapshot is available', () => {
    expect(isFeatureGateEnabled('unknown.feature', true, evaluate(null))).toBe(true)
    expect(isFeatureGateEnabled('unknown.feature', false, evaluate(null))).toBe(false)
  })

  it('treats a gate omitted from an available snapshot as off', () => {
    const evaluation = evaluate(config)

    expect(isFeatureGateEnabled('unknown.feature', true, evaluation)).toBe(false)
    expect(isFeatureGateEnabled('self-update.automatic', false, evaluation)).toBe(false)
  })

  it('requires platform and SGP server matches', () => {
    expect(
      isFeatureGateEnabled(
        'match-history.bulk-collection',
        false,
        evaluate(config, { platform: 'darwin' })
      )
    ).toBe(false)
    expect(
      isFeatureGateEnabled(
        'match-history.bulk-collection',
        false,
        evaluate(config, { sgpServerId: '' })
      )
    ).toBe(false)
    expect(
      isFeatureGateEnabled(
        'match-history.bulk-collection',
        false,
        evaluate(config, { sgpServerId: 'EUW' })
      )
    ).toBe(false)
  })

  it('uses an inclusive minimum and exclusive maximum version', () => {
    expect(
      isFeatureGateEnabled(
        'match-history.bulk-collection',
        false,
        evaluate(config, { version: '1.5.0-rabi.1' })
      )
    ).toBe(false)
    expect(
      isFeatureGateEnabled(
        'match-history.bulk-collection',
        false,
        evaluate(config, { version: '1.5.9' })
      )
    ).toBe(true)
    expect(
      isFeatureGateEnabled(
        'match-history.bulk-collection',
        false,
        evaluate(config, { version: '1.6.0' })
      )
    ).toBe(false)
  })

  it('reuses the converted key set until the snapshot or context changes', () => {
    const evaluator = new FeatureGateEvaluator()
    const currentContext = context()
    const first = evaluator.evaluate(config, currentContext)

    expect(evaluator.evaluate(config, { ...currentContext })).toBe(first)
    expect(evaluator.evaluate(config, { ...currentContext, platform: 'darwin' })).not.toBe(first)
  })
})
