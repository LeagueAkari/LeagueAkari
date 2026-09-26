<template>
  <div class="flex h-full flex-col" data-testid="draft-advisor-panel">
    <header
      class="flex shrink-0 items-center gap-2 border-b border-black/8 px-3 py-2 dark:border-white/10"
    >
      <span class="text-sm font-bold text-black/90 dark:text-white/90">
        {{ t('draftAdvisor.title') }}
      </span>

      <NTag v-if="snapshot.patch" size="tiny" :bordered="false">{{ snapshot.patch }}</NTag>
      <NTag v-if="positionLabel" size="tiny" :bordered="false">{{ positionLabel }}</NTag>

      <div class="ml-auto flex shrink-0 items-center gap-2">
        <span class="text-[11px] text-black/45 dark:text-white/45">
          {{ t('draftAdvisor.enabled') }}
        </span>
        <NSwitch :value="settings.enabled" size="small" @update:value="handleEnabledChange" />
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <div
        v-if="emptyState"
        class="flex h-full items-center justify-center px-6 text-center text-xs text-black/45 dark:text-white/45"
      >
        {{ emptyState }}
      </div>

      <ul v-else class="flex flex-col gap-1">
        <li
          v-for="candidate in snapshot.candidates"
          :key="candidate.championId"
          class="flex items-center gap-2.5 rounded bg-black/3 px-2 py-1.5 dark:bg-white/6"
        >
          <ChampionIcon :champion-id="candidate.championId" class="size-8 shrink-0 rounded" />

          <div class="min-w-0 flex-1">
            <div class="truncate text-xs font-medium text-black/85 dark:text-white/85">
              {{ resources.champions.name(candidate.championId) }}
            </div>

            <div
              class="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] leading-4 text-black/45 dark:text-white/45"
            >
              <span v-if="candidate.breakdown.matchupDelta !== null">
                {{ t('draftAdvisor.signals.matchup') }}
                {{ formatDelta(candidate.breakdown.matchupDelta) }}
              </span>
              <span v-if="candidate.breakdown.synergyDelta !== null">
                {{ t('draftAdvisor.signals.synergy') }}
                {{ formatDelta(candidate.breakdown.synergyDelta) }}
              </span>
              <span v-if="candidate.breakdown.baseWinRate !== null">
                {{ t('draftAdvisor.signals.base') }}
                {{ formatPercent(candidate.breakdown.baseWinRate) }}
              </span>
            </div>
          </div>

          <div
            class="shrink-0 text-[13px] font-bold tabular-nums"
            :class="scoreClass(candidate.score)"
          >
            {{ formatPercent(candidate.score) }}
          </div>
        </li>
      </ul>

      <div
        v-if="!emptyState && gapMessages.length > 0"
        class="mt-2 rounded bg-amber-500/10 px-2 py-1.5 text-[10px] leading-4 text-amber-700 dark:text-amber-300"
      >
        <div v-for="message in gapMessages" :key="message">{{ message }}</div>
      </div>
    </div>

    <footer
      class="flex shrink-0 flex-wrap items-center gap-2 border-t border-black/8 px-3 py-2 dark:border-white/10"
    >
      <span class="text-[11px] text-black/45 dark:text-white/45">
        {{ t('draftAdvisor.riskLevel.label') }}
      </span>
      <NSelect
        class="w-28"
        size="tiny"
        :value="settings.riskLevel"
        :options="riskLevelOptions"
        :consistent-menu-width="false"
        @update:value="handleRiskLevelChange"
      />

      <span class="ml-2 text-[11px] text-black/45 dark:text-white/45">
        {{ t('draftAdvisor.candidateLimit') }}
      </span>
      <NInputNumber
        class="w-20"
        size="tiny"
        :value="settings.candidateLimit"
        :min="MIN_CANDIDATE_LIMIT"
        :max="MAX_CANDIDATE_LIMIT"
        @update:value="handleCandidateLimitChange"
      />

      <div class="ml-auto flex items-center gap-2">
        <span class="text-[11px] text-black/45 dark:text-white/45">
          {{ t('draftAdvisor.includeBaseWinRate') }}
        </span>
        <NSwitch
          :value="settings.includeBaseWinRate"
          size="small"
          @update:value="handleIncludeBaseWinRateChange"
        />
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useInstance } from '@renderer-shared/shards'
import { DraftAdvisorRenderer } from '@renderer-shared/shards/draft-advisor'
import { useDraftAdvisorStore } from '@renderer-shared/shards/draft-advisor/store'
import {
  MAX_DRAFT_ADVISOR_CANDIDATE_LIMIT,
  MIN_DRAFT_ADVISOR_CANDIDATE_LIMIT,
  type DraftAdvisorRiskLevel
} from '@shared/types/draft-advisor'
import { useTranslation } from 'i18next-vue'
import { NInputNumber, NSelect, NSwitch, NTag } from 'naive-ui'
import { computed } from 'vue'

const MIN_CANDIDATE_LIMIT = MIN_DRAFT_ADVISOR_CANDIDATE_LIMIT
const MAX_CANDIDATE_LIMIT = MAX_DRAFT_ADVISOR_CANDIDATE_LIMIT

const { t } = useTranslation()

const resources = useAkariResourceProvider()
const draftAdvisor = useInstance(DraftAdvisorRenderer)
const store = useDraftAdvisorStore()

const settings = computed(() => store.settings)
const snapshot = computed(() => store.snapshot)

const riskLevelOptions = computed(() => [
  { label: t('draftAdvisor.riskLevel.low'), value: 'low' },
  { label: t('draftAdvisor.riskLevel.medium'), value: 'medium' },
  { label: t('draftAdvisor.riskLevel.high'), value: 'high' }
])

const positionLabel = computed(() => {
  const position = snapshot.value.position
  return position ? t(`draftAdvisor.position.${position}`) : ''
})

const emptyState = computed(() => {
  if (!settings.value.enabled) {
    return t('draftAdvisor.states.disabled')
  }

  switch (snapshot.value.status) {
    case 'loading':
      return t('draftAdvisor.states.loading')
    case 'idle':
      return t('draftAdvisor.states.idle')
    case 'unavailable':
      return t('draftAdvisor.states.unavailable')
    case 'error':
      return t('draftAdvisor.states.error')
    default:
      break
  }

  if (snapshot.value.candidates.length === 0) {
    return t('draftAdvisor.states.noCandidates')
  }

  return null
})

/**
 * 只把"确实缺了什么"讲清楚。推荐本身仍然可用, 因此这是一条提示而不是错误。
 */
const gapMessages = computed(() => {
  const gaps = snapshot.value.gaps
  const messages: string[] = []

  if (!gaps.hasBaseWinRates) {
    messages.push(t('draftAdvisor.gaps.noBaseWinRates'))
  }

  if (gaps.missingEnemyChampionIds.length > 0) {
    messages.push(
      t('draftAdvisor.gaps.missingMatchups', { count: gaps.missingEnemyChampionIds.length })
    )
  }

  if (gaps.missingAllyChampionIds.length > 0) {
    messages.push(
      t('draftAdvisor.gaps.missingSynergies', { count: gaps.missingAllyChampionIds.length })
    )
  }

  return messages
})

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatDelta(value: number) {
  const rounded = value.toFixed(1)
  return value > 0 ? `+${rounded}` : rounded
}

/**
 * 沿用项目内既有的胜率配色约定: 明显高于中性值用绿色, 明显低于用红色。
 */
function scoreClass(score: number) {
  if (score >= 53) {
    return 'text-green-700 dark:text-green-300'
  }

  if (score <= 47) {
    return 'text-red-700 dark:text-red-400'
  }

  return 'text-black/80 dark:text-white/80'
}

function handleEnabledChange(value: boolean) {
  void draftAdvisor.setEnabled(value)
}

function handleRiskLevelChange(value: DraftAdvisorRiskLevel) {
  void draftAdvisor.setRiskLevel(value)
}

function handleIncludeBaseWinRateChange(value: boolean) {
  void draftAdvisor.setIncludeBaseWinRate(value)
}

function handleCandidateLimitChange(value: number | null) {
  if (value === null) {
    return
  }

  void draftAdvisor.setCandidateLimit(value)
}
</script>

<style></style>
