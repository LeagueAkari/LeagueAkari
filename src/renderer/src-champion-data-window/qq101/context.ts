import { ChampionDataRenderer } from '@champion-data-window/shards/champion-data'
import type {
  Qq101DetailSectionKey,
  Qq101Page
} from '@champion-data-window/shards/champion-data/qq101/types'
import { useChampionDataStore } from '@champion-data-window/shards/champion-data/store'
import { useInstance } from '@renderer-shared/shards'
import type { Qq101PairQuery } from '@shared/http-api-axios-helper/qq101'
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { isAbortError } from '@shared/utils/queue-keeper'
import { useTranslation } from 'i18next-vue'
import { useMessage } from 'naive-ui'
import { type InjectionKey, computed, inject, provide } from 'vue'

export type Qq101PageContext = ReturnType<typeof provideQq101Page>

const Qq101PageContextKey: InjectionKey<Qq101PageContext> = Symbol('Qq101PageContext')

export function provideQq101Page(id: () => string) {
  const controller = useInstance(ChampionDataRenderer).qq101
  const store = useChampionDataStore()
  const { t } = useTranslation()
  const message = useMessage()

  const pageId = computed(id)
  const pageState = computed(() =>
    store.qq101.pages.items.find((page) => page.id === pageId.value)!
  )

  const patches = computed(() => store.qq101.patches)
  const championIds = computed(() => [
    ...new Set(store.qq101.overview?.data.champions.map((champion) => champion.championId) ?? [])
  ])
  const applying = computed(() => store.applying.runes)

  const openChampion = (championId: number) =>
    controller.selectChampion(championId, undefined, pageId.value)

  const changeMode = (mode: 'ranked' | 'aram_mayhem') =>
    controller.pages.changeHeroMode(pageId.value, mode)

  const changePreferences = async (update: Partial<Qq101ChampionDataPreferences>) => {
    const page = pageState.value as Extract<Qq101Page, { kind: 'champion' }>

    if (page.query.mode === 'ranked') {
      return controller.pages.updateHero(pageId.value, {
        ...page.query,
        patch: update.patch ?? page.query.patch,
        tier: update.tier ?? page.query.tier
      })
    }
  }

  const changePosition = async (position: string) => {
    const page = pageState.value as Extract<Qq101Page, { kind: 'champion' }>

    if (page.query.mode === 'ranked') {
      return controller.pages.updateHero(pageId.value, { ...page.query, position })
    }
  }

  const retry = (section: Qq101DetailSectionKey) => controller.pages.retry(pageId.value, section)

  const changePairsQuery = (query: Qq101PairQuery) =>
    controller.pages.updatePairs(pageId.value, query)

  const applyRunes = async (index: number) => {
    if (applying.value) {
      return
    }

    try {
      await controller.applyRunes(pageId.value, index)

      message.success(t('opgg.automation.status.applied'))
    } catch (error) {
      if (isAbortError(error)) {
        return
      }

      message.warning(t('opgg.view.setRunesFailedMessage', { reason: String(error) }))
    }
  }

  const context = {
    pageId,
    pageState,

    patches,
    championIds,
    applying,

    openChampion,
    changeMode,
    changePreferences,
    changePosition,
    retry,
    changePairsQuery,
    applyRunes
  }

  provide(Qq101PageContextKey, context)

  return context
}

export function useQq101Page() {
  return inject(Qq101PageContextKey)!
}
