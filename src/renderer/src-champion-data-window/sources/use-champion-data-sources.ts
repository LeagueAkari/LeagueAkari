import { useInstance } from '@renderer-shared/shards'
import { FeatureGatingRenderer } from '@renderer-shared/shards/feature-gating'
import type { FeatureGateEvaluationResult } from '@shared/shards/feature-gating'
import {
  CHAMPION_DATA_OPGG_FEATURE_GATE,
  CHAMPION_DATA_QQ101_FEATURE_GATE,
  type ChampionDataSourceId
} from '@shared/types/champion-data'
import { compare, valid } from 'semver'
import { computed, ref } from 'vue'

export const CHAMPION_DATA_SOURCE_ORDER = ['opgg', 'qq101'] as const

function onlyMinVersionMismatch(evaluation: FeatureGateEvaluationResult) {
  return (
    !evaluation.enabled &&
    evaluation.snapshotStatus === 'available' &&
    evaluation.decision === 'rule-not-matched' &&
    evaluation.mismatches.length === 1 &&
    evaluation.mismatches[0]?.kind === 'min-version'
  )
}

export function resolveActiveChampionDataSource(
  sourceTab: ChampionDataSourceId,
  enabledSources: readonly ChampionDataSourceId[]
) {
  if (enabledSources.includes(sourceTab)) {
    return sourceTab
  }

  return enabledSources[0] ?? null
}

export function resolveEnabledChampionDataSources(
  evaluations: Readonly<Record<ChampionDataSourceId, FeatureGateEvaluationResult>>
) {
  return CHAMPION_DATA_SOURCE_ORDER.filter((source) => evaluations[source].enabled)
}

export function resolveMinimumUpgradeVersion(
  evaluations: Readonly<Record<ChampionDataSourceId, FeatureGateEvaluationResult>>
) {
  const disabledEvaluations = CHAMPION_DATA_SOURCE_ORDER.map((source) => evaluations[source])

  if (disabledEvaluations.some((evaluation) => evaluation.enabled)) {
    return null
  }

  if (!disabledEvaluations.every(onlyMinVersionMismatch)) {
    return null
  }

  const versions = disabledEvaluations.flatMap((evaluation) => {
    const mismatch = evaluation.mismatches[0]

    return mismatch?.kind === 'min-version' && valid(mismatch.minVersionInclusive)
      ? [mismatch.minVersionInclusive]
      : []
  })

  if (versions.length !== disabledEvaluations.length) {
    return null
  }

  return versions.sort(compare)[0] ?? null
}

export function useChampionDataSources() {
  const featureGating = useInstance(FeatureGatingRenderer)
  const sourceTab = ref<ChampionDataSourceId>('opgg')

  const evaluations = computed<Record<ChampionDataSourceId, FeatureGateEvaluationResult>>(() => ({
    opgg: featureGating.getEvaluation(CHAMPION_DATA_OPGG_FEATURE_GATE, false),
    qq101: featureGating.getEvaluation(CHAMPION_DATA_QQ101_FEATURE_GATE, false)
  }))
  const enabledSources = computed(() => resolveEnabledChampionDataSources(evaluations.value))
  const activeSource = computed<ChampionDataSourceId | null>(() =>
    resolveActiveChampionDataSource(sourceTab.value, enabledSources.value)
  )
  const minimumUpgradeVersion = computed(() => resolveMinimumUpgradeVersion(evaluations.value))

  const selectSource = (source: ChampionDataSourceId) => {
    sourceTab.value = source
  }

  return {
    evaluations,
    enabledSources,
    activeSource,
    minimumUpgradeVersion,
    selectSource
  }
}
