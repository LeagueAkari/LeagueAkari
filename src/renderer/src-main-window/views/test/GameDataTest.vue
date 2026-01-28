<template>
  <div class="box-border flex h-full flex-col gap-4 p-4">
    <div class="flex shrink-0 items-center gap-4">
      <NSelect
        v-model:value="selectedCategory"
        :options="categoryOptions"
        style="width: 200px"
        size="small"
      />
      <NInput
        v-model:value="searchText"
        placeholder="搜索 ID 或名称..."
        clearable
        size="small"
        style="width: 240px"
      />
      <span class="text-sm text-black/60 dark:text-white/60">
        共 {{ filteredData.length }} 项
      </span>
      <span v-if="!lcs.isConnected" class="text-sm text-yellow-600 dark:text-yellow-400">
        (未连接客户端)
      </span>
    </div>

    <NScrollbar class="min-h-0 flex-1">
      <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2">
        <div
          v-for="item in filteredData"
          :key="item.id"
          class="flex items-center gap-3 rounded border border-black/10 p-2 dark:border-white/10"
        >
          <!-- 根据类型使用不同的 Display 组件 -->
          <ItemDisplay
            v-if="selectedCategory === 'items'"
            :item-id="item.id"
            :size="40"
            class="shrink-0"
          />
          <ChampionIcon
            v-else-if="selectedCategory === 'champions'"
            :champion-id="item.id"
            class="size-10 shrink-0 rounded"
          />
          <PerkDisplay
            v-else-if="selectedCategory === 'perks'"
            :perk-id="item.id"
            :size="40"
            class="shrink-0"
          />
          <PerkstyleDisplay
            v-else-if="selectedCategory === 'perkstyles'"
            :perkstyle-id="item.id"
            :size="40"
            class="shrink-0"
          />
          <AugmentDisplay
            v-else-if="selectedCategory === 'augments'"
            :augment-id="item.id"
            :size="40"
            class="shrink-0"
          />
          <SummonerSpellDisplay
            v-else-if="selectedCategory === 'summonerSpells'"
            :spell-id="item.id"
            :size="40"
            class="shrink-0"
          />
          <div
            v-else
            class="flex size-10 shrink-0 items-center justify-center rounded bg-black/10 text-xs dark:bg-white/10"
          >
            —
          </div>

          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-bold">{{ item.name }}</div>
            <div class="text-xs text-black/50 dark:text-white/50">ID: {{ item.id }}</div>
            <div v-if="item.extra" class="truncate text-xs text-black/40 dark:text-white/40">
              {{ item.extra }}
            </div>
          </div>

          <NButton
            v-if="getIconPath(item.id)"
            size="tiny"
            secondary
            class="shrink-0"
            @click="handleDownloadIcon(getIconPath(item.id)!)"
          >
            <template #icon>
              <NIcon><DownloadIcon /></NIcon>
            </template>
          </NButton>
        </div>
      </div>

      <div
        v-if="filteredData.length === 0"
        class="flex h-40 items-center justify-center text-black/40 dark:text-white/40"
      >
        暂无数据
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { Download as DownloadIcon } from '@vicons/carbon'
import { NButton, NIcon, NInput, NScrollbar, NSelect } from 'naive-ui'
import { computed, ref } from 'vue'

const lcs = useLeagueClientStore()
const wm = useInstance(WindowManagerRenderer)

const selectedCategory = ref<string>('items')
const searchText = ref('')

const categoryOptions = [
  { label: 'Items', value: 'items' },
  { label: 'Champions', value: 'champions' },
  { label: 'Perks', value: 'perks' },
  { label: 'Perkstyles', value: 'perkstyles' },
  { label: 'Augments', value: 'augments' },
  { label: 'Summoner Spells', value: 'summonerSpells' },
  { label: 'Queues', value: 'queues' },
  { label: 'Maps', value: 'maps' }
]

interface DisplayItem {
  id: number
  name: string
  extra?: string
}

const rawData = computed<DisplayItem[]>(() => {
  const gd = lcs.gameData

  switch (selectedCategory.value) {
    case 'items':
      return Object.values(gd.items).map((item) => ({
        id: item.id,
        name: item.name,
        extra: `${item.priceTotal}G`
      }))

    case 'champions':
      return Object.values(gd.champions).map((champ) => ({
        id: champ.id,
        name: champ.name,
        extra: champ.roles.join(', ')
      }))

    case 'perks':
      return Object.values(gd.perks).map((perk) => ({
        id: perk.id,
        name: perk.name
      }))

    case 'perkstyles':
      return Object.values(gd.perkstyles.styles).map((style) => ({
        id: style.id,
        name: style.name
      }))

    case 'augments':
      return Object.values(gd.augments).map((aug) => ({
        id: aug.id,
        name: aug.nameTRA,
        extra: aug.rarity
      }))

    case 'summonerSpells':
      return Object.values(gd.summonerSpells).map((spell) => ({
        id: spell.id,
        name: spell.name,
        extra: `CD: ${spell.cooldown}s`
      }))

    case 'queues':
      return Object.values(gd.queues).map((queue) => ({
        id: queue.id,
        name: queue.name,
        extra: queue.shortName
      }))

    case 'maps':
      return Object.values(gd.maps).map((map) => ({
        id: map.id,
        name: map.name,
        extra: map.mapStringId
      }))

    default:
      return []
  }
})

const filteredData = computed(() => {
  if (!searchText.value) {
    return rawData.value
  }

  const search = searchText.value.toLowerCase()
  return rawData.value.filter(
    (item) =>
      item.id.toString().includes(search) ||
      item.name.toLowerCase().includes(search) ||
      item.extra?.toLowerCase().includes(search)
  )
})

const getIconPath = (id: number): string | null => {
  const gd = lcs.gameData

  switch (selectedCategory.value) {
    case 'items':
      return gd.items[id]?.iconPath || null
    case 'perks':
      return gd.perks[id]?.iconPath || null
    case 'perkstyles':
      return gd.perkstyles.styles[id]?.iconPath || null
    case 'augments':
      return gd.augments[id]?.augmentSmallIconPath || null
    case 'summonerSpells':
      return gd.summonerSpells[id]?.iconPath || null
    default:
      return null
  }
}

const handleDownloadIcon = (iconPath: string) => {
  const url = new URL(iconPath, 'akari://league-client').href
  wm.mainWindow.downloadUrl(url)
}
</script>
