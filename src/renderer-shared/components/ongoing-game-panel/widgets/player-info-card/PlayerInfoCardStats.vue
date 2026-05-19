<template>
  <div class="mb-1 flex items-center">
    <template v-if="queueType === 'CHERRY'">
      <NPopover :keep-alive-on-hover="false" :disabled="!analysis" :delay="50">
        <template #trigger>
          <div
            v-if="analysis"
            class="flex-1 text-center text-[13px] font-bold"
            :class="{
              'text-green-700 dark:text-green-300': analysis.winLoss.cherry.winRate >= 0.53,
              'text-black/80 dark:text-white/80':
                analysis.winLoss.cherry.winRate > 0.47 && analysis.winLoss.cherry.winRate < 0.53,
              'text-red-700 dark:text-red-400': analysis.winLoss.cherry.winRate <= 0.47
            }"
          >
            {{ (analysis.winLoss.cherry.winRate * 100).toFixed() }}%
            <span class="text-[11px] font-normal"
              >/
              {{
                t('PlayerInfoCard.1st', {
                  rate: (analysis.winLoss.cherry.top1Rate * 100).toFixed()
                })
              }}</span
            >
            <span class="text-[9px] font-normal text-black/90 dark:text-white/90">
              ({{ analysis.winLoss.cherry.count }})</span
            >
          </div>
          <div v-else class="flex-1 text-center text-[13px] font-bold">— %</div>
        </template>
        <div class="max-w-50 text-xs" v-if="analysis">
          {{
            t('PlayerInfoCard.cherryWinRatePopover', {
              count: analysis.count,
              winRate: (analysis.winLoss.all.winRate * 100).toFixed(2),
              cherryCount: analysis.winLoss.cherry.count,
              top1Rate: (analysis.winLoss.cherry.top1Rate * 100).toFixed(2)
            })
          }}
        </div>
      </NPopover>
    </template>

    <template v-else>
      <NPopover :keep-alive-on-hover="false" :disabled="!analysis">
        <template #trigger>
          <div
            v-if="analysis"
            class="flex-1 text-center text-[13px] font-bold"
            :class="{
              'text-green-700 dark:text-green-300': analysis.winLoss.all.winRate >= 0.53,
              'text-black/80 dark:text-white/80':
                analysis.winLoss.all.winRate > 0.47 && analysis.winLoss.all.winRate < 0.53,
              'text-red-700 dark:text-red-400': analysis.winLoss.all.winRate <= 0.47
            }"
          >
            {{ (analysis.winLoss.all.winRate * 100).toFixed() }}%
            <span class="text-[9px] font-normal text-black/90 dark:text-white/90"
              >({{ analysis.count }})</span
            >
          </div>
          <div v-else class="flex-1 text-center text-[13px] font-bold">— %</div>
        </template>
        <div class="max-w-50 text-xs" v-if="analysis">
          {{
            t('PlayerInfoCard.winRatePopover', {
              count: analysis.count,
              winRate: (analysis.winLoss.all.winRate * 100).toFixed(),
              wins: analysis.winLoss.all.wins,
              losses: analysis.winLoss.all.losses
            })
          }}
        </div>
      </NPopover>
    </template>

    <NPopover :keep-alive-on-hover="false" :disabled="!analysis" :delay="50">
      <template #trigger>
        <div
          class="flex-1 text-center text-[13px] font-bold"
          :class="{
            'text-green-700 dark:text-green-300': kdaIqr === 'over',
            'text-black/80 dark:text-white/80': kdaIqr === null || kdaIqr === undefined,
            'text-red-700 dark:text-red-400': kdaIqr === 'below'
          }"
        >
          {{ analysis?.summary.avgKda.toFixed(2) || '—' }}
        </div>
      </template>
      <div class="max-w-50 text-xs" v-if="analysis">
        {{
          t('PlayerInfoCard.kdaPopover', {
            count: analysis.count,
            kda: analysis.summary.avgKda.toFixed(2),
            kills: (analysis.summary.kills / analysis.count || 1).toFixed(2),
            deaths: (analysis.summary.deaths / analysis.count || 1).toFixed(2),
            assists: (analysis.summary.assists / analysis.count || 1).toFixed(2)
          })
        }}
        (KDA CV: {{ analysis.summary.kdaCv.toFixed(2) }})
      </div>
    </NPopover>

    <NPopover v-if="positionInfo">
      <template #trigger>
        <div
          class="flex flex-1 items-center justify-center gap-0.5 text-base"
          :class="{
            'ml-4': !(positionInfo.role && positionInfo.role.assignmentReason === 'AUTOFILL')
          }"
        >
          <div
            v-if="positionInfo.role && positionInfo.role.assignmentReason === 'AUTOFILL'"
            class="rounded px-1 py-0.5 text-[11px] leading-2.75 whitespace-nowrap text-black dark:text-white"
            :style="{
              'background-color': positionAssignmentReason.AUTOFILL_SHORT?.color,
              color: positionAssignmentReason.AUTOFILL_SHORT?.foregroundColor
            }"
          >
            {{ positionAssignmentReason.AUTOFILL_SHORT?.name }}
          </div>

          <template v-if="positionInfo.current && positionInfo.current !== 'NONE'">
            <PositionIcon :position="positionInfo.current" />
            <div
              v-if="(positionInfo.recent && positionInfo.recent.length) || positionInfo.role"
              class="mx-0.5 h-3 w-px bg-black/25 dark:bg-white/25"
            ></div>
          </template>

          <template v-if="positionInfo.recent && positionInfo.recent.length">
            <PositionIcon
              v-for="p of positionInfo.recent.slice(0, 3)"
              :key="p.position"
              :position="p.position"
            />
          </template>
          <template v-else-if="positionInfo.role">
            <PositionIcon :position="positionInfo.role.primary" />
            <PositionIcon
              v-if="positionInfo.role.secondary !== 'UNSELECTED'"
              :position="positionInfo.role.secondary"
            />
          </template>
        </div>
      </template>
      <div>
        <div class="mb-2 flex items-end gap-1">
          <PositionIcon
            v-if="positionInfo.current && positionInfo.current !== 'NONE'"
            class="text-lg text-black dark:text-white"
            :position="positionInfo.current || 'ALL'"
          />
          <span class="text-sm font-bold">{{
            t(`positions.${positionInfo.current || 'ALL'}`, {
              ns: 'common'
            })
          }}</span>
          <div
            v-if="positionInfo.role && positionInfo.role.assignmentReason !== 'NONE'"
            class="rounded px-1 py-0.5 text-[11px] leading-2.75 whitespace-nowrap text-black dark:text-white"
            :style="{
              'background-color':
                positionAssignmentReason[positionInfo.role.assignmentReason]?.color || '#5b4694',
              color:
                positionAssignmentReason[positionInfo.role.assignmentReason]?.foregroundColor ||
                '#ffffff'
            }"
          >
            {{
              positionAssignmentReason[positionInfo.role.assignmentReason]?.name ||
              positionInfo.role.assignmentReason
            }}
          </div>
        </div>
        <div v-if="positionInfo.recent && positionInfo.recent.length" class="flex items-center">
          <span class="mr-2 w-16 text-xs">{{ t('PlayerInfoCard.position.recentlyPlayed') }}</span>
          <PositionIcon
            class="text-lg text-black dark:text-white"
            v-for="p of positionInfo.recent"
            :key="p.position"
            :position="p.position"
          />
        </div>
        <div v-if="positionInfo.role" class="flex items-center">
          <span class="mr-2 w-16 text-xs">{{ t('PlayerInfoCard.position.selection') }}</span>
          <PositionIcon
            class="text-lg text-black dark:text-white"
            :position="positionInfo.role.primary"
          />
          <PositionIcon
            class="text-lg text-black dark:text-white"
            v-if="positionInfo.role.secondary !== 'UNSELECTED'"
            :position="positionInfo.role.secondary"
          />
        </div>
      </div>
    </NPopover>
  </div>
</template>

<script setup lang="ts">
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { ParsedRole } from '@shared/utils/ranked'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

import { useOngoingGamePanel } from '../../context'

const { puuid } = defineProps<{
  puuid: string
}>()

const { t } = useTranslation()
const ogs = useOngoingGameStore()
const { kdaOutliers } = useOngoingGamePanel()

const analysis = computed(() => ogs.analysis?.players[puuid])
const position = computed(() => ogs.positionAssignments?.[puuid])
const queueType = computed(() => ogs.queryStage.gameInfo?.queueType)
const kdaIqr = computed(() => kdaOutliers.value?.[puuid])

const positionInfo = computed(() => {
  const info = {
    current: null as string | null,
    role: null as ParsedRole | null,
    recent: [] as { position: string; count: number }[]
  }

  if (!position.value?.position || position.value.position === 'NONE') {
    return null
  }

  info.current = position.value.position
  info.role = position.value.role

  if (analysis.value?.positions) {
    const recentPositions = Object.entries(analysis.value.positions)
      .map(([position, count]) => ({ position, count }))
      .filter((p) => p.position !== 'NONE' && p.count > 0)
      .toSorted((a, b) => b.count - a.count)

    info.recent = recentPositions
  }

  return info
})

const positionAssignmentReason = computed<
  Record<string, { name: string; color: string; foregroundColor: string }>
>(() => {
  return {
    FILL_SECONDARY: {
      name: t('positionAssignmentReason.FILL_SECONDARY', { ns: 'common' }),
      color: '#82613b',
      foregroundColor: '#ffffff'
    },
    FILL_PRIMARY: {
      name: t('positionAssignmentReason.FILL_PRIMARY', { ns: 'common' }),
      color: '#5b4694',
      foregroundColor: '#ffffff'
    },
    PRIMARY: {
      name: t('positionAssignmentReason.PRIMARY', { ns: 'common' }),
      color: '#5b4694',
      foregroundColor: '#ffffff'
    },
    SECONDARY: {
      name: t('positionAssignmentReason.SECONDARY', { ns: 'common' }),
      color: '#5b4694',
      foregroundColor: '#ffffff'
    },
    AUTOFILL: {
      name: t('positionAssignmentReason.AUTOFILL', { ns: 'common' }),
      color: '#944646',
      foregroundColor: '#ffffff'
    },
    AUTOFILL_SHORT: {
      name: t('positionAssignmentReason.AUTOFILL_SHORT', { ns: 'common' }),
      color: '#944646',
      foregroundColor: '#ffffff'
    }
  }
})
</script>
