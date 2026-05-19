<template>
  <NModal v-model:show="show">
    <div
      class="flex h-[82vh] max-h-190 min-h-130 w-175 flex-col rounded-lg bg-neutral-100/95 p-4 shadow-xl dark:bg-neutral-900/95"
    >
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <div class="text-lg font-bold text-gray-900 dark:text-white">
            {{ t('PlayerTab.championMastery.modalTitle') }}
          </div>
          <div
            class="text-xs text-gray-500 dark:text-gray-400"
            v-if="score !== undefined || masteries.length"
          >
            <template v-if="score !== undefined">
              {{ t('PlayerTab.championMastery.score', { score }) }}
            </template>
            <template v-if="score !== undefined && masteries.length"> · </template>
            <template v-if="masteries.length">
              {{
                t('PlayerTab.championMastery.filteredChampions', {
                  count: filteredMasteries.length,
                  total: masteries.length
                })
              }}
            </template>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <NButton
            secondary
            size="small"
            :focusable="false"
            :loading="isRefreshing"
            :title="t('PlayerTab.refreshPage')"
            @click="reloadChampionMastery"
          >
            <template #icon>
              <NIcon><RefreshIcon /></NIcon>
            </template>
          </NButton>
          <NButton secondary size="small" :focusable="false" @click="show = false">
            <template #icon>
              <NIcon><CloseIcon /></NIcon>
            </template>
          </NButton>
        </div>
      </div>

      <NInput
        v-model:value="filterInput"
        clearable
        size="small"
        class="mb-3"
        :placeholder="t('PlayerTab.championMastery.filterPlaceholder')"
      >
        <template #prefix>
          <NIcon :component="SearchIcon" />
        </template>
      </NInput>

      <div v-if="isInitialLoading" class="flex h-80 items-center justify-center">
        <NSpin />
      </div>

      <div
        v-else-if="error"
        class="flex h-80 items-center justify-center text-sm text-red-600 dark:text-red-300"
      >
        {{ t('PlayerTab.championMastery.loadFailed', { reason: error }) }}
      </div>

      <div
        v-else-if="!filteredMasteries.length"
        class="flex h-80 items-center justify-center text-sm text-gray-500 dark:text-gray-400"
      >
        {{
          masteries.length
            ? t('PlayerTab.championMastery.noFilterResult')
            : t('PlayerTab.championMastery.noData')
        }}
      </div>

      <NVirtualList
        v-else
        class="h-0 flex-1 overflow-y-auto"
        :item-size="CHAMPION_MASTERY_MODAL_ITEM_SIZE"
        key-field="championId"
        :items="filteredMasteries"
      >
        <template #default="{ item: mastery }">
          <div class="h-14">
            <div class="flex h-full items-center gap-2.5">
              <ChampionIcon class="h-8 w-8 shrink-0 rounded" :champion-id="mastery.championId" />

              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-center gap-1.5 overflow-hidden">
                  <div class="truncate font-bold text-gray-900 dark:text-white">
                    {{ championName(mastery.championId) }}
                  </div>
                  <div
                    class="truncate text-[11px] text-gray-500 dark:text-gray-400"
                    v-if="masteryMetaText(mastery)"
                  >
                    {{ masteryMetaText(mastery) }}
                  </div>
                </div>

                <div class="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {{ secondaryText(mastery) }}
                </div>
              </div>

              <div class="w-34 shrink-0 text-right">
                <div
                  class="text-[11px] font-semibold text-gray-800 tabular-nums dark:text-gray-100"
                >
                  {{ t('PlayerTab.championMastery.level', { level: mastery.championLevel }) }}
                </div>
                <div class="text-[11px] text-gray-500 tabular-nums dark:text-gray-400">
                  {{
                    t('PlayerTab.championMastery.points', {
                      points: formatExtremeNumber(mastery.championPoints)
                    })
                  }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </NVirtualList>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useNumberFormatter } from '@renderer-shared/composables/useNumberFormatter'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { Mastery } from '@shared/types/league-client/champion-mastery'
import { Close as CloseIcon, Renew as RefreshIcon, Search as SearchIcon } from '@vicons/carbon'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NInput, NModal, NSpin, NVirtualList } from 'naive-ui'
import { computed, ref, shallowRef, watch } from 'vue'

import { useChampionNameMatch } from '@main-window/composables/useChampionNameMatch'

import { CHAMPION_MASTERY_MODAL_ITEM_SIZE } from '../constants'

const { puuid, score } = defineProps<{
  puuid: string
  score?: number
}>()

const show = defineModel<boolean>('show', { default: false })

const { t } = useTranslation()
const componentName = useComponentName()
const lc = useInstance(LeagueClientRenderer)
const log = useInstance(LoggerRenderer)
const lcs = useLeagueClientStore()
const { formatExtremeNumber } = useNumberFormatter()
const { match: isNameMatch } = useChampionNameMatch()

const data = shallowRef<Mastery[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const filterInput = ref('')
let loadVersion = 0

const masteries = computed(() => {
  return data.value.toSorted((a, b) => b.championPoints - a.championPoints)
})

const filteredMasteries = computed(() => {
  const pattern = filterInput.value.trim()

  if (!pattern) {
    return masteries.value
  }

  return masteries.value.filter((m) =>
    isNameMatch(pattern, championName(m.championId), m.championId)
  )
})

const isInitialLoading = computed(() => isLoading.value && data.value.length === 0)
const isRefreshing = computed(() => isLoading.value && data.value.length > 0)

const loadChampionMastery = async () => {
  if (isLoading.value) {
    return
  }

  const version = ++loadVersion
  isLoading.value = true
  error.value = null

  try {
    const { data: result } = await lc.api.championMastery.getPlayerChampionMastery(puuid)

    if (!show.value || version !== loadVersion) {
      return
    }

    data.value = result
  } catch (e: any) {
    if (!show.value || version !== loadVersion) {
      return
    }

    error.value = e?.message || String(e)
    log.error(componentName, e)
  } finally {
    if (version === loadVersion) {
      isLoading.value = false
    }
  }
}

const reloadChampionMastery = () => {
  void loadChampionMastery()
}

const championName = (championId: number) => {
  return lcs.gameData.champions[championId]?.name || championId.toString()
}

const reset = () => {
  loadVersion++
  data.value = []
  filterInput.value = ''
  error.value = null
  isLoading.value = false
}

watch(show, (visible) => {
  if (visible) {
    void loadChampionMastery()
    return
  }

  reset()
})

const formatTime = (value: number) => dayjs(value).format('YYYY-MM-DD')

const secondaryText = (mastery: Mastery) => {
  const parts: string[] = []

  if (mastery.lastPlayTime) {
    parts.push(formatTime(mastery.lastPlayTime))
  }

  parts.push(
    t('PlayerTab.championMastery.progress', {
      since: formatExtremeNumber(mastery.championPointsSinceLastLevel),
      until: formatExtremeNumber(mastery.championPointsUntilNextLevel)
    })
  )

  if (mastery.tokensEarned) {
    parts.push(t('PlayerTab.championMastery.tokensEarned', { count: mastery.tokensEarned }))
  }

  return parts.join(' · ')
}

const masteryMetaText = (mastery: Mastery) => {
  const parts: string[] = []

  if (mastery.highestGrade) {
    parts.push(t('PlayerTab.championMastery.highestGrade', { grade: mastery.highestGrade }))
  }

  if (mastery.championSeasonMilestone) {
    parts.push(
      t('PlayerTab.championMastery.seasonMilestone', {
        milestone: mastery.championSeasonMilestone
      })
    )
  }

  return parts.join(' · ')
}
</script>
