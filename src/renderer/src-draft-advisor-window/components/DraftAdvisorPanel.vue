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

    <div class="flex min-h-0 flex-1">
      <section
        class="flex w-52 shrink-0 flex-col border-r border-black/8 bg-black/2 dark:border-white/10 dark:bg-white/4"
      >
        <div class="flex shrink-0 items-baseline justify-between gap-2 px-3 pt-2.5 pb-1.5">
          <span class="text-[11px] font-medium text-black/60 dark:text-white/60">
            {{ t('draftAdvisor.roster.ally') }}
          </span>
          <span
            class="text-[15px] font-bold tabular-nums"
            :class="scoreClass(snapshot.teamScore?.ally)"
          >
            {{ formatScore(snapshot.teamScore?.ally) }}
          </span>
        </div>

        <ul class="m-0 min-h-0 flex-1 list-none overflow-y-auto p-0 px-2 pb-2">
          <li
            v-for="member in snapshot.allyMembers"
            :key="member.championId"
            class="mb-1 flex items-center gap-2 rounded px-1.5 py-1"
            :class="isSelf(member.championId) ? 'bg-black/6 dark:bg-white/10' : ''"
          >
            <ChampionIcon
              :champion-id="member.championId"
              class="size-7 shrink-0 rounded"
              :ring="isSelf(member.championId)"
              ring-color="#2a947d"
              :ring-width="2"
            />

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1">
                <span class="truncate text-[11px] text-black/85 dark:text-white/85">
                  {{ resources.champions.name(member.championId) }}
                </span>
                <span
                  v-if="isSelf(member.championId)"
                  class="shrink-0 rounded bg-teal-600/15 px-1 text-[9px] leading-4 text-teal-700 dark:text-teal-300"
                >
                  {{ t('draftAdvisor.self') }}
                </span>
              </div>
              <div class="text-[9px] leading-4 text-black/40 dark:text-white/40">
                {{ roleLabel(member.position) }}
              </div>
            </div>

            <span
              class="shrink-0 text-[11px] font-semibold tabular-nums"
              :class="scoreClass(member.winRate)"
            >
              {{ formatScore(member.winRate) }}
            </span>
          </li>
        </ul>
      </section>

      <section class="flex min-w-0 flex-1 flex-col">
        <div
          class="flex shrink-0 items-center gap-2 border-b border-black/8 px-3 py-2 dark:border-white/10"
        >
          <NRadioGroup
            size="small"
            :value="board"
            :disabled="!settings.enabled"
            @update:value="handleBoardChange"
          >
            <NRadioButton value="ally">{{ t('draftAdvisor.board.ally') }}</NRadioButton>
            <NRadioButton value="opponent">{{ t('draftAdvisor.board.opponent') }}</NRadioButton>
          </NRadioGroup>

          <span class="ml-auto truncate text-[10px] text-black/40 dark:text-white/40">
            {{ t('draftAdvisor.columns.role') }} · {{ t('draftAdvisor.columns.champion') }} ·
            {{ t('draftAdvisor.columns.score') }}
          </span>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-2 py-1.5">
          <div
            v-if="emptyState"
            class="flex h-full items-center justify-center px-6 text-center text-xs text-black/45 dark:text-white/45"
          >
            {{ emptyState }}
          </div>

          <ul v-else class="m-0 list-none p-0">
            <li
              v-for="(candidate, index) in activeBoard"
              :key="candidate.championId"
              class="mb-0.5 flex items-center gap-2 rounded px-1.5 py-1"
              :class="index === 0 ? 'bg-black/4 dark:bg-white/8' : ''"
            >
              <span
                class="w-4 shrink-0 text-center text-[10px] text-black/35 tabular-nums dark:text-white/35"
              >
                {{ index + 1 }}
              </span>

              <span
                class="w-8 shrink-0 truncate text-[9px] text-black/50 dark:text-white/50"
                :title="roleLabel(candidate.role)"
              >
                {{ shortRoleLabel(candidate.role) }}
              </span>

              <ChampionIcon :champion-id="candidate.championId" class="size-7 shrink-0 rounded" />

              <span class="min-w-0 flex-1 truncate text-[11px] text-black/85 dark:text-white/85">
                {{ resources.champions.name(candidate.championId) }}
              </span>

              <span
                class="shrink-0 text-[9px] text-black/40 tabular-nums dark:text-white/40"
                :title="breakdownTooltip(candidate)"
              >
                {{ formatSignals(candidate) }}
              </span>

              <span
                class="w-11 shrink-0 text-right text-[12px] font-bold tabular-nums"
                :class="scoreClass(candidate.teamScore)"
              >
                {{ candidate.teamScore.toFixed(2) }}
              </span>
            </li>
          </ul>

          <div
            v-if="!emptyState && gapMessages.length > 0"
            class="mt-2 rounded bg-amber-500/10 px-2 py-1.5 text-[10px] leading-4 text-amber-700 dark:text-amber-300"
          >
            <div v-for="message in gapMessages" :key="message">{{ message }}</div>
          </div>
        </div>
      </section>

      <section
        class="flex w-52 shrink-0 flex-col border-l border-black/8 bg-black/2 dark:border-white/10 dark:bg-white/4"
      >
        <div class="flex shrink-0 items-baseline justify-between gap-2 px-3 pt-2.5 pb-1.5">
          <span
            class="text-[15px] font-bold tabular-nums"
            :class="scoreClass(snapshot.teamScore?.opponent)"
          >
            {{ formatScore(snapshot.teamScore?.opponent) }}
          </span>
          <span class="text-[11px] font-medium text-black/60 dark:text-white/60">
            {{ t('draftAdvisor.roster.opponent') }}
          </span>
        </div>

        <ul class="m-0 min-h-0 flex-1 list-none overflow-y-auto p-0 px-2 pb-2">
          <li
            v-for="member in snapshot.opponentMembers"
            :key="member.championId"
            class="mb-1 flex items-center gap-2 rounded px-1.5 py-1"
          >
            <span
              class="shrink-0 text-[11px] font-semibold tabular-nums"
              :class="scoreClass(member.winRate)"
            >
              {{ formatScore(member.winRate) }}
            </span>

            <div class="min-w-0 flex-1 text-right">
              <div class="truncate text-[11px] text-black/85 dark:text-white/85">
                {{ resources.champions.name(member.championId) }}
              </div>
              <div class="text-[9px] leading-4 text-black/40 dark:text-white/40">
                {{ roleLabel(member.position) }}
              </div>
            </div>

            <ChampionIcon :champion-id="member.championId" class="size-7 shrink-0 rounded" />
          </li>
        </ul>
      </section>
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
import type { ChampionDataPosition } from '@shared/data-adapter/champion-data'
import type { DraftAdvisorCandidate, DraftAdvisorTeamSide } from '@shared/types/draft-advisor'
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
import { NInputNumber, NRadioButton, NRadioGroup, NSelect, NSwitch, NTag } from 'naive-ui'
import { computed, ref } from 'vue'

const MIN_CANDIDATE_LIMIT = MIN_DRAFT_ADVISOR_CANDIDATE_LIMIT
const MAX_CANDIDATE_LIMIT = MAX_DRAFT_ADVISOR_CANDIDATE_LIMIT

const { t } = useTranslation()

const resources = useAkariResourceProvider()
const draftAdvisor = useInstance(DraftAdvisorRenderer)
const store = useDraftAdvisorStore()

const settings = computed(() => store.settings)
const snapshot = computed(() => store.snapshot)

// 默认看自己的候选榜: 面板的用途就是"我该选什么", 对方那栏是补充视角。
const board = ref<DraftAdvisorTeamSide>('ally')

const activeBoard = computed(() =>
  board.value === 'ally' ? snapshot.value.candidates : snapshot.value.opponentCandidates
)

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

  if (activeBoard.value.length === 0) {
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

  if (gaps.positionUnknown) {
    messages.push(t('draftAdvisor.gaps.positionUnknown'))
  }

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

/**
 * 阵容里哪一行是本机玩家。用本方英雄本身来判断, 而不是依赖行序 —— 行序虽然保证
 * "本机玩家排在首位", 但那是取数层的约定, 不该让展示层去承担。
 */
function isSelf(championId: number) {
  return championId === snapshot.value.selfChampionId
}

/** 分路标签。位置缺失时明确说"未知", 而不是留空让人以为没这条信息。 */
function roleLabel(position: ChampionDataPosition | null | undefined) {
  return position ? t(`draftAdvisor.position.${position}`) : t('draftAdvisor.position.unknown')
}

/**
 * 候选榜的列很窄, 只放两三个字的分路缩写, 完整名称挂在 title 上。
 */
function shortRoleLabel(position: ChampionDataPosition | null | undefined) {
  return position ? t(`draftAdvisor.positionShort.${position}`) : '—'
}

function formatScore(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : value.toFixed(2)
}

/**
 * 把候选的分数来源压成一行提示, 让"为什么推荐它"可以被核对。
 */
function formatSignals(candidate: DraftAdvisorCandidate) {
  const parts: string[] = []
  const { breakdown } = candidate

  if (breakdown.matchupDelta !== null) {
    parts.push(`${t('draftAdvisor.signals.matchup')}${formatDelta(breakdown.matchupDelta)}`)
  }

  if (breakdown.synergyDelta !== null) {
    parts.push(`${t('draftAdvisor.signals.synergy')}${formatDelta(breakdown.synergyDelta)}`)
  }

  if (parts.length === 0 && breakdown.baseWinRate !== null) {
    parts.push(`${t('draftAdvisor.signals.base')}${breakdown.baseWinRate.toFixed(2)}`)
  }

  return parts.join(' ')
}

function breakdownTooltip(candidate: DraftAdvisorCandidate) {
  const { breakdown } = candidate
  const lines = [
    `${t('draftAdvisor.signals.base')}: ${formatScore(breakdown.baseWinRate)}`,
    `${t('draftAdvisor.signals.matchup')}: ${formatDelta(breakdown.matchupDelta)} (${breakdown.matchupSamples})`,
    `${t('draftAdvisor.signals.synergy')}: ${formatDelta(breakdown.synergyDelta)} (${breakdown.synergySamples})`,
    `${t('draftAdvisor.winRate')}: ${candidate.winRate.toFixed(2)}`
  ]

  return lines.join('\n')
}

function formatDelta(value: number | null) {
  if (value === null) {
    return '—'
  }

  const rounded = value.toFixed(1)
  return value > 0 ? `+${rounded}` : rounded
}

/**
 * 沿用项目内既有的胜率配色约定: 明显高于中性值用绿色, 明显低于用红色。
 */
function scoreClass(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return 'text-black/40 dark:text-white/40'
  }

  if (score >= 53) {
    return 'text-green-700 dark:text-green-300'
  }

  if (score <= 47) {
    return 'text-red-700 dark:text-red-400'
  }

  return 'text-black/80 dark:text-white/80'
}

function handleBoardChange(value: DraftAdvisorTeamSide) {
  board.value = value
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
