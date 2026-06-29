<template>
  <NScrollbar
    ref="scrollbarRef"
    x-scrollable
    class="max-h-142 rounded border border-solid border-black/5 dark:border-white/5"
  >
    <div class="mb-1 flex items-center gap-4 bg-black/5 px-2 py-1 dark:bg-white/5">
      <div class="text-[11px] text-black/80 dark:text-white/60" v-if="!hidePrivacy">
        {{ t('matchCard.detailsTab.gameId') }}:
        <span class="select-text">{{ basicInfo.gameId }}</span> ({{ basicInfo.dataSource }})
      </div>
      <div class="text-[11px] text-black/80 dark:text-white/60">
        {{ gameCreationText }}
      </div>
      <div class="text-[11px] text-black/80 dark:text-white/60">
        {{ t('matchCard.detailsTab.gameVersion') }}:
        <span class="select-text">{{ basicInfo.gameVersion }}</span>
      </div>
    </div>

    <table class="w-full border-separate [border-spacing:0]">
      <thead @wheel="handleHeaderWheel">
        <tr>
          <!-- divider -->
          <th
            class="sticky top-0 left-0 z-10 w-30 max-w-30 border-t-0 border-r-0 border-b border-l-0 border-solid border-b-black/5 bg-[#e5e5e5] p-2 text-left transition-colors dark:border-t-0 dark:border-r-0 dark:border-l-0 dark:border-b-white/5 dark:bg-[#1a1a1a]"
          >
            <NInput
              size="small"
              :placeholder="t('matchCard.detailsTab.filterPlaceholder')"
              v-model:value="filterText"
              clearable
            />
          </th>

          <!-- players from 1 to 10 -->
          <th
            v-for="p of rawStats"
            :key="p.participantId"
            class="sticky top-0 z-1 border-t-0 border-r-0 border-b border-l-0 border-solid border-b-black/5 bg-[#e5e5e5] p-2 text-center transition-colors dark:border-t-0 dark:border-r-0 dark:border-l-0 dark:border-b-white/5 dark:bg-[#1a1a1a]"
          >
            <div
              class="flex items-center justify-center"
              :title="
                hidePrivacy
                  ? lcs.gameData.championName(p.championId)
                  : `${p.identity.gameName} #${p.identity.tagLine}`
              "
            >
              <ChampionIcon
                :champion-id="p.championId"
                class="size-6 border-2 border-solid"
                :style="{
                  borderColor: getTeamColor(p.identity.teamIdentifier)
                }"
                round
              />
            </div>
          </th>
        </tr>
      </thead>

      <tbody v-if="filterText.trim() && groups.length === 0">
        <tr>
          <td
            :colspan="rawStats.length + 1"
            class="h-16 border-t-0 border-r-0 border-b border-l-0 border-solid border-b-black/5 p-2 text-center text-xs text-black/60 dark:border-t-0 dark:border-r-0 dark:border-l-0 dark:border-b-white/5 dark:text-white/60"
          >
            {{ t('matchCard.detailsTab.noFilterResult') }}
          </td>
        </tr>
      </tbody>

      <tbody v-else v-for="(group, index) of groups" :key="group.group">
        <tr v-if="index > 0">
          <td
            :colspan="rawStats.length + 1"
            class="h-4 border-t-0 border-r-0 border-b border-l-0 border-solid border-b-black/5 text-center text-xs text-black/60 dark:border-t-0 dark:border-r-0 dark:border-l-0 dark:border-b-white/5 dark:text-white/60"
          ></td>
        </tr>

        <tr v-for="row of group.rows" :key="row.key">
          <NPopover placement="right" v-if="row.chartData" :delay="200">
            <template #trigger>
              <td
                class="sticky left-0 z-2 w-30 max-w-30 truncate border-t-0 border-r-0 border-b border-l-0 border-solid border-b-black/5 bg-[#e5e5e5] p-2 text-center text-xs font-bold transition-colors dark:border-t-0 dark:border-r-0 dark:border-l-0 dark:border-b-white/5 dark:bg-[#1a1a1a]"
              >
                {{ getStatKeyTranslation(row.key) }}
              </td>
            </template>
            <StatsBarChart :chartData="row.chartData" :title="row.name" />
          </NPopover>
          <td
            v-else
            :title="getStatKeyTranslation(row.key)"
            class="sticky left-0 z-2 w-30 max-w-30 truncate border-t-0 border-r-0 border-b border-l-0 border-solid border-b-black/5 bg-[#e5e5e5] p-2 text-center text-xs font-bold transition-colors dark:border-t-0 dark:border-r-0 dark:border-l-0 dark:border-b-white/5 dark:bg-[#1a1a1a]"
          >
            {{ getStatKeyTranslation(row.key) }}
          </td>

          <!-- players from 1 to 10 -->
          <td
            v-for="cell of row.cells"
            class="max-w-24 truncate border-t-0 border-r-0 border-b border-l-0 border-solid border-b-black/5 p-2 text-center text-xs dark:border-t-0 dark:border-r-0 dark:border-l-0 dark:border-b-white/5"
          >
            <component :is="renderFn(() => row.render(cell as never))" />
          </td>
        </tr>
      </tbody>
    </table>
  </NScrollbar>
</template>

<script setup lang="tsx">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { refDebounced } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NInput, NPopover, NScrollbar } from 'naive-ui'
import { type VNodeChild, computed, ref, shallowRef } from 'vue'

import { useMatchCard } from '../context'
import {
  MAPPED_RENDER_GROUP_OPTIONS,
  RENDER_GROUP_DISPLAY_ORDER,
  RENDER_GROUPS,
  RenderGroupOptions,
  useRawDetails,
  useValueRenderer
} from '../utils/details-table'
import { getTeamColor } from '../utils/theme'
import StatsBarChart from '../widgets/StatsBarChart.vue'

const { basicInfo, hidePrivacy } = useMatchCard()

const scrollbarRef = ref<InstanceType<typeof NScrollbar> | null>(null)

const handleHeaderWheel = (e: WheelEvent) => {
  if (e.deltaY === 0) return

  e.preventDefault()

  scrollbarRef.value?.scrollBy?.({
    left: e.deltaY,
    top: 0,
    behavior: 'smooth'
  })
}

const lcs = useLeagueClientStore()
const rawStats = useRawDetails()
const valueRenderer = useValueRenderer()
const filterText = shallowRef('')
const filterTextDebounced = refDebounced(filterText, 250)
const groupDisplayOrder = new Map(RENDER_GROUP_DISPLAY_ORDER.map((group, index) => [group, index]))

const { t } = useTranslation()

const getStatKeyTranslation = (key: string) => {
  return t(`matchCard.statKeys.${key}`, { defaultValue: key })
}

const gameCreationText = computed(() => {
  return dayjs(basicInfo.value.gameCreation).format('YYYY-MM-DD HH:mm:ss')
})

const renderFn = (node: string | (() => VNodeChild)) => {
  if (typeof node === 'string') {
    return () => <>{node}</>
  }

  return node
}

const groups = computed(() => {
  if (rawStats.value.length === 0) {
    return []
  }

  const sortedByTeam = rawStats.value.toSorted(
    (a: { identity: { teamIdentifier: string } }, b: { identity: { teamIdentifier: string } }) => {
      return a.identity.teamIdentifier.localeCompare(b.identity.teamIdentifier)
    }
  )

  const undocumentedKeys = Object.keys(sortedByTeam[0]).filter(
    (key) => !MAPPED_RENDER_GROUP_OPTIONS[key]
  )

  const undocumentedGroup = {
    group: 'undocumented',
    items: undocumentedKeys.map(
      (key) =>
        ({
          key,
          render: 'auto' as const,
          hide: false
        }) as RenderGroupOptions
    )
  }

  return [...RENDER_GROUPS, undocumentedGroup]
    .toSorted((a, b) => {
      const orderA = groupDisplayOrder.get(a.group) ?? Number.MAX_SAFE_INTEGER
      const orderB = groupDisplayOrder.get(b.group) ?? Number.MAX_SAFE_INTEGER

      return orderA - orderB
    })
    .map((group) => {
      return {
        group: group.group,
        rows: group.items
          .map((item) => {
            if (item.hide === true) {
              return null
            }

            // @ts-ignore
            if (sortedByTeam[0][item.key] === undefined) {
              return null
            }

            const name = getStatKeyTranslation(item.key)

            if (
              filterTextDebounced.value.trim() &&
              !item.key.includes(filterTextDebounced.value) &&
              !name.toLowerCase().includes(filterTextDebounced.value.toLowerCase())
            ) {
              return null
            }

            const render = item.render || 'text'
            const rowCells = sortedByTeam.map((p: Record<string, any>) => p[item.key])

            // 支持 chart 展示的类型
            if (
              item.render === 'compat' ||
              item.render === 'integer' ||
              item.render === 'float' ||
              item.render === 'percentage'
            ) {
              const chartData = rowCells.map((cell, index) => {
                return {
                  participantId: sortedByTeam[index].participantId,
                  value: cell
                }
              })

              return {
                key: item.key as string,
                name,
                cells: rowCells,
                render: typeof render === 'function' ? render : valueRenderer[render],
                chartData
              }
            }

            return {
              key: item.key as string,
              name,
              cells: rowCells,
              render: typeof render === 'function' ? render : valueRenderer[render]
            }
          })
          .filter((r) => r !== null)
      }
    })
    .filter((g) => g.rows.length > 0)
})
</script>

<style scoped>
@import '../match-card.css';
</style>
