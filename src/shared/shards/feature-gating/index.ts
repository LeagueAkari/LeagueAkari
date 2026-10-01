import type {
  AkariFeatureGateRuntimeRule,
  AkariFeatureGateSnapshot
} from '@shared/shards/akari-api'
import type { AkariSupportedPlatform } from '@shared/types/common'
import { gte, lt, valid } from 'semver'

import type { FeatureGateDevOverride, FeatureGateDevOverrides } from './schemas'

export {
  FeatureGateDevOverrideSchema,
  FeatureGateDevOverridesSchema,
  restoreFeatureGateDevOverrides
} from './schemas'
export type { FeatureGateDevOverride, FeatureGateDevOverrides } from './schemas'

export interface FeatureGateContext {
  platform: AkariSupportedPlatform
  version: string
  sgpServerId: string
}

interface EffectiveFeatureGate {
  origin: 'server' | 'dev-override'
  gate: FeatureGateDevOverride
}

export interface FeatureGateEvaluation {
  enabled: ReadonlySet<string>
  disabled: ReadonlySet<string>
  configured: ReadonlySet<string>
  useDefaultValue: boolean
  snapshotStatus: 'available' | 'unavailable'
  effectiveGates: ReadonlyMap<string, EffectiveFeatureGate>
  context: FeatureGateContext
}

export type FeatureGateMismatch =
  | {
      readonly kind: 'platform'
      readonly actual: AkariSupportedPlatform
      readonly expected: readonly AkariSupportedPlatform[]
    }
  | {
      readonly kind: 'invalid-version'
      readonly actual: string
    }
  | {
      readonly kind: 'min-version'
      readonly actual: string
      readonly minVersionInclusive: string
    }
  | {
      readonly kind: 'max-version'
      readonly actual: string
      readonly maxVersionExclusive: string
    }
  | {
      readonly kind: 'sgp-server'
      readonly actual: string
      readonly expected: readonly string[]
    }

export type FeatureGateDecision =
  | 'force-on'
  | 'force-off'
  | 'rule-matched'
  | 'rule-not-matched'
  | 'default-value'
  | 'not-configured'

export interface FeatureGateEvaluationResult {
  readonly key: string
  readonly enabled: boolean
  readonly configured: boolean
  readonly snapshotStatus: 'available' | 'unavailable'
  readonly origin: 'server' | 'dev-override' | 'default'
  readonly decision: FeatureGateDecision
  readonly effectiveRule: Readonly<AkariFeatureGateRuntimeRule> | null
  readonly mismatches: readonly FeatureGateMismatch[]
}

export type FeatureGateServerStatus =
  'enabled' | 'rule-not-matched' | 'not-configured' | 'snapshot-unavailable'

export class FeatureGateEvaluator {
  private _config: AkariFeatureGateSnapshot | null | undefined
  private _platform: AkariSupportedPlatform | undefined
  private _version: string | undefined
  private _sgpServerId: string | undefined
  private _devOverrides: FeatureGateDevOverrides | undefined
  private _evaluation: FeatureGateEvaluation = {
    enabled: new Set(),
    disabled: new Set(),
    configured: new Set(),
    useDefaultValue: true,
    snapshotStatus: 'unavailable',
    effectiveGates: new Map(),
    context: { platform: 'win32', version: '', sgpServerId: '' }
  }
  private readonly _resultCache = new Map<
    string,
    { signature: string; result: FeatureGateEvaluationResult }
  >()

  evaluate(
    config: AkariFeatureGateSnapshot | null,
    context: FeatureGateContext,
    devOverrides?: FeatureGateDevOverrides
  ) {
    if (
      this._config === config &&
      this._platform === context.platform &&
      this._version === context.version &&
      this._sgpServerId === context.sgpServerId &&
      this._devOverrides === devOverrides
    ) {
      return this._evaluation
    }

    this._config = config
    this._platform = context.platform
    this._version = context.version
    this._sgpServerId = context.sgpServerId
    this._devOverrides = devOverrides

    const effectiveGates = new Map<string, EffectiveFeatureGate>()

    if (config) {
      for (const [key, gate] of Object.entries(config.gates)) {
        effectiveGates.set(key, { origin: 'server', gate: { mode: 'rule', config: gate } })
      }
    }

    if (devOverrides) {
      for (const [key, gate] of Object.entries(devOverrides)) {
        effectiveGates.set(key, { origin: 'dev-override', gate })
      }
    }

    const enabledGates = new Set<string>()
    const disabledGates = new Set<string>()
    const configuredGates = new Set(effectiveGates.keys())

    for (const [key, effectiveGate] of effectiveGates) {
      if (effectiveGate.gate.mode === 'force-on') {
        enabledGates.add(key)

        continue
      }

      if (effectiveGate.gate.mode === 'force-off') {
        disabledGates.add(key)

        continue
      }

      if (getFeatureGateMismatches(effectiveGate.gate.config, context).length === 0) {
        enabledGates.add(key)
      }
    }

    this._evaluation = {
      enabled: enabledGates,
      disabled: disabledGates,
      configured: configuredGates,
      useDefaultValue: config === null,
      snapshotStatus: config === null ? 'unavailable' : 'available',
      effectiveGates,
      context: { ...context }
    }

    return this._evaluation
  }

  getEvaluation(key: string, defaultValue: boolean): FeatureGateEvaluationResult {
    const candidate = createFeatureGateEvaluationResult(key, defaultValue, this._evaluation)
    const cacheKey = `${key}\u0000${defaultValue ? '1' : '0'}`
    const signature = JSON.stringify(candidate)
    const cached = this._resultCache.get(cacheKey)

    if (cached?.signature === signature) {
      return cached.result
    }

    const result = freezeFeatureGateEvaluationResult(candidate)
    this._resultCache.set(cacheKey, { signature, result })

    return result
  }
}

function createFeatureGateEvaluationResult(
  key: string,
  defaultValue: boolean,
  evaluation: FeatureGateEvaluation
): FeatureGateEvaluationResult {
  const effectiveGate = evaluation.effectiveGates.get(key)

  if (!effectiveGate) {
    const usesDefault = evaluation.snapshotStatus === 'unavailable'

    return {
      key,
      enabled: usesDefault ? defaultValue : false,
      configured: false,
      snapshotStatus: evaluation.snapshotStatus,
      origin: 'default',
      decision: usesDefault ? 'default-value' : 'not-configured',
      effectiveRule: null,
      mismatches: []
    }
  }

  const { gate, origin } = effectiveGate

  if (gate.mode === 'force-on' || gate.mode === 'force-off') {
    return {
      key,
      enabled: gate.mode === 'force-on',
      configured: true,
      snapshotStatus: evaluation.snapshotStatus,
      origin,
      decision: gate.mode,
      effectiveRule: null,
      mismatches: []
    }
  }

  const mismatches = getFeatureGateMismatches(gate.config, evaluation.context)

  return {
    key,
    enabled: mismatches.length === 0,
    configured: true,
    snapshotStatus: evaluation.snapshotStatus,
    origin,
    decision: mismatches.length === 0 ? 'rule-matched' : 'rule-not-matched',
    effectiveRule: normalizeRule(gate.config),
    mismatches
  }
}

function getFeatureGateMismatches(
  gate: AkariFeatureGateRuntimeRule,
  context: FeatureGateContext
): FeatureGateMismatch[] {
  const mismatches: FeatureGateMismatch[] = []

  if (gate.platforms && !gate.platforms.some((platform) => platform === context.platform)) {
    mismatches.push({
      kind: 'platform',
      actual: context.platform,
      expected: [...gate.platforms]
    })
  }

  if (gate.minVersionInclusive || gate.maxVersionExclusive) {
    const version = valid(context.version)

    if (!version) {
      mismatches.push({ kind: 'invalid-version', actual: context.version })
    } else {
      if (gate.minVersionInclusive && lt(version, gate.minVersionInclusive)) {
        mismatches.push({
          kind: 'min-version',
          actual: context.version,
          minVersionInclusive: gate.minVersionInclusive
        })
      }

      if (gate.maxVersionExclusive && gte(version, gate.maxVersionExclusive)) {
        mismatches.push({
          kind: 'max-version',
          actual: context.version,
          maxVersionExclusive: gate.maxVersionExclusive
        })
      }
    }
  }

  if (gate.sgpServers && !gate.sgpServers.includes(context.sgpServerId)) {
    mismatches.push({
      kind: 'sgp-server',
      actual: context.sgpServerId,
      expected: [...gate.sgpServers]
    })
  }

  return mismatches
}

function normalizeRule(gate: AkariFeatureGateRuntimeRule): AkariFeatureGateRuntimeRule {
  return {
    ...(gate.platforms ? { platforms: [...gate.platforms] } : {}),
    ...(gate.minVersionInclusive ? { minVersionInclusive: gate.minVersionInclusive } : {}),
    ...(gate.maxVersionExclusive ? { maxVersionExclusive: gate.maxVersionExclusive } : {}),
    ...(gate.sgpServers ? { sgpServers: [...gate.sgpServers] } : {})
  }
}

function freezeFeatureGateEvaluationResult(
  result: FeatureGateEvaluationResult
): FeatureGateEvaluationResult {
  for (const mismatch of result.mismatches) {
    if ('expected' in mismatch) {
      Object.freeze(mismatch.expected)
    }

    Object.freeze(mismatch)
  }

  Object.freeze(result.mismatches)

  if (result.effectiveRule) {
    if (result.effectiveRule.platforms) {
      Object.freeze(result.effectiveRule.platforms)
    }

    if (result.effectiveRule.sgpServers) {
      Object.freeze(result.effectiveRule.sgpServers)
    }

    Object.freeze(result.effectiveRule)
  }

  return Object.freeze(result)
}
