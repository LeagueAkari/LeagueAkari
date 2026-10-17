import { useInstance } from '@renderer-shared/shards'
import { ChampionDataRenderer } from '@renderer-shared/shards/champion-data'
import { useChampionDataStore } from '@renderer-shared/shards/champion-data/store'
import type { OpggChampionDataQuery, OpggFlashPosition } from '@shared/types/champion-data/opgg'
import { useMessage } from 'naive-ui'
import { type InjectionKey, computed, inject, provide } from 'vue'

export type OpggContext = ReturnType<typeof createOpggContext>

export const OpggContextKey: InjectionKey<OpggContext> = Symbol('OpggContext')

function createOpggContext(fixedPageId?: () => number) {
  const championData = useInstance(ChampionDataRenderer)
  const store = useChampionDataStore()
  const message = useMessage()
  const snapshot = computed(() => store.opgg.snapshot)
  const pageId = computed(() => (fixedPageId ? fixedPageId() : snapshot.value.activePage))
  const currentTab = computed<'champions' | 'champion'>(() =>
    pageId.value === null ? 'champions' : 'champion'
  )
  const pageState = computed(() =>
    pageId.value === null ? snapshot.value.overviewState : snapshot.value.pages[pageId.value]
  )
  const championId = computed(() => pageState.value?.query.championId ?? null)
  const flashPosition = computed(() => store.settings.opggFlashPosition)
  const mode = computed(() => pageState.value.query.mode)
  const position = computed(() => pageState.value.query.position)
  const region = computed(() => pageState.value.query.region)
  const tier = computed(() => pageState.value.query.tier)
  const version = computed(() => pageState.value.version)
  const versions = computed(() => pageState.value.versions)
  const champions = computed(() => snapshot.value.overview)
  const champion = computed(() =>
    pageId.value === null ? null : (snapshot.value.pages[pageId.value]?.champion ?? null)
  )
  const isLoading = computed(() => pageState.value?.status === 'loading')
  const isDataStale = computed(() => pageState.value?.stale ?? true)
  const error = computed(() => pageState.value?.error ?? null)
  const isApplying = computed(() => store.opgg.isApplying)
  const isDataUnavailable = computed(() => !store.opgg.enabled)
  const openedPages = computed(() => snapshot.value.openedPages)
  const activePage = computed(() => snapshot.value.activePage)

  const run = async <T>(request: () => Promise<T>) => {
    try {
      return await request()
    } catch (error) {
      message.error(String(error))
      return false
    }
  }

  const changeMode = (mode: OpggChampionDataQuery['mode']) =>
    run(() => championData.opgg.update({ mode }, pageId.value))

  const changePosition = (position: OpggChampionDataQuery['position']) =>
    run(() => championData.opgg.update({ position }, pageId.value))

  const changeRegion = (region: OpggChampionDataQuery['region']) =>
    run(() => championData.opgg.update({ region }, pageId.value))

  const changeTier = (tier: OpggChampionDataQuery['tier']) =>
    run(() => championData.opgg.update({ tier }, pageId.value))

  const changeVersion = (version: string) =>
    run(() => championData.opgg.update({ version }, pageId.value))

  const changeChampion = (id: number) => run(() => championData.opgg.open(id, pageId.value))

  const activatePage = (id: number | null) => run(() => championData.opgg.activate(id))

  const closeChampion = (id: number) => run(() => championData.opgg.close(id))

  const reorderChampions = (ids: number[]) => run(() => championData.opgg.reorder(ids))

  const refreshPage = (id: number | null) => run(() => championData.opgg.refresh(id))

  const refresh = () => refreshPage(pageId.value)

  const cancel = () => {
    void championData.opgg.cancel(pageId.value)
  }

  const setTab = (tab: 'champions' | 'champion', nextChampionId?: number) => {
    if (tab === 'champions') {
      void activatePage(null)
      return
    }

    const target = nextChampionId ?? championId.value
    if (target !== null && target !== undefined) {
      void changeChampion(target)
    }
  }

  const setFlashPosition = (value: OpggFlashPosition) =>
    run(() => championData.opgg.setFlashPosition(value))

  return {
    snapshot,
    currentTab,
    setTab,
    flashPosition,
    setFlashPosition,
    championId,
    pageId,
    mode,
    position,
    region,
    tier,
    version,
    versions,
    champions,
    champion,
    pageState,
    isLoading,
    isDataStale,
    error,
    isApplying,
    isDataUnavailable,
    changeMode,
    changePosition,
    changeRegion,
    changeTier,
    changeVersion,
    changeChampion,
    refresh,
    cancel,
    openedPages,
    activePage,
    activatePage,
    closeChampion,
    reorderChampions,
    refreshPage
  }
}

export function provideOpgg() {
  provide(OpggContextKey, createOpggContext())
}

export function provideOpggChampion(id: () => number) {
  provide(OpggContextKey, createOpggContext(id))
}

export function useOpgg() {
  const context = inject(OpggContextKey)
  if (!context) throw new Error('no opgg context found')

  return context
}
