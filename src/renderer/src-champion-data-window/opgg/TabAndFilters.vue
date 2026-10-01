<template>
  <div>
    <NDropdown
      placement="bottom-start"
      trigger="manual"
      :show="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :options="contextMenuOptions"
      size="small"
      :theme-overrides="{ fontSizeSmall: '13px', optionHeightSmall: '26px' }"
      @clickoutside="handleContextMenuClickOutside"
      @select="handleContextMenuSelect"
    />
    <div
      class="mb-1 flex flex-wrap gap-1 border-0 border-b border-solid border-black/10 pb-1 dark:border-white/10"
    >
      <NSelect
        :render-label="renderLabel"
        size="small"
        :style="filterStyle('mode')"
        :placeholder="t('opgg.filters.mode')"
        :options="modeOptions"
        :value="mode"
        :consistent-menu-width="false"
        @update:value="changeMode"
      />
      <NSelect
        v-if="mode !== 'aram_mayhem'"
        size="small"
        :render-label="renderRegionLabel"
        :style="filterStyle('region')"
        :placeholder="t('opgg.filters.region')"
        :options="regionOptions"
        :value="region"
        :consistent-menu-width="false"
        @update:value="changeRegion"
      />
      <NSelect
        v-if="mode !== 'aram_mayhem' && mode !== 'arena'"
        size="small"
        :render-label="renderTierLabel"
        :style="filterStyle('tier')"
        :placeholder="t('opgg.filters.rankTier')"
        :options="tierOptions"
        :value="tier"
        :consistent-menu-width="false"
        @update:value="changeTier"
      />
      <NSelect
        v-if="mode === 'ranked'"
        size="small"
        :render-label="renderPositionLabel"
        :style="filterStyle('position')"
        :placeholder="t('opgg.filters.position')"
        :options="positionOptions"
        :value="position"
        :consistent-menu-width="false"
        @update:value="changePosition"
      />
      <NSelect
        :render-label="renderLabel"
        v-if="mode !== 'aram_mayhem'"
        size="small"
        :style="filterStyle('version')"
        :placeholder="t('opgg.filters.version')"
        :value="version"
        :options="versionOptions"
        :consistent-menu-width="false"
        :disabled="versions.length === 0"
        @update:value="changeVersion"
      />
    </div>
    <TabBar
      class="mt-0.5 border-b-0! py-0!"
      :tabs="tabs"
      :active-id="activeTabId"
      :aria-label="t('opgg.tabs.label')"
      @contextmenu="handleContextMenu"
      @update:active-id="activateTab"
      @reorder="reorderTabs"
    >
      <template #icon="{ tab }">
        <Podium v-if="tab.id === 'champions'" class="size-3.5" />
        <ChampionIcon v-else :champion-id="Number(tab.id)" class="size-3.5! rounded" />
      </template>
    </TabBar>
  </div>
</template>

<script setup lang="tsx">
import FilterLabel from '@champion-data-window/components/query-filter/FilterLabel.vue'
import {
  useModeOptions,
  usePositionOptions,
  useRegionOptions,
  useTierOptions
} from '@champion-data-window/opgg/utils/options'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { TabBar, type TabBarTab, type TabBarTabReorder } from '@renderer-shared/components/tab-bar'
import Podium from '@vicons/ionicons5/es/PodiumOutline'
import Refresh from '@vicons/ionicons5/es/Refresh'
import Close from '@vicons/ionicons5/es/Close'
import CloseOthers from '@vicons/ionicons5/es/CloseCircleOutline'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useTranslation } from 'i18next-vue'
import { NDropdown, NIcon, NSelect, type SelectRenderLabel } from 'naive-ui'
import { computed, markRaw, reactive, watch } from 'vue'

import { useOpgg } from './context'

const { t } = useTranslation()
const contextMenuOffsetY =
  Number.parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--la-titlebar-height') || '0'
  ) || 0
const resources = useAkariResourceProvider()
const {
  mode,
  versions,
  version,
  tier,
  position,
  region,
  snapshot,
  activePage,
  openedChampions,
  activatePage,
  closeChampion,
  reorderChampions,
  refreshPage,
  changeMode,
  changePosition,
  changeRegion,
  changeTier,
  changeVersion
} = useOpgg()

const activeTabId = computed(() =>
  activePage.value === null ? 'champions' : String(activePage.value)
)
const tabs = computed<TabBarTab[]>(() => [
  {
    id: 'champions',
    name: t('opgg.filters.champions'),
    fixedPosition: 0,
    closable: false,
    actions: [
      {
        id: 'refresh',
        icon: markRaw(Refresh),
        label: t('opgg.filters.refresh'),
        loading: snapshot.value.overviewState.status === 'loading',
        onClick: () => {
          void refreshPage(null)
        }
      }
    ]
  },
  ...openedChampions.value.map((id) => ({
    id: String(id),
    name: resources.champions.name(id),
    actions: [
      {
        id: 'refresh',
        icon: markRaw(Refresh),
        label: t('opgg.filters.refresh'),
        loading: snapshot.value.pages[id].status === 'loading',
        onClick: () => {
          void refreshPage(id)
        }
      },
      {
        id: 'close',
        kind: 'close' as const,
        icon: markRaw(Close),
        label: t('opgg.tabs.close'),
        onClick: () => {
          void closeChampion(id)
        }
      }
    ]
  }))
])

const contextMenu = reactive({ show: false, x: 0, y: 0, id: '' })
const contextTab = computed(() => tabs.value.find((tab) => tab.id === contextMenu.id))
const contextMenuOptions = computed(() => [
  {
    key: 'close',
    label: t('opgg.tabs.close'),
    disabled: !contextTab.value || !canCloseTab(contextTab.value),
    icon: () => (
      <NIcon>
        <Close />
      </NIcon>
    )
  },
  {
    key: 'close-others',
    label: t('opgg.tabs.closeOthers'),
    disabled: !tabs.value.some((tab) => tab.id !== contextMenu.id && canCloseTab(tab)),
    icon: () => (
      <NIcon>
        <CloseOthers />
      </NIcon>
    )
  }
])

function canCloseTab(tab: TabBarTab) {
  return tab.fixedPosition === undefined && tab.closable !== false
}

function handleContextMenu(event: MouseEvent, tab: TabBarTab) {
  event.preventDefault()
  contextMenu.id = tab.id
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY - contextMenuOffsetY
  contextMenu.show = true
}

function handleContextMenuClickOutside(event: MouseEvent) {
  if (
    event.button === 2 &&
    event.target instanceof Element &&
    event.target.closest('[data-tab-id]')
  ) {
    return
  }

  contextMenu.show = false
}

async function handleContextMenuSelect(key: string | number) {
  const selected = contextTab.value
  contextMenu.show = false
  if (!selected) {
    return
  }

  const targets = key === 'close' ? [selected] : tabs.value.filter((tab) => tab.id !== selected.id)
  for (const tab of targets) {
    if (canCloseTab(tab)) {
      await closeChampion(Number(tab.id))
    }
  }
}

watch(contextTab, (tab) => {
  if (!tab) {
    contextMenu.show = false
  }
})

function activateTab(id: string) {
  contextMenu.show = false
  void activatePage(id === 'champions' ? null : Number(id))
}

function reorderTabs({ fromIndex, toIndex }: TabBarTabReorder) {
  const ids = [...openedChampions.value]
  const [id] = ids.splice(fromIndex - 1, 1)
  ids.splice(toIndex - 1, 0, id)
  void reorderChampions(ids)
}

const { modeOptions } = useModeOptions()
const { regionOptions } = useRegionOptions()
const { tierOptions } = useTierOptions()
const { positionOptions } = usePositionOptions()
const versionOptions = computed(() => versions.value.map((value) => ({ label: value, value })))
const renderLabel: SelectRenderLabel = (option) => (
  <FilterLabel label={String(option.label ?? '')} />
)
const renderRegionLabel: SelectRenderLabel = (option) => (
  <FilterLabel label={String(option.label ?? '')} icon="region" flag={option.flag as string} />
)
const renderTierLabel: SelectRenderLabel = (option) => (
  <FilterLabel label={String(option.label ?? '')} icon="tier" rank={option.rank as string} />
)
const renderPositionLabel: SelectRenderLabel = (option) => (
  <FilterLabel label={String(option.label ?? '')} position={String(option.value)} />
)

function filterStyle(key: 'mode' | 'region' | 'tier' | 'position' | 'version') {
  const widths =
    resources.runtime.locale === 'en'
      ? { mode: 148, region: 124, tier: 136, position: 106, version: 74 }
      : {
          mode: mode.value === 'ranked' ? 72 : 124,
          region: 112,
          tier: 106,
          position: 82,
          version: 74
        }
  return {
    width: '0',
    minWidth: widths[key] + 'px',
    flex: key === 'version' ? '0 0 auto' : '1 0 auto'
  }
}
</script>
