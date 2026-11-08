<template>
  <div class="px-2 pt-1">
    <TabBar
      class="pt-0! pb-1!"
      :items="tabItems"
      v-model:active-id="activeId"
      v-model:order="order"
      :aria-label="t('qq101.tabs.label')"
      @contextmenu="contextMenu"
    >
      <template #prefix="{ tab }">
        <span
          v-if="managed(pageById(tab.id))"
          role="img"
          :aria-label="t('opgg.automation.currentGame')"
          class="size-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400"
        />
      </template>
      <template #tooltip="{ tab }">
        <QuerySummary
          v-if="pageById(tab.id)"
          :title="tab.name"
          :champion-id="championId(tab.id)"
          :fields="queryFields(pageById(tab.id)!)"
        />
        <span v-else>{{ tab.name }}</span>
      </template>
      <template #icon="{ tab }">
        <ChampionIcon
          v-if="championId(tab.id) !== null"
          :champion-id="championId(tab.id)!"
          class="size-3.5! rounded"
        />
        <Podium v-else class="size-3.5" />
      </template>
    </TabBar>
    <NDropdown
      trigger="manual"
      placement="bottom-start"
      size="small"
      :show="menu.show"
      :x="menu.x"
      :y="menu.y"
      :options="menuOptions"
      @clickoutside="menu.show = false"
      @select="selectMenu"
    />
  </div>
</template>
<script setup lang="ts">
import { useCurrentGameTabMenu } from '@champion-data-window/components/current-game/use-current-game-tab-menu'
import QuerySummary, {
  type QuerySummaryField
} from '@champion-data-window/components/query-filter/QuerySummary.vue'
import { tierIcons } from './filters/tiers'
import { TabBar, type TabBarItems, type TabBarTab } from '@renderer-shared/components/tab-bar'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import type { Qq101Page } from '@champion-data-window/shards/champion-data/qq101/types'
import Close from '@vicons/ionicons5/es/Close'
import Refresh from '@vicons/ionicons5/es/Refresh'
import Podium from '@vicons/ionicons5/es/PodiumOutline'
import { useTranslation } from 'i18next-vue'
import { NDropdown } from 'naive-ui'
import { computed, markRaw, reactive } from 'vue'

const { pages, loading } = defineProps<{
  pages: Qq101Page[]
  loading: boolean
}>()

const activeId = defineModel<string>('activeId', { required: true })
const order = defineModel<string[]>('order', { required: true })

const emit = defineEmits<{
  close: [id: string]
  refresh: [id: string]
}>()

const resources = useAkariResourceProvider()
const { t } = useTranslation()

const championId = (id: string) => {
  const p = pages.find((p) => p.id === id)
  return p?.kind === 'champion' ? p.championId : null
}

const pageById = (id: string) => pages.find((p) => p.id === id)

const managed = (p: Qq101Page | undefined) => p?.kind === 'champion' && Boolean(p.currentGame)

const name = (page: Qq101Page) => {
  if (page.kind === 'pairs') {
    return t('qq101.boards.synergies')
  }

  return page.championId
    ? resources.champions.name(page.championId)
    : t('opgg.automation.currentGame')
}

const queryFields = (page: Qq101Page): QuerySummaryField[] => {
  if (page.kind === 'champion' && page.currentGame?.unavailableReason) {
    return []
  }

  if (page.kind === 'pairs') {
    return [
      {
        label: t('qq101.details.champion'),
        value: page.query.championId
          ? resources.champions.name(page.query.championId)
          : t('qq101.all')
      },
      {
        label: t('qq101.pairFirstRole'),
        value: t(
          page.query.firstRole === 'all' ? 'qq101.all' : `qq101.roles.${page.query.firstRole}`
        )
      },
      {
        label: t('qq101.pairSecondRole'),
        value: t(
          page.query.secondRole === 'all' ? 'qq101.all' : `qq101.roles.${page.query.secondRole}`
        )
      }
    ]
  }

  const fields: QuerySummaryField[] = [
    { label: t('qq101.mode'), value: t(`qq101.modes.${page.query.mode}`) }
  ]

  if (page.query.mode === 'ranked') {
    const position = page.view?.mode === 'ranked' ? page.view.position : page.query.position

    fields.push(
      { label: t('qq101.patch'), value: page.query.patch },
      {
        label: t('qq101.tier'),
        value: t(`qq101.tiers.${page.query.tier}`),
        icon: 'tier',
        rank: tierIcons[page.query.tier]
      },
      {
        label: t('qq101.position'),
        value: t(
          `qq101.positions.${position === null ? 'all' : position === 'SUPPORT' ? 'utility' : position.toLowerCase()}`
        ),
        position: position ?? 'ALL'
      }
    )
  }

  return fields
}

const isLoading = (page: Qq101Page) => {
  if (page.kind === 'pairs') {
    return page.state.status === 'loading'
  }

  if (page.currentGame?.unavailableReason || page.modeChange.status === 'error') {
    return false
  }

  if (!page.view) {
    return true
  }

  return page.view.mode === 'ranked'
    ? Object.values(page.view.sections).some((section) => section.status === 'loading')
    : page.view.recommendations.status === 'loading'
}

const refreshAction = (id: string, loading: boolean) => ({
  id: 'refresh',
  icon: markRaw(Refresh),
  label: t('qq101.retry'),
  loading,
  onClick: () => emit('refresh', id)
})

const tabItems = computed<TabBarItems>(() => ({
  rankings: {
    name: t('qq101.title'),
    fixedPosition: 0,
    closable: false,
    actions: [refreshAction('rankings', loading)]
  },
  ...Object.fromEntries(
    pages.map((p) => [
      p.id,
      {
        name: name(p),
        fixedPosition: managed(p) ? 1 : undefined,
        closable: !managed(p),
        actions: [
          refreshAction(p.id, isLoading(p)),
          ...(managed(p)
            ? []
            : [
                {
                  id: 'close',
                  kind: 'close' as const,
                  icon: markRaw(Close),
                  label: t('qq101.tabs.close'),
                  onClick: () => emit('close', p.id)
                }
              ])
        ]
      }
    ])
  )
}))

const menu = reactive({ show: false, x: 0, y: 0, id: '' })
const currentGameMenu = useCurrentGameTabMenu('qq101', () => managed(pageById(menu.id)))

const menuOptions = computed(() => [
  ...currentGameMenu.options.value,
  {
    key: 'close',
    label: t('qq101.tabs.close'),
    disabled: menu.id === 'rankings' || managed(pageById(menu.id))
  },
  {
    key: 'others',
    label: t('qq101.tabs.closeOthers'),
    disabled: !pages.some((p) => p.id !== menu.id && !managed(p))
  }
])

const contextMenu = (event: MouseEvent, tab: TabBarTab) => {
  event.preventDefault()

  const offset =
    Number.parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--la-titlebar-height') || '0'
    ) || 0

  Object.assign(menu, { show: true, x: event.clientX, y: event.clientY - offset, id: tab.id })
}

const selectMenu = (key: string) => {
  menu.show = false

  if (key === 'retry-apply') {
    currentGameMenu.retryApplication()
  } else if (key === 'close') {
    if (!managed(pageById(menu.id))) {
      emit('close', menu.id)
    }
  } else if (key === 'others') {
    pages.filter((p) => p.id !== menu.id && !managed(p)).forEach((p) => emit('close', p.id))
  }
}
</script>
