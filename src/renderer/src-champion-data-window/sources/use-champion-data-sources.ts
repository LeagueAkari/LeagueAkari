import { useInstance } from '@renderer-shared/shards'
import { useChampionDataStore } from '@renderer-shared/shards/champion-data/store'
import { FeatureGatingRenderer } from '@renderer-shared/shards/feature-gating'
import { useChampionDataWindowStore } from '@renderer-shared/shards/window-manager/store'
import { createChampionDataSourcePreferences } from '@shared/shards/champion-data/source-preferences'
import type { FeatureGateEvaluationResult } from '@shared/shards/feature-gating'
import {
  CHAMPION_DATA_OPGG_FEATURE_GATE,
  CHAMPION_DATA_QQ101_FEATURE_GATE,
  CHAMPION_DATA_SOURCE_ORDER,
  type ChampionDataSourceId,
  type ChampionDataSourcePreferences
} from '@shared/types/champion-data'
import { compare, valid } from 'semver'
import { computed, ref, watch } from 'vue'

export interface ChampionDataSourceOption {
  id: ChampionDataSourceId
  enabled: boolean
  available: boolean
}

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
  sourceTab: ChampionDataSourceId | null,
  enabledSources: readonly ChampionDataSourceId[],
  defaultSource: ChampionDataSourceId | null = null
) {
  if (sourceTab && enabledSources.includes(sourceTab)) {
    return sourceTab
  }

  if (defaultSource && enabledSources.includes(defaultSource)) {
    return defaultSource
  }

  return enabledSources[0] ?? null
}

export function resolveEnabledChampionDataSources(
  evaluations: Readonly<Record<ChampionDataSourceId, FeatureGateEvaluationResult>>,
  preferences: ChampionDataSourcePreferences = createChampionDataSourcePreferences()
) {
  return CHAMPION_DATA_SOURCE_ORDER.filter(
    (source) => preferences.enabled[source] && evaluations[source].enabled
  )
}

export function resolveChampionDataSourceOptions(
  evaluations: Readonly<Record<ChampionDataSourceId, FeatureGateEvaluationResult>>,
  preferences: ChampionDataSourcePreferences
): ChampionDataSourceOption[] {
  const enabledSources = resolveEnabledChampionDataSources(evaluations, preferences)
  const options = CHAMPION_DATA_SOURCE_ORDER.map((id) => ({
    id,
    enabled: enabledSources.includes(id),
    available: evaluations[id].enabled
  }))

  return [
    ...options.filter((source) => source.enabled),
    ...options.filter((source) => !source.enabled)
  ]
}

export function resolveMinimumUpgradeVersion(
  evaluations: Readonly<Record<ChampionDataSourceId, FeatureGateEvaluationResult>>,
  preferences: ChampionDataSourcePreferences = createChampionDataSourcePreferences()
) {
  const disabledEvaluations = CHAMPION_DATA_SOURCE_ORDER.filter(
    (source) => preferences.enabled[source]
  ).map((source) => evaluations[source])

  if (!disabledEvaluations.length) return null

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
  const store = useChampionDataStore()
  const windowStore = useChampionDataWindowStore()
  const sourceTab = ref<ChampionDataSourceId | null>(store.settings.sourcePreferences.defaultSource)

  const evaluations = computed<Record<ChampionDataSourceId, FeatureGateEvaluationResult>>(() => ({
    opgg: featureGating.getEvaluation(CHAMPION_DATA_OPGG_FEATURE_GATE, false),
    qq101: featureGating.getEvaluation(CHAMPION_DATA_QQ101_FEATURE_GATE, false)
  }))
  const enabledSources = computed(() =>
    resolveEnabledChampionDataSources(evaluations.value, store.settings.sourcePreferences)
  )
  const sources = computed(() =>
    resolveChampionDataSourceOptions(evaluations.value, store.settings.sourcePreferences)
  )
  const allSourcesDisabled = computed(() =>
    CHAMPION_DATA_SOURCE_ORDER.every((source) => !store.settings.sourcePreferences.enabled[source])
  )
  const activeSource = computed<ChampionDataSourceId | null>(() =>
    resolveActiveChampionDataSource(
      sourceTab.value,
      enabledSources.value,
      store.settings.sourcePreferences.defaultSource
    )
  )
  const minimumUpgradeVersion = computed(() =>
    resolveMinimumUpgradeVersion(evaluations.value, store.settings.sourcePreferences)
  )

  watch(
    enabledSources,
    () => {
      sourceTab.value = activeSource.value
    },
    { flush: 'sync' }
  )

  watch(
    () => windowStore.show,
    (shown) => {
      if (shown) sourceTab.value = store.settings.sourcePreferences.defaultSource
    },
    { flush: 'sync' }
  )

  const selectSource = (source: ChampionDataSourceId) => {
    if (enabledSources.value.includes(source)) sourceTab.value = source
  }

  return {
    evaluations,
    sources,
    allSourcesDisabled,
    enabledSources,
    activeSource,
    minimumUpgradeVersion,
    selectSource
  }
}
