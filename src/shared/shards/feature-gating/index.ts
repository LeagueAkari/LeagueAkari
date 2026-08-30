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

export interface FeatureGateEvaluation {
  enabled: ReadonlySet<string>
  disabled: ReadonlySet<string>
  configured: ReadonlySet<string>
  useDefaultValue: boolean
}

export type FeatureGateServerStatus =
  'enabled' | 'rule-not-matched' | 'not-configured' | 'snapshot-unavailable'

export function isFeatureGateEnabled(
  key: string,
  defaultValue: boolean,
  evaluation: FeatureGateEvaluation
) {
  if (evaluation.enabled.has(key)) return true
  if (evaluation.disabled.has(key)) return false
  if (evaluation.configured.has(key)) return false
  return evaluation.useDefaultValue ? defaultValue : false
}

export function isFeatureGateConfigured(key: string, evaluation: FeatureGateEvaluation) {
  return evaluation.configured.has(key)
}

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
    useDefaultValue: true
  }

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

    const effectiveGates = new Map<string, FeatureGateDevOverride>()
    if (config) {
      for (const [key, gate] of Object.entries(config.gates)) {
        effectiveGates.set(key, { mode: 'rule', config: gate })
      }
    }
    if (devOverrides) {
      for (const [key, override] of Object.entries(devOverrides)) {
        effectiveGates.set(key, override)
      }
    }

    const enabledGates = new Set<string>()
    const disabledGates = new Set<string>()
    const configuredGates = new Set(effectiveGates.keys())
    const version = valid(context.version)

    for (const [key, gate] of effectiveGates) {
      if (gate.mode === 'force-on') {
        enabledGates.add(key)
        continue
      }
      if (gate.mode === 'force-off') {
        disabledGates.add(key)
        continue
      }

      if (doesFeatureGateRuleMatch(gate.config, context, version)) enabledGates.add(key)
    }

    this._evaluation = {
      enabled: enabledGates,
      disabled: disabledGates,
      configured: configuredGates,
      useDefaultValue: config === null
    }
    return this._evaluation
  }
}

function doesFeatureGateRuleMatch(
  gate: AkariFeatureGateRuntimeRule,
  context: FeatureGateContext,
  version: string | null
) {
  if (gate.platforms && !gate.platforms.some((platform) => platform === context.platform)) {
    return false
  }

  if (gate.minVersionInclusive || gate.maxVersionExclusive) {
    if (!version) return false
    if (gate.minVersionInclusive && lt(version, gate.minVersionInclusive)) return false
    if (gate.maxVersionExclusive && gte(version, gate.maxVersionExclusive)) return false
  }

  if (gate.sgpServers) {
    if (!context.sgpServerId || !gate.sgpServers.includes(context.sgpServerId)) return false
  }

  return true
}
