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
    <TabBar
      class="mb-1 pt-0! pb-1!"
      :items="tabItems"
      v-model:active-id="activeTabId"
      v-model:order="tabOrder"
      :aria-label="t('opgg.tabs.label')"
      @contextmenu="handleContextMenu"
    >
      <template #tooltip="{ tab }"><component :is="() => renderTabTooltip(tab)" /></template>
      <template #icon="{ tab }">
        <Podium v-if="tab.id === 'champions'" class="size-3.5" />
        <ChampionIcon
          v-else
          :champion-id="snapshot.pages[Number(tab.id)].query.championId!"
          class="size-3.5! rounded"
        />
      </template>
    </TabBar>
    <div class="flex flex-wrap gap-1">
      <QuerySelect
        :render-label="renderLabel"
        size="small"
        :style="filterStyle('mode')"
        :placeholder="t('opgg.filters.mode')"
        :options="modeOptions"
        :value="mode"
        :consistent-menu-width="false"
        @update:value="changeMode"
      />
      <QuerySelect
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
      <QuerySelect
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
      <QuerySelect
        v-if="mode === 'ranked' || mode === 'flex'"
        size="small"
        :render-label="renderPositionLabel"
        :style="filterStyle('position')"
        :placeholder="t('opgg.filters.position')"
        :options="positionOptions"
        :value="position"
        :consistent-menu-width="false"
        @update:value="changePosition"
      />
      <QuerySelect
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
  </div>
</template>

<script setup lang="tsx">
import QuerySelect from '@champion-data-window/components/query-filter/QuerySelect.vue'
import QuerySummary, {
  type QuerySummaryField
} from '@champion-data-window/components/query-filter/QuerySummary.vue'
import FilterLabel from '@champion-data-window/components/query-filter/FilterLabel.vue'
import {
  useModeOptions,
  usePositionOptions,
  useRegionOptions,
  useTierOptions
} from '@champion-data-window/opgg/utils/options'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { TabBar, type TabBarItems, type TabBarTab } from '@renderer-shared/components/tab-bar'
import Podium from '@vicons/ionicons5/es/PodiumOutline'
import Refresh from '@vicons/ionicons5/es/Refresh'
import Close from '@vicons/ionicons5/es/Close'
import CloseOthers from '@vicons/ionicons5/es/CloseCircleOutline'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useTranslation } from 'i18next-vue'
import { NDropdown, NIcon, type SelectRenderLabel } from 'naive-ui'
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
  openedPages,
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

const { modeOptions } = useModeOptions()
const { regionOptions } = useRegionOptions()
const { tierOptions } = useTierOptions()
const { positionOptions } = usePositionOptions()

const activeTabId = computed({
  get: () => (activePage.value === null ? 'champions' : String(activePage.value)),
  set: (id: string) => {
    contextMenu.show = false
    void activatePage(id === 'champions' ? null : Number(id))
  }
})

const tabOrder = computed({
  get: () => ['champions', ...openedPages.value.map(String)],
  set: (ids: string[]) => {
    void reorderChampions(ids.filter((id) => id !== 'champions').map(Number))
  }
})

const tabItems = computed<TabBarItems>(() => ({
  champions: {
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
  ...Object.fromEntries(
    Object.entries(snapshot.value.pages).map(([id, page]) => [
      id,
      {
        name: resources.champions.name(page.query.championId!),
        actions: [
          {
            id: 'refresh',
            icon: markRaw(Refresh),
            label: t('opgg.filters.refresh'),
            loading: page.status === 'loading',
            onClick: () => {
              void refreshPage(Number(id))
            }
          },
          {
            id: 'close',
            kind: 'close' as const,
            icon: markRaw(Close),
            label: t('opgg.tabs.close'),
            onClick: () => {
              void closeChampion(Number(id))
            }
          }
        ]
      }
    ])
  )
}))

const renderTabTooltip = (tab: TabBarTab) => {
  const page = snapshot.value.pages[Number(tab.id)]
  if (!page) return tab.name

  const query = page.query
  const fields: QuerySummaryField[] = [
    { label: t('opgg.filters.mode'), value: t(`opgg.filters.modes.${query.mode}`) }
  ]
  if (query.mode !== 'aram_mayhem') {
    const regionOption = regionOptions.value.find((o) => o.value === query.region)
    const tierOption = tierOptions.value.find((o) => o.value === query.tier)
    fields.push({
      label: t('opgg.filters.region'),
      value: String(regionOption?.label ?? query.region),
      icon: 'region',
      flag: regionOption?.flag as string
    })
    if (query.mode !== 'arena') {
      fields.push({
        label: t('opgg.filters.rankTier'),
        value: String(tierOption?.label ?? query.tier),
        icon: 'tier',
        rank: tierOption?.rank as string
      })
    }

    if (page.version) {
      fields.push({ label: t('opgg.filters.version'), value: page.version })
    }
  }

  if (query.mode === 'ranked' || query.mode === 'flex') {
    fields.push({
      label: t('opgg.filters.position'),
      value: t(`opgg.filters.positions.${query.position}`),
      position: query.position
    })
  }

  return <QuerySummary title={tab.name} championId={query.championId} fields={fields} />
}

const contextMenu = reactive({ show: false, x: 0, y: 0, id: '' })
const contextTab = computed(() => {
  const tab = tabItems.value[contextMenu.id]
  return tab ? { ...tab, id: contextMenu.id } : undefined
})

const canCloseTab = (tab: TabBarItems[string]) => {
  return tab.fixedPosition === undefined && tab.closable !== false
}

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
    disabled: !tabOrder.value.some(
      (id) => id !== contextMenu.id && canCloseTab(tabItems.value[id])
    ),
    icon: () => (
      <NIcon>
        <CloseOthers />
      </NIcon>
    )
  }
])

const handleContextMenu = (event: MouseEvent, tab: TabBarTab) => {
  event.preventDefault()
  contextMenu.id = tab.id
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY - contextMenuOffsetY
  contextMenu.show = true
}

const handleContextMenuClickOutside = (event: MouseEvent) => {
  if (
    event.button === 2 &&
    event.target instanceof Element &&
    event.target.closest('[data-tab-id]')
  ) {
    return
  }

  contextMenu.show = false
}

const handleContextMenuSelect = async (key: string | number) => {
  const selected = contextTab.value
  contextMenu.show = false
  if (!selected) {
    return
  }

  const targets =
    key === 'close' ? [selected.id] : tabOrder.value.filter((id) => id !== selected.id)
  for (const id of targets) {
    if (canCloseTab(tabItems.value[id])) {
      await closeChampion(Number(id))
    }
  }
}

watch(contextTab, (tab) => {
  if (!tab) {
    contextMenu.show = false
  }
})

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

const filterStyle = (key: 'mode' | 'region' | 'tier' | 'position' | 'version') => {
  const widths =
    resources.runtime.locale === 'en'
      ? { mode: 148, region: 124, tier: 136, position: 106, version: 74 }
      : {
          mode: mode.value === 'ranked' || mode.value === 'flex' ? 98 : 124,
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
