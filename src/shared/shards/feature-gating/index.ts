import type { AkariFeatureGateSnapshot } from '@shared/shards/akari-api'
import type { AkariSupportedPlatform } from '@shared/types/common'
import { gte, lt, valid } from 'semver'

export interface FeatureGateContext {
  platform: AkariSupportedPlatform
  version: string
  sgpServerId: string
}

export type FeatureGateEvaluation = ReadonlySet<string> | null

export function isFeatureGateEnabled(
  key: string,
  defaultValue: boolean,
  evaluation: FeatureGateEvaluation
) {
  return evaluation ? evaluation.has(key) : defaultValue
}

export class FeatureGateEvaluator {
  private _config: AkariFeatureGateSnapshot | null | undefined
  private _platform: AkariSupportedPlatform | undefined
  private _version: string | undefined
  private _sgpServerId: string | undefined
  private _evaluation: FeatureGateEvaluation = null

  evaluate(config: AkariFeatureGateSnapshot | null, context: FeatureGateContext) {
    if (
      this._config === config &&
      this._platform === context.platform &&
      this._version === context.version &&
      this._sgpServerId === context.sgpServerId
    ) {
      return this._evaluation
    }

    this._config = config
    this._platform = context.platform
    this._version = context.version
    this._sgpServerId = context.sgpServerId

    if (!config) {
      this._evaluation = null
      return this._evaluation
    }

    const enabledGates = new Set<string>()
    const version = valid(context.version)

    for (const [key, gate] of Object.entries(config.gates)) {
      if (gate.platforms && !gate.platforms.some((platform) => platform === context.platform)) {
        continue
      }

      if (gate.minVersionInclusive || gate.maxVersionExclusive) {
        if (!version) continue
        if (gate.minVersionInclusive && lt(version, gate.minVersionInclusive)) continue
        if (gate.maxVersionExclusive && gte(version, gate.maxVersionExclusive)) continue
      }

      if (gate.sgpServers) {
        if (!context.sgpServerId || !gate.sgpServers.includes(context.sgpServerId)) continue
      }

      enabledGates.add(key)
    }

    this._evaluation = enabledGates
    return this._evaluation
  }
}
