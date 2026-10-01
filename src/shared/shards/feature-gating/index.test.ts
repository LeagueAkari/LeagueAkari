import type { AkariFeatureGateSnapshot } from '@shared/shards/akari-api'
import { describe, expect, it } from 'vitest'

import { type FeatureGateContext, type FeatureGateDevOverrides, FeatureGateEvaluator } from '.'

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
) => {
  const evaluator = new FeatureGateEvaluator()
  evaluator.evaluate(snapshot, context(contextOverrides), devOverrides)

  return evaluator
}

describe('feature gate evaluation', () => {
  it('enables a gate when every configured condition matches', () => {
    expect(evaluate(config).getEvaluation('match-history.bulk-collection', false).enabled).toBe(
      true
    )
  })

  it('uses the caller fallback until a snapshot is available', () => {
    expect(evaluate(null).getEvaluation('unknown.feature', true).enabled).toBe(true)
    expect(evaluate(null).getEvaluation('unknown.feature', false).enabled).toBe(false)
  })

  it('treats a gate omitted from an available snapshot as off', () => {
    const evaluation = evaluate(config)

    expect(evaluation.getEvaluation('unknown.feature', true).enabled).toBe(false)
    expect(evaluation.getEvaluation('self-update.automatic', false).enabled).toBe(false)
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
        'champion-data.opgg': { mode: 'force-on' },
        'champion-data.qq101': { mode: 'force-off' }
      }
    )

    expect(evaluation.getEvaluation('match-history.bulk-collection', true).enabled).toBe(false)
    expect(evaluation.getEvaluation('champion-data.opgg', false).enabled).toBe(true)
    expect(evaluation.getEvaluation('champion-data.qq101', true).enabled).toBe(false)
    expect(evaluation.getEvaluation('champion-data.opgg', false).configured).toBe(true)
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

    expect(evaluation.getEvaluation('match-history.bulk-collection', false).enabled).toBe(true)
  })

  it('keeps caller defaults for unoverridden gates when the remote snapshot is unavailable', () => {
    const evaluation = evaluate(
      null,
      {},
      {
        'champion-data.opgg': { mode: 'force-off' },
        'champion-data.rule': {
          mode: 'rule',
          config: { platforms: ['win32'] }
        },
        'champion-data.unmatched': {
          mode: 'rule',
          config: { platforms: ['darwin'] }
        }
      }
    )

    expect(evaluation.getEvaluation('champion-data.opgg', true).enabled).toBe(false)
    expect(evaluation.getEvaluation('champion-data.rule', false).enabled).toBe(true)
    expect(evaluation.getEvaluation('champion-data.unmatched', true).enabled).toBe(false)
    expect(evaluation.getEvaluation('unknown.feature', true).enabled).toBe(true)
    expect(evaluation.getEvaluation('another.feature', false).enabled).toBe(false)
  })

  it('requires platform and SGP server matches', () => {
    expect(
      evaluate(config, { platform: 'darwin' }).getEvaluation('match-history.bulk-collection', false)
        .enabled
    ).toBe(false)
    expect(
      evaluate(config, { sgpServerId: '' }).getEvaluation('match-history.bulk-collection', false)
        .enabled
    ).toBe(false)
    expect(
      evaluate(config, { sgpServerId: 'EUW' }).getEvaluation('match-history.bulk-collection', false)
        .enabled
    ).toBe(false)
  })

  it('uses an inclusive minimum and exclusive maximum version', () => {
    expect(
      evaluate(config, { version: '1.5.0-rabi.1' }).getEvaluation(
        'match-history.bulk-collection',
        false
      ).enabled
    ).toBe(false)
    expect(
      evaluate(config, { version: '1.5.9' }).getEvaluation('match-history.bulk-collection', false)
        .enabled
    ).toBe(true)
    expect(
      evaluate(config, { version: '1.6.0' }).getEvaluation('match-history.bulk-collection', false)
        .enabled
    ).toBe(false)
  })

  it('reuses the converted key set until the snapshot or context changes', () => {
    const evaluator = new FeatureGateEvaluator()
    const currentContext = context()
    const devOverrides = {
      'champion-data.opgg': { mode: 'force-on' as const }
    }
    const first = evaluator.evaluate(config, currentContext, devOverrides)

    expect(evaluator.evaluate(config, { ...currentContext }, devOverrides)).toBe(first)
    expect(
      evaluator.evaluate(config, { ...currentContext, platform: 'darwin' }, devOverrides)
    ).not.toBe(first)
    expect(evaluator.evaluate(config, currentContext, { ...devOverrides })).not.toBe(first)
  })

  it('returns a structured decision with every rule mismatch in stable order', () => {
    const evaluator = new FeatureGateEvaluator()
    evaluator.evaluate(
      config,
      context({ platform: 'darwin', version: '1.4.9', sgpServerId: 'EUW' })
    )

    expect(evaluator.getEvaluation('match-history.bulk-collection', false)).toEqual({
      key: 'match-history.bulk-collection',
      enabled: false,
      configured: true,
      snapshotStatus: 'available',
      origin: 'server',
      decision: 'rule-not-matched',
      effectiveRule: config.gates['match-history.bulk-collection'],
      mismatches: [
        { kind: 'platform', actual: 'darwin', expected: ['win32'] },
        { kind: 'min-version', actual: '1.4.9', minVersionInclusive: '1.5.0-rabi.2' },
        { kind: 'sgp-server', actual: 'EUW', expected: ['NA1'] }
      ]
    })
  })

  it('reports an invalid current version without inventing boundary mismatches', () => {
    const evaluator = new FeatureGateEvaluator()
    evaluator.evaluate(config, context({ version: 'development' }))

    expect(evaluator.getEvaluation('match-history.bulk-collection', false).mismatches).toEqual([
      { kind: 'invalid-version', actual: 'development' }
    ])
  })

  it('describes defaults, absent keys, and development overrides', () => {
    const evaluator = new FeatureGateEvaluator()
    evaluator.evaluate(null, context())
    expect(evaluator.getEvaluation('unknown.feature', true)).toMatchObject({
      enabled: true,
      configured: false,
      snapshotStatus: 'unavailable',
      origin: 'default',
      decision: 'default-value'
    })

    evaluator.evaluate(config, context())
    expect(evaluator.getEvaluation('unknown.feature', true)).toMatchObject({
      enabled: false,
      configured: false,
      snapshotStatus: 'available',
      origin: 'default',
      decision: 'not-configured'
    })

    evaluator.evaluate(config, context(), {
      'unknown.feature': { mode: 'force-on' }
    })
    expect(evaluator.getEvaluation('unknown.feature', false)).toMatchObject({
      enabled: true,
      configured: true,
      origin: 'dev-override',
      decision: 'force-on'
    })
  })

  it('reuses an equivalent structured result across unrelated snapshot updates', () => {
    const evaluator = new FeatureGateEvaluator()
    evaluator.evaluate(config, context())
    const first = evaluator.getEvaluation('match-history.bulk-collection', false)

    evaluator.evaluate(
      {
        ...config,
        gates: { ...config.gates, 'unrelated.feature': { platforms: ['darwin'] } }
      },
      context()
    )

    expect(evaluator.getEvaluation('match-history.bulk-collection', false)).toBe(first)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first.mismatches)).toBe(true)
  })
})
