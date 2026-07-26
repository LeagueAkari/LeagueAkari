<template>
  <div class="flex h-6 min-w-0 flex-1 items-center">
    <NModal v-model:show="show">
      <div
        class="w-[min(90vw,50rem)] overflow-hidden rounded-lg border border-solid border-white/10 bg-neutral-100 dark:bg-neutral-900"
      >
        <div
          class="flex h-11 items-center gap-2 border-b border-black/10 px-3 dark:border-white/10"
        >
          <div class="mr-auto text-base font-bold">
            {{ t(`automation.orderedChampionList.${type}ModalTitle`) }}
          </div>
          <NButton
            quaternary
            circle
            size="small"
            :focusable="false"
            :aria-label="t('automation.orderedChampionList.close')"
            :title="t('automation.orderedChampionList.close')"
            @click="show = false"
          >
            <template #icon>
              <NIcon><CloseIcon /></NIcon>
            </template>
          </NButton>
        </div>

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

    <div
      ref="previewContainer"
      class="relative flex min-w-0 flex-1 items-center gap-1 overflow-hidden"
    >
      <ChampionIcon
        v-for="championId of visibleChampionIds"
        :key="championId"
        :champion-id="championId"
        :stretched="false"
        class="size-5 shrink-0 rounded"
        :title="championName(championId)"
        :class="{ 'brightness-50': isChampionUnavailable(championId) }"
      />

      <NPopover
        v-if="hiddenChampionCount"
        placement="top-end"
        :show-arrow="false"
        :keep-alive-on-hover="true"
        :scrollable="true"
        :style="{ maxHeight: 'min(50vh, 20rem)' }"
      >
        <template #trigger>
          <div
            class="absolute top-1/2 flex h-5 w-9 -translate-y-1/2 cursor-default items-center justify-center rounded text-xs text-black/60 [font-variant-numeric:tabular-nums] transition-colors hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/6"
            :style="{ left: `${visibleChampionCount * PREVIEW_ITEM_SLOT_WIDTH}px` }"
          >
            +{{ hiddenChampionCount }}
          </div>
        </template>

        <ol class="m-0 flex w-60 list-none flex-col gap-0.5 p-0">
          <li
            v-for="(championId, index) of champions"
            :key="championId"
            class="box-border flex min-w-0 items-center gap-1.5 px-1 py-1 select-none"
            :class="{ 'brightness-50': isChampionUnavailable(championId) }"
            :data-unavailable="isChampionUnavailable(championId) || undefined"
          >
            <span
              class="w-4 shrink-0 text-center text-[10px] font-medium text-black/35 [font-variant-numeric:tabular-nums] dark:text-white/35"
            >
              {{ index + 1 }}
            </span>
            <ChampionIcon
              :champion-id="championId"
              :stretched="false"
              class="size-6 shrink-0 rounded"
              :title="championName(championId)"
            />
            <span
              class="min-w-0 flex-1 truncate text-xs font-medium text-black/78 dark:text-white/82"
            >
              {{ championName(championId) }}
            </span>
          </li>
        </ol>
      </NPopover>

      <div
        v-if="champions.length === 0"
        class="min-w-0 truncate text-xs text-black/60 dark:text-white/60"
      >
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
import { Close as CloseIcon } from '@vicons/carbon'
import { Edit20Filled as Edit20FilledIcon } from '@vicons/fluent'
import { useElementSize } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NModal, NPopover } from 'naive-ui'
import { computed, useTemplateRef } from 'vue'

const { t } = useTranslation()

const {
  maxShow,
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
const previewContainer = useTemplateRef<HTMLElement>('previewContainer')
const { width: previewContainerWidth } = useElementSize(previewContainer)

const PREVIEW_ICON_WIDTH = 20
const PREVIEW_ITEM_GAP = 4
const PREVIEW_ITEM_SLOT_WIDTH = PREVIEW_ICON_WIDTH + PREVIEW_ITEM_GAP
const OVERFLOW_INDICATOR_WIDTH = 36

const visibleChampionCount = computed(() => {
  const total = champions.value.length
  const configuredLimit =
    maxShow === undefined ? total : Math.min(total, Math.max(0, Math.floor(maxShow)))

  if (!total || !previewContainer.value) {
    return configuredLimit
  }

  const configuredLimitWidth =
    configuredLimit * PREVIEW_ICON_WIDTH + Math.max(0, configuredLimit - 1) * PREVIEW_ITEM_GAP
  const requiresOverflowIndicator =
    configuredLimit < total || configuredLimitWidth > previewContainerWidth.value

  if (!requiresOverflowIndicator) {
    return configuredLimit
  }

  const availableIconSlots = Math.max(
    0,
    Math.floor((previewContainerWidth.value - OVERFLOW_INDICATOR_WIDTH) / PREVIEW_ITEM_SLOT_WIDTH)
  )

  return Math.min(configuredLimit, availableIconSlots)
})

const visibleChampionIds = computed(() => champions.value.slice(0, visibleChampionCount.value))
const hiddenChampionCount = computed(() => champions.value.length - visibleChampionCount.value)

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
