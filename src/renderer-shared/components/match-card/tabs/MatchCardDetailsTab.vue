<template>
  <NScrollbar x-scrollable class="max-h-142 rounded b-solid dark:b-white/5 b-black/5 b-1 b-b-0">
    <table class="[border-collapse:separate] [border-spacing:0] w-full">
      <thead>
        <tr>
          <!-- divider -->
          <th
            class="sticky left-0 top-0 z-10 b-b b-b-solid dark:b-b-white/5 b-b-black/5 transition-colors dark:bg-[#1a1a1a] bg-[#e5e5e5] text-left p-2 w-38 max-w-38"
          >
            <NInput size="small" placeholder="筛选" v-model:value="filterText" clearable />
          </th>

          <!-- players from 1 to 10 -->
          <th
            v-for="p of rawStats"
            :key="p.identity.puuid"
            class="sticky top-0 z-1 b-b b-b-solid dark:b-b-white/5 b-b-black/5 transition-colors dark:bg-[#1a1a1a] bg-[#e5e5e5] text-center p-2"
          >
            <div
              class="flex items-center justify-center"
              :title="`${p.identity.gameName} #${p.identity.tagLine}`"
            >
              <ChampionIcon :champion-id="p.championId" class="size-6" round />
            </div>
          </th>
        </tr>
      </thead>

      <tbody v-if="filterText.trim() && groups.length === 0">
        <tr>
          <td
            :colspan="rawStats.length + 1"
            class="h-16 text-center p-2 b-b b-b-solid dark:b-b-white/5 b-b-black/5 text-xs dark:text-white/60 text-black/60"
          >
            无筛选结果
          </td>
        </tr>
      </tbody>

      <tbody v-else v-for="(group, index) of groups" :key="group.group">
        <tr v-if="index > 0">
          <td
            :colspan="rawStats.length + 1"
            class="text-center h-4 b-b b-b-solid dark:b-b-white/5 b-b-black/5 text-xs dark:text-white/60 text-black/60"
          ></td>
        </tr>

        <tr v-for="row of group.rows" :key="row.key">
          <td
            :title="STAT_KEY_TRANSLATIONS[row.key] || row.key"
            class="sticky left-0 transition-colors dark:bg-[#1a1a1a] bg-[#e5e5e5] text-center p-2 font-bold b-b b-b-solid dark:b-b-white/5 b-b-black/5 text-xs truncate w-38 max-w-38"
          >
            {{ STAT_KEY_TRANSLATIONS[row.key] || row.key }}
          </td>

          <!-- players from 1 to 10 -->
          <td
            v-for="cell of row.cells"
            class="text-center p-2 b-b b-b-solid dark:b-b-white/5 b-b-black/5 text-xs max-w-24 truncate"
          >
            <component :is="renderFn(() => row.render(cell as never))" />
          </td>
        </tr>
      </tbody>
    </table>
  </NScrollbar>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { refDebounced } from '@vueuse/core'
import { NInput, NScrollbar } from 'naive-ui'
import { type VNodeChild, computed, createTextVNode, shallowRef } from 'vue'

import {
  MAPPED_RENDER_GROUP_OPTIONS,
  RENDER_GROUPS,
  RenderGroupOptions,
  STAT_KEY_TRANSLATIONS,
  useRawDetails,
  useValueRenderer
} from '../utils/details-table'

const rawStats = useRawDetails()
const valueRenderer = useValueRenderer()

const filterText = shallowRef('')
const filterTextDebounced = refDebounced(filterText, 250)

const renderFn = (node: string | (() => VNodeChild)) => {
  if (typeof node === 'string') {
    return createTextVNode(node)
  }

  return { render: node }
}

const groups = computed(() => {
  if (rawStats.value.length === 0) {
    return []
  }

  const sortedByTeam = rawStats.value.toSorted((a, b) => {
    return a.identity.teamIdentifier.localeCompare(b.identity.teamIdentifier)
  })

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

            const name = STAT_KEY_TRANSLATIONS[item.key] || item.key

            if (
              filterTextDebounced.value.trim() &&
              !item.key.includes(filterTextDebounced.value) &&
              !name.toLowerCase().includes(filterTextDebounced.value.toLowerCase())
            ) {
              return null
            }

            const render = item.render || valueRenderer.text

            const rowCells = sortedByTeam.map((p: Record<string, any>) => p[item.key])

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
