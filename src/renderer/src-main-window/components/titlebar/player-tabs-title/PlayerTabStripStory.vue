<template>
  <StoryPanel
    title="Player tabs DnD"
    description="战绩页标题栏组件。数据、关闭、刷新和定位均使用 Story 本地状态。"
  >
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <NSelect
        v-model:value="locateTargetId"
        class="w-64"
        size="small"
        :options="tabOptions"
        placeholder="选择要定位的 tab"
      />
      <NButton size="small" :disabled="!locateTargetId" @click="locateSelectedTab">
        定位并居中
      </NButton>
      <NButton size="small" @click="toggleExpandingTab">切换加载项宽度</NButton>
      <div class="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
        <NSwitch v-model:value="expandDuringDrag" size="small" />
        <span>拖动后自动变宽</span>
      </div>
      <NButton class="ml-auto" size="small" quaternary @click="reset">重置</NButton>
    </div>

    <div class="titlebar-frame">
      <PlayerTabStrip
        ref="playerTabStrip"
        :tabs="tabs"
        :active-tab-id="activeTabId"
        @activate="activeTabId = $event"
        @close="closeTab"
        @refresh="refreshTab"
        @close-others="closeOtherTabs"
        @close-to-right="closeTabsToRight"
        @reorder="handleReorder"
        @drag-start="handleDragStart"
      />
    </div>

    <div
      class="mt-2 flex min-w-0 items-center justify-between gap-3 text-[11px] text-black/45 dark:text-white/45"
    >
      <span class="truncate">{{ lastAction }}</span>
      <span class="shrink-0 [font-variant-numeric:tabular-nums]">
        当前：{{ activeTabId || '无' }} · {{ tabs.length }} 项
      </span>
    </div>
  </StoryPanel>
</template>

<script setup lang="ts">
import StoryPanel from '@renderer-shared/components/stories/StoryPanel.vue'
import { NButton, NSelect, NSwitch } from 'naive-ui'
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef } from 'vue'

import PlayerTabStrip from './PlayerTabStrip.vue'
import type { PlayerTabStripExpose, PlayerTabStripItem, PlayerTabStripReorderEvent } from './types'

const EXPANDING_TAB_ID = 'loading-expands-into-a-long-name'

const createFixtureTabs = (): PlayerTabStripItem[] => [
  {
    id: 'tab-home-11014142',
    gameName: '据点四号 (新)',
    tagLine: '11014142',
    profileIconId: 29,
    serverLabel: '艾欧尼亚'
  },
  {
    id: 'tab-champion-64',
    gameName: '秋刀鱼只会玩盲僧',
    tagLine: 'CN1',
    championId: 64,
    serverLabel: '艾欧尼亚'
  },
  {
    id: 'tab-profile-4666',
    gameName: 'Seraphine',
    tagLine: 'SGP',
    profileIconId: 4666,
    serverLabel: '峡谷之巅'
  },
  {
    id: EXPANDING_TAB_ID,
    loading: true,
    serverLabel: '艾欧尼亚'
  },
  {
    id: 'tab-champion-145',
    gameName: '虚空之女',
    tagLine: 'KDA',
    championId: 145,
    serverLabel: '艾欧尼亚'
  },
  {
    id: '5f3b9c8e-98a0-4efd-a1dd-unknown-player',
    serverLabel: '北美'
  },
  {
    id: 'tab-champion-202',
    gameName: '戏命师收藏家',
    tagLine: 'FOUR',
    championId: 202,
    serverLabel: '艾欧尼亚'
  },
  {
    id: 'tab-profile-5212',
    gameName: '今天也要好好打排位',
    tagLine: '2026',
    profileIconId: 5212,
    serverLabel: '峡谷之巅'
  },
  {
    id: 'tab-champion-81',
    gameName: '探险家',
    tagLine: 'EZ',
    championId: 81,
    serverLabel: '艾欧尼亚'
  },
  {
    id: 'tab-champion-22',
    gameName: '寒冰射手',
    tagLine: 'ARAM',
    championId: 22,
    serverLabel: '艾欧尼亚'
  },
  {
    id: 'tab-last-51',
    gameName: '皮城女警',
    tagLine: 'LAST',
    championId: 51,
    serverLabel: '艾欧尼亚'
  }
]

const playerTabStrip = useTemplateRef<PlayerTabStripExpose>('playerTabStrip')
const tabs = ref(createFixtureTabs())
const activeTabId = ref<string | null>(tabs.value[0]?.id || null)
const locateTargetId = ref<string | null>(tabs.value[6]?.id || null)
const expandDuringDrag = ref(true)
const lastAction = ref('可拖动任意 tab；滚轮可横向浏览')
let expansionTimer = 0

const tabOptions = computed(() =>
  tabs.value.map((tab, index) => ({
    label: `${index + 1}. ${tab.gameName || (tab.loading ? '加载中' : tab.id)}`,
    value: tab.id
  }))
)

const setExpandingTabState = (expanded: boolean) => {
  const tab = tabs.value.find((item) => item.id === EXPANDING_TAB_ID)

  if (!tab) {
    return
  }

  if (expanded) {
    tab.loading = false
    tab.gameName = '加载完成后突然变得很长的召唤师名称'
    tab.tagLine = '1500'
    tab.profileIconId = 5416
  } else {
    tab.loading = true
    tab.gameName = undefined
    tab.tagLine = undefined
    tab.profileIconId = undefined
  }
}

const toggleExpandingTab = () => {
  const tab = tabs.value.find((item) => item.id === EXPANDING_TAB_ID)
  const shouldExpand = Boolean(tab?.loading)

  setExpandingTabState(shouldExpand)
  lastAction.value = shouldExpand ? '加载项已突然展开' : '加载项已恢复短宽度'
}

const locateSelectedTab = async () => {
  if (!locateTargetId.value) {
    return
  }

  activeTabId.value = locateTargetId.value
  await nextTick()
  const found = await playerTabStrip.value?.scrollToTab(locateTargetId.value, {
    behavior: 'smooth',
    inline: 'center'
  })
  lastAction.value = found ? `已定位到 ${locateTargetId.value}` : '目标 tab 不存在'
}

const closeTab = (id: string) => {
  const index = tabs.value.findIndex((tab) => tab.id === id)

  if (index < 0) {
    return
  }

  tabs.value.splice(index, 1)

  if (activeTabId.value === id) {
    activeTabId.value = tabs.value[Math.min(index, tabs.value.length - 1)]?.id || null
  }

  if (locateTargetId.value === id) {
    locateTargetId.value = activeTabId.value
  }

  lastAction.value = `已关闭 ${id}`
}

const closeOtherTabs = (id: string) => {
  const tab = tabs.value.find((item) => item.id === id)

  if (!tab) {
    return
  }

  tabs.value = [tab]
  activeTabId.value = id
  locateTargetId.value = id
  lastAction.value = `已关闭 ${id} 之外的页面`
}

const closeTabsToRight = (id: string) => {
  const index = tabs.value.findIndex((tab) => tab.id === id)

  if (index < 0) {
    return
  }

  const removedIds = new Set(tabs.value.slice(index + 1).map((tab) => tab.id))
  tabs.value = tabs.value.slice(0, index + 1)

  if (activeTabId.value && removedIds.has(activeTabId.value)) {
    activeTabId.value = id
  }

  if (locateTargetId.value && removedIds.has(locateTargetId.value)) {
    locateTargetId.value = id
  }

  lastAction.value = `已关闭 ${id} 右侧的页面`
}

const refreshTab = (id: string) => {
  lastAction.value = `触发刷新 ${id}`
}

const handleReorder = (event: PlayerTabStripReorderEvent) => {
  const fromIndex = tabs.value.findIndex((tab) => tab.id === event.id)

  if (fromIndex < 0) {
    return
  }

  const nextTabs = [...tabs.value]
  const [tab] = nextTabs.splice(fromIndex, 1)
  nextTabs.splice(Math.min(Math.max(event.toIndex, 0), nextTabs.length), 0, tab)
  tabs.value = nextTabs
  lastAction.value = `已将 ${event.id} 从第 ${event.fromIndex + 1} 位拖到第 ${event.toIndex + 1} 位`
}

const handleDragStart = (id: string) => {
  lastAction.value = `正在拖动 ${id}`

  if (!expandDuringDrag.value || !tabs.value.some((tab) => tab.id === EXPANDING_TAB_ID)) {
    return
  }

  window.clearTimeout(expansionTimer)
  setExpandingTabState(false)
  expansionTimer = window.setTimeout(() => {
    setExpandingTabState(true)
    lastAction.value = `拖动期间 ${EXPANDING_TAB_ID} 已展开`
  }, 350)
}

const reset = () => {
  window.clearTimeout(expansionTimer)
  tabs.value = createFixtureTabs()
  activeTabId.value = tabs.value[0]?.id || null
  locateTargetId.value = tabs.value[6]?.id || null
  lastAction.value = '组件已重置'
}

onBeforeUnmount(() => window.clearTimeout(expansionTimer))
</script>

<style scoped>
.titlebar-frame {
  --la-titlebar-height: 36px;

  width: 100%;
  min-width: 0;
  height: var(--la-titlebar-height);
  overflow: hidden;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background-color: var(--la-background-color-primary);

  [data-theme='dark'] & {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
