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
      <template #prefix="{ tab }">
        <span
          v-if="snapshot.pages[Number(tab.id)]?.currentGame"
          role="img"
          :aria-label="t('opgg.automation.currentGame')"
          class="size-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400"
        />
      </template>
      <template #tooltip="{ tab }">
        <component :is="() => renderTabTooltip(tab)" />
      </template>
      <template #icon="{ tab }">
        <Podium v-if="tab.id === 'champions'" class="size-3.5" />
        <ChampionIcon
          v-else
          :champion-id="snapshot.pages[Number(tab.id)].query.championId!"
          class="size-3.5! rounded"
        />
      </template>
    </TabBar>
    <OpggQueryFilters />
  </div>
</template>

<script setup lang="tsx">
import { useCurrentGameTabMenu } from '@champion-data-window/components/current-game/use-current-game-tab-menu'
import OpggQueryFilters from './filters/OpggQueryFilters.vue'
import QuerySummary, {
  type QuerySummaryField
} from '@champion-data-window/components/query-filter/QuerySummary.vue'
import { useTierOptions, useRegionOptions } from './utils/options'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { TabBar, type TabBarItems, type TabBarTab } from '@renderer-shared/components/tab-bar'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import Podium from '@vicons/ionicons5/es/PodiumOutline'
import Refresh from '@vicons/ionicons5/es/Refresh'
import Close from '@vicons/ionicons5/es/Close'
import CloseOthers from '@vicons/ionicons5/es/CloseCircleOutline'
import { useTranslation } from 'i18next-vue'
import { NDropdown, NIcon } from 'naive-ui'
import { computed, markRaw, reactive, watch } from 'vue'

import { useOpgg } from './context'

const { t } = useTranslation()
const resources = useAkariResourceProvider()

const contextMenuOffsetY =
  Number.parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--la-titlebar-height') || '0'
  ) || 0

const {
  snapshot,
  activePage,
  openedPages,
  activatePage,
  closeChampion,
  reorderChampions,
  refreshPage
} = useOpgg()

const { regionOptions } = useRegionOptions()
const { tierOptions } = useTierOptions()

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
        name: page.query.championId
          ? resources.champions.name(page.query.championId)
          : t('opgg.automation.currentGame'),
        fixedPosition: page.currentGame ? 1 : undefined,
        closable: !page.currentGame,
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
          ...(page.currentGame
            ? []
            : [
                {
                  id: 'close',
                  kind: 'close' as const,
                  icon: markRaw(Close),
                  label: t('opgg.tabs.close'),
                  onClick: () => {
                    void closeChampion(Number(id))
                  }
                }
              ])
        ]
      }
    ])
  )
}))

const renderTabTooltip = (tab: TabBarTab) => {
  const page = snapshot.value.pages[Number(tab.id)]
  if (!page || page.currentGame?.unavailableReason) {
    return tab.name
  }

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
const currentGameMenu = useCurrentGameTabMenu('opgg', () =>
  Boolean(snapshot.value.pages[Number(contextMenu.id)]?.currentGame)
)

const contextTab = computed(() => {
  const tab = tabItems.value[contextMenu.id]
  return tab ? { ...tab, id: contextMenu.id } : undefined
})

const canCloseTab = (tab: TabBarItems[string]) => {
  return tab.fixedPosition === undefined && tab.closable !== false
}

const contextMenuOptions = computed(() => [
  ...currentGameMenu.options.value,
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

  if (key === 'retry-apply') {
    currentGameMenu.retryApplication()
    return
  }

  if (key !== 'close' && key !== 'close-others') {
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
</script>
