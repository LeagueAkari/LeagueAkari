import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import type { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SavedSettingWatcher } from '@renderer-shared/shards/setting-utils/saved-setting-watcher'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRenderer, nextTick, ref } from 'vue'

import type { MatchHistoryInitParams } from '@main-window/shards/player-tabs/context'
import { syncPlayerTabsSettings } from '@main-window/shards/player-tabs/settings-sync'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { createEmptyState } from '../widgets/match-history-filters/filter-state'
import { type MatchHistoryContext, provideMatchHistory } from './match-history'

const mocks = vi.hoisted(() => ({
  useInstance: vi.fn(),
  getSgpMatchHistory: vi.fn(),
  getLcuMatchHistory: vi.fn(),
  notificationError: vi.fn()
}))

vi.mock('@renderer-shared/shards', () => ({ useInstance: mocks.useInstance }))
vi.mock('@renderer-shared/shards/league-client', () => ({
  LeagueClientRenderer: class {}
}))
vi.mock('@renderer-shared/shards/sgp', () => ({ SgpRenderer: class {} }))
vi.mock('@renderer-shared/shards/logger', () => ({ LoggerRenderer: class {} }))
vi.mock('i18next-vue', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('naive-ui', () => ({
  useNotification: () => ({ error: mocks.notificationError }),
  useMessage: () => ({ error: vi.fn(), success: vi.fn() })
}))

// Mount the data provider without a DOM; the API boundary is the observable result.
const renderer = createRenderer<object, object>({
  patchProp: () => {},
  insert: () => {},
  remove: () => {},
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  setText: () => {},
  setElementText: () => {},
  parentNode: () => null,
  nextSibling: () => null
})

const cleanups: (() => void)[] = []

function mountMatchHistory(
  options: {
    ready?: boolean
    source?: 'lcu' | 'sgp'
    initParams?: MatchHistoryInitParams
  } = {}
) {
  const status = ref({ canUse: true, isReady: options.ready ?? true })
  let context!: MatchHistoryContext
  const app = renderer.createApp({
    setup() {
      context = provideMatchHistory(
        {
          puuid: 'player-1',
          preferredSource: options.source ?? 'sgp',
          sgpServerId: 'HN10',
          isCrossRegion: false,
          sgpApiStatus: status,
          filterState: createEmptyState(),
          syncCollectFilterState: vi.fn()
        },
        {
          pendingInitParams: ref({}),
          consumeMatchHistoryInitParams: () => options.initParams ?? null,
          onMatchHistoryInitParamsUpdate: () => {}
        }
      )
      return () => null
    }
  })
  app.mount({})
  cleanups.push(() => app.unmount())
  return { context, status }
}

async function waitForLoad(context: MatchHistoryContext) {
  await vi.waitFor(() => {
    expect(context.page.value).not.toBeNull()
    expect(context.isLoading.value).toBe(false)
  })
}

describe('remembered match history mode', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.getSgpMatchHistory.mockResolvedValue({ data: { games: [] } })
    mocks.getLcuMatchHistory.mockResolvedValue({ data: { games: { games: [] } } })
    const instances = new Map<unknown, unknown>([
      [
        SgpRenderer,
        {
          api: {
            matchHistoryQuery: { getMatchHistorySummaryByPlayerPuuid: mocks.getSgpMatchHistory }
          }
        }
      ],
      [
        LeagueClientRenderer,
        {
          api: {
            matchHistory: { getMatchHistory: mocks.getLcuMatchHistory },
            replays: { getConfiguration: async () => ({ data: { isReplaysEnabled: false } }) }
          },
          onLcuEventVue: () => {}
        }
      ],
      [LoggerRenderer, { info: vi.fn(), warn: vi.fn(), error: vi.fn() }]
    ])
    mocks.useInstance.mockImplementation((shard) => instances.get(shard))
  })

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup()
    expect(mocks.notificationError).not.toHaveBeenCalled()
  })

  it('loads the saved mode after recreating the renderer store', async () => {
    const saved = new Map<string, unknown>()
    let watcher: SavedSettingWatcher
    const settings = {
      get: async (namespace: string, key: string, fallback: unknown) =>
        saved.get(`${namespace}/${key}`) ?? fallback,
      set: async (namespace: string, key: string, value: unknown) => {
        saved.set(`${namespace}/${key}`, value)
      },
      savedPropVue: (...args: Parameters<SavedSettingWatcher['savedPropVue']>) =>
        watcher.savedPropVue(...args)
    } as unknown as SettingUtilsRenderer
    watcher = new SavedSettingWatcher(settings)
    cleanups.push(() => watcher.dispose())
    await syncPlayerTabsSettings(settings)
    usePlayerTabsStore().frontendSettings.defaultMatchHistoryTag = 'q_420'
    await nextTick()
    watcher.dispose()

    setActivePinia(createPinia())
    await syncPlayerTabsSettings(settings)
    const { context } = mountMatchHistory()
    await waitForLoad(context)

    expect(mocks.getSgpMatchHistory).toHaveBeenCalledWith('player-1', {
      tag: 'q_420',
      startIndex: 0,
      count: 20,
      __sgpServerId: 'HN10'
    })
    expect(context.page.value?.queryParams.tag).toBe('q_420')
  })

  it('keeps all modes unfiltered for a new installation', async () => {
    const { context } = mountMatchHistory()
    await waitForLoad(context)

    expect(mocks.getSgpMatchHistory.mock.calls[0][1].tag).toBeUndefined()
  })

  it('keeps each page mode through pagination, explicit clearing, and new tabs', async () => {
    const store = usePlayerTabsStore()
    store.frontendSettings.defaultMatchHistoryTag = 'q_420'
    const { context } = mountMatchHistory()
    await waitForLoad(context)

    // Another tab changes the shared preference; this tab retains its own mode.
    store.frontendSettings.defaultMatchHistoryTag = 'q_450'
    await context.loadMatchHistory({ startIndex: 20 })
    expect(mocks.getSgpMatchHistory.mock.lastCall?.[1]).toMatchObject({
      tag: 'q_420',
      startIndex: 20
    })

    const nextTab = mountMatchHistory()
    await waitForLoad(nextTab.context)
    expect(nextTab.context.page.value?.queryParams.tag).toBe('q_450')

    store.frontendSettings.defaultMatchHistoryTag = '<akari:all>'
    await context.loadMatchHistory({ tag: undefined, startIndex: 0 })
    await context.loadMatchHistory({ startIndex: 20 })
    expect(mocks.getSgpMatchHistory.mock.lastCall?.[1].tag).toBeUndefined()
    const allModesTab = mountMatchHistory()
    await waitForLoad(allModesTab.context)
    expect(allModesTab.context.page.value?.queryParams.tag).toBeUndefined()
  })

  it('restores the mode when SGP tokens become ready', async () => {
    usePlayerTabsStore().frontendSettings.defaultMatchHistoryTag = 'q_420'
    const { context, status } = mountMatchHistory({ ready: false })
    expect(mocks.getSgpMatchHistory).not.toHaveBeenCalled()

    status.value.isReady = true
    await waitForLoad(context)
    expect(context.page.value?.queryParams.tag).toBe('q_420')
  })

  it('does not apply an SGP mode to LCU history', async () => {
    usePlayerTabsStore().frontendSettings.defaultMatchHistoryTag = 'q_420'
    const { context } = mountMatchHistory({ source: 'lcu' })
    await waitForLoad(context)

    expect(mocks.getSgpMatchHistory).not.toHaveBeenCalled()
    expect(mocks.getLcuMatchHistory).toHaveBeenCalledWith('player-1', 0, 19)
    expect(context.page.value?.queryParams.tag).toBeUndefined()
  })

  it('keeps explicit champion collection independent of the saved mode', async () => {
    usePlayerTabsStore().frontendSettings.defaultMatchHistoryTag = 'q_420'
    const { context } = mountMatchHistory({ initParams: { collectByChampionId: 103 } })
    await waitForLoad(context)

    expect(context.page.value?.isLoadedByCollectMode).toBe(true)
    expect(mocks.getSgpMatchHistory.mock.calls[0][1].tag).toBeUndefined()
  })
})
