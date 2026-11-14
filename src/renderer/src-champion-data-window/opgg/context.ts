import { ChampionDataRenderer } from '@champion-data-window/shards/champion-data'
import type { OpggApplySelection } from '@champion-data-window/shards/champion-data/opgg/context'
import { useChampionDataStore } from '@champion-data-window/shards/champion-data/store'
import { useInstance } from '@renderer-shared/shards'
import { useMessage } from 'naive-ui'
import { type InjectionKey, computed, inject, provide } from 'vue'

export type OpggPageContext = ReturnType<typeof provideOpggPage>

const OpggPageContextKey: InjectionKey<OpggPageContext> = Symbol('OpggPageContext')

export function provideOpggPage(id: () => number) {
  const controller = useInstance(ChampionDataRenderer).opgg
  const store = useChampionDataStore()
  const message = useMessage()

  const pageId = computed(id)
  const pageState = computed(() => store.opgg.snapshot.pages[pageId.value])

  const championId = computed(() => pageState.value.query.championId)
  const champion = computed(() => pageState.value.champion)
  const mode = computed(() => pageState.value.query.mode)
  const position = computed(() => pageState.value.query.position)

  const isLoading = computed(() => pageState.value.status === 'loading')
  const isDataStale = computed(() => pageState.value.stale)
  const error = computed(() => pageState.value.error)
  const applying = computed(() => store.applying)

  const openChampion = async (championId: number) => {
    try {
      return await controller.open(championId, pageId.value)
    } catch (error) {
      message.error(String(error))
      return false
    }
  }

  const apply = (kind: OpggApplySelection['kind'], recommendationId: string) =>
    controller.apply({ pageId: pageId.value, kind, recommendationId })

  const context = {
    pageId,
    pageState,

    championId,
    champion,
    mode,
    position,

    isLoading,
    isDataStale,
    error,
    applying,

    openChampion,
    apply
  }

  provide(OpggPageContextKey, context)

  return context
}

export function useOpggPage() {
  return inject(OpggPageContextKey)!
}
