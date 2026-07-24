<template>
  <div class="flex h-6 items-center">
    <NModal v-model:show="show">
      <div class="w-[min(90vw,50rem)] rounded-md bg-white/95 p-3 shadow-xl dark:bg-neutral-900/95">
        <OrderedChampionSelector
          v-model="champions"
          :champions="championOptions"
          :loading="championCatalogLoading"
          :match-champion="matchChampion"
        />
      </div>
    </NModal>

    <NButton size="tiny" class="mr-2! shrink-0" @click="show = true">
      <template #icon>
        <NIcon>
          <Edit20FilledIcon />
        </NIcon>
      </template>
    </NButton>

    <div class="flex flex-wrap items-center gap-1">
      <ChampionIcon
        v-for="championId of champions.slice(0, maxShow)"
        :key="championId"
        :champion-id="championId"
        :stretched="false"
        class="size-5 rounded"
        :title="championName(championId)"
        :class="{ 'brightness-50': isChampionUnavailable(championId) }"
      />
      <div v-if="champions.length > maxShow" class="text-xs text-black/60 dark:text-white/60">
        +{{ champions.length - maxShow }}
      </div>
      <div v-if="champions.length === 0" class="text-xs text-black/60 dark:text-white/60">
        {{ t('automation.orderedChampionList.unselected') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useChampionNameMatch } from '@main-window/composables/useChampionNameMatch'
import { useSelfHostedLcuDataStore } from '@main-window/shards/self-hosted-lcu-data/store'
import {
  ORDERED_CHAMPION_POSITIONS,
  OrderedChampionSelector,
  type OrderedChampionOption,
  type OrderedChampionPosition
} from '@renderer-shared/components/ordered-champion-selector'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Edit20Filled as Edit20FilledIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NModal } from 'naive-ui'
import { computed } from 'vue'

const { t } = useTranslation()

const {
  maxShow = 5,
  allowDummy = false,
  allowBravery = false,
  type = 'pick'
} = defineProps<{
  maxShow?: number
  maxCount?: number
  type?: 'pick' | 'ban'
  allowDummy?: boolean
  allowBravery?: boolean
}>()

const show = defineModel<boolean>('show', { default: false })
const champions = defineModel<number[]>('champions', { default: () => [] })

const lcs = useLeagueClientStore()
const selfHostedLcuData = useSelfHostedLcuDataStore()
const resources = useAkariResourceProvider()
const { match: isChampionNameMatch } = useChampionNameMatch()

const championCatalogLoading = computed(
  () => lcs.isConnected && Object.keys(lcs.gameData.champions).length === 0
)

const positionSet = new Set<string>(ORDERED_CHAMPION_POSITIONS)

const championPositions = (championId: number): OrderedChampionPosition[] | undefined => {
  const recommendedPositions =
    selfHostedLcuData.recommendedChampionPositions?.[championId]?.recommendedPositions

  if (!recommendedPositions?.length) {
    return undefined
  }

  const positions = recommendedPositions.filter((position): position is OrderedChampionPosition =>
    positionSet.has(position)
  )

  return positions.length ? positions : undefined
}

const isChampionUnavailable = (championId: number) => {
  if (lcs.gameflow.phase !== 'ChampSelect') {
    return false
  }

  return type === 'pick'
    ? !lcs.champSelect.currentPickableChampionIds.has(championId)
    : !lcs.champSelect.currentBannableChampionIds.has(championId)
}

const championName = (championId: number) => resources.champions.name(championId)

const championOptions = computed<OrderedChampionOption[]>(() => {
  const optionById = new Map<number, OrderedChampionOption>()

  for (const champion of Object.values(lcs.gameData.champions)) {
    optionById.set(champion.id, {
      id: champion.id,
      name: champion.name,
      positions: championPositions(champion.id),
      unavailable: isChampionUnavailable(champion.id)
    })
  }

  if (allowDummy && !optionById.has(-1)) {
    optionById.set(-1, {
      id: -1,
      name: championName(-1),
      unavailable: isChampionUnavailable(-1)
    })
  }

  if (allowBravery) {
    optionById.set(-3, {
      id: -3,
      name: championName(-3),
      unavailable: isChampionUnavailable(-3)
    })
  }

  return [...optionById.values()]
    .filter(
      (champion) =>
        champion.id !== 0 &&
        (allowDummy || champion.id !== -1) &&
        (allowBravery || champion.id !== -3) &&
        !lcs.champSelect.disabledChampionIds.has(champion.id)
    )
    .toSorted((a, b) => {
      if (a.id < 0 || b.id < 0) {
        if (a.id < 0 && b.id < 0) {
          return a.id - b.id
        }

        return a.id < 0 ? -1 : 1
      }

      return a.name.localeCompare(b.name, 'zh-Hans-CN')
    })
})

const matchChampion = (pattern: string, champion: OrderedChampionOption) =>
  isChampionNameMatch(pattern, champion.name, champion.id)
</script>
