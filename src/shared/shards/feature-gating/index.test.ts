import type { AkariFeatureGateSnapshot } from '@shared/shards/akari-api'
import { describe, expect, it } from 'vitest'

import {
  type FeatureGateContext,
  type FeatureGateDevOverrides,
  FeatureGateEvaluator,
  isFeatureGateConfigured,
  isFeatureGateEnabled
} from '.'

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
  contextOverrides: Partial<FeatureGateContext> = {},
  devOverrides?: FeatureGateDevOverrides
) => new FeatureGateEvaluator().evaluate(snapshot, context(contextOverrides), devOverrides)

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

  it('replaces same-name remote configurations with development overrides', () => {
    const evaluation = evaluate(
      config,
      {},
      {
        'match-history.bulk-collection': {
          mode: 'rule',
          config: { platforms: ['darwin'] }
        },
        'champion-data.source.opgg': { mode: 'force-on' },
        'champion-data.source.qq101': { mode: 'force-off' }
      }
    )

    expect(isFeatureGateEnabled('match-history.bulk-collection', true, evaluation)).toBe(false)
    expect(isFeatureGateEnabled('champion-data.source.opgg', false, evaluation)).toBe(true)
    expect(isFeatureGateEnabled('champion-data.source.qq101', true, evaluation)).toBe(false)
    expect(isFeatureGateConfigured('champion-data.source.opgg', evaluation)).toBe(true)
  })

  it('evaluates a same-name rule replacement without inheriting remote fields', () => {
    const evaluation = evaluate(
      config,
      { platform: 'darwin', sgpServerId: 'EUW' },
      {
        'match-history.bulk-collection': {
          mode: 'rule',
          config: { platforms: ['darwin'] }
        }
      }
    )

    expect(isFeatureGateEnabled('match-history.bulk-collection', false, evaluation)).toBe(true)
  })

  it('keeps caller defaults for unoverridden gates when the remote snapshot is unavailable', () => {
    const evaluation = evaluate(
      null,
      {},
      {
        'champion-data.source.opgg': { mode: 'force-off' },
        'champion-data.source.rule': {
          mode: 'rule',
          config: { platforms: ['win32'] }
        },
        'champion-data.source.unmatched': {
          mode: 'rule',
          config: { platforms: ['darwin'] }
        }
      }
    )

    expect(isFeatureGateEnabled('champion-data.source.opgg', true, evaluation)).toBe(false)
    expect(isFeatureGateEnabled('champion-data.source.rule', false, evaluation)).toBe(true)
    expect(isFeatureGateEnabled('champion-data.source.unmatched', true, evaluation)).toBe(false)
    expect(isFeatureGateEnabled('unknown.feature', true, evaluation)).toBe(true)
    expect(isFeatureGateEnabled('another.feature', false, evaluation)).toBe(false)
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
    const devOverrides = {
      'champion-data.source.opgg': { mode: 'force-on' as const }
    }
    const first = evaluator.evaluate(config, currentContext, devOverrides)

    expect(evaluator.evaluate(config, { ...currentContext }, devOverrides)).toBe(first)
    expect(
      evaluator.evaluate(config, { ...currentContext, platform: 'darwin' }, devOverrides)
    ).not.toBe(first)
    expect(evaluator.evaluate(config, currentContext, { ...devOverrides })).not.toBe(first)
  })
})
