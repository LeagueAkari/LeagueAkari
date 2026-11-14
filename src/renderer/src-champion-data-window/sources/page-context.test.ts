import 'reflect-metadata'

import type { AkariManager } from '@shared/akari-shard'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { type OpggPageContext, provideOpggPage, useOpggPage } from '../opgg/context'
import { type Qq101PageContext, provideQq101Page, useQq101Page } from '../qq101/context'
import { useChampionDataStore } from '../shards/champion-data/store'

vi.mock('@renderer-shared/i18n', () => ({ i18next: { t: (key: string) => key } }))

vi.mock('i18next-vue', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

vi.mock('naive-ui', () => ({
  useMessage: () => ({ success: vi.fn(), warning: vi.fn(), error: vi.fn() })
}))

afterEach(() => setActivePinia(undefined))

it('keeps each page data and actions bound to its ID when the active tab changes', async () => {
  const pinia = createPinia()
  setActivePinia(pinia)

  const store = useChampionDataStore()
  const overview = store.opgg.snapshot.overviewState

  store.opgg.snapshot = {
    ...store.opgg.snapshot,
    activePage: 1,
    openedPages: [1, 2],
    pages: {
      1: { ...overview, query: { ...overview.query, championId: 1 }, champion: null },
      2: { ...overview, query: { ...overview.query, championId: 64 }, champion: null }
    }
  }

  store.qq101.pages.activeId = 'first'
  store.qq101.pages.items = [
    {
      id: 'first',
      kind: 'champion',
      championId: 1,
      query: { mode: 'ranked', patch: '16.22', tier: 255, position: 'MIDDLE' },
      view: null,
      modeChange: { status: 'idle' }
    },
    {
      id: 'second',
      kind: 'champion',
      championId: 64,
      query: { mode: 'ranked', patch: '16.21', tier: 3, position: 'JUNGLE' },
      view: null,
      modeChange: { status: 'idle' }
    },
    {
      id: 'pairs',
      kind: 'pairs',
      query: { championId: null, firstRole: 'all', secondRole: 'all' },
      state: { status: 'idle' }
    }
  ]

  const controller = {
    opgg: { open: vi.fn(), apply: vi.fn() },
    qq101: {
      selectChampion: vi.fn(),
      applyRunes: vi.fn(),
      pages: { updateHero: vi.fn(), retry: vi.fn(), updatePairs: vi.fn() }
    }
  }
  const opggContexts: Record<number, OpggPageContext> = {}
  const qq101Contexts: Record<string, Qq101PageContext> = {}

  const OpggContent = defineComponent({
    setup() {
      const context = useOpggPage()
      opggContexts[context.pageId.value] = context

      return () => h('span', String(context.championId.value))
    }
  })

  const OpggPage = defineComponent({
    props: { id: { type: Number, required: true } },

    setup(props) {
      provideOpggPage(() => props.id)

      return () => h(OpggContent)
    }
  })

  const Qq101Content = defineComponent({
    setup() {
      const context = useQq101Page()
      qq101Contexts[context.pageId.value] = context

      return () => h('span', context.pageState.value.id)
    }
  })

  const Qq101Page = defineComponent({
    props: { id: { type: String, required: true } },

    setup(props) {
      provideQq101Page(() => props.id)

      return () => h(Qq101Content)
    }
  })

  const app = createSSRApp({
    render: () =>
      h('div', [
        h(OpggPage, { id: 1 }),
        h(OpggPage, { id: 2 }),
        h(Qq101Page, { id: 'first' }),
        h(Qq101Page, { id: 'second' }),
        h(Qq101Page, { id: 'pairs' })
      ])
  })

  app.use(pinia)
  app.config.globalProperties.$akariManager = {
    getInstance: () => controller
  } as unknown as AkariManager
  await renderToString(app)

  store.opgg.snapshot = { ...store.opgg.snapshot, activePage: 2 }
  store.qq101.pages.activeId = 'second'

  expect(opggContexts[1].championId.value).toBe(1)
  expect(opggContexts[2].championId.value).toBe(64)
  expect(qq101Contexts.first.pageState.value).toMatchObject({ championId: 1 })
  expect(qq101Contexts.second.pageState.value).toMatchObject({ championId: 64 })

  await opggContexts[1].openChampion(22)
  await opggContexts[1].apply('runes', 'rune-choice')
  await qq101Contexts.first.openChampion(22)
  await qq101Contexts.first.changePreferences({ tier: 2 })
  await qq101Contexts.first.retry('runes')
  await qq101Contexts.first.applyRunes(0)
  await qq101Contexts.pairs.changePairsQuery({
    championId: 22,
    firstRole: 'mage',
    secondRole: 'all'
  })

  expect(controller.opgg.open).toHaveBeenCalledWith(22, 1)
  expect(controller.opgg.apply).toHaveBeenCalledWith({
    pageId: 1,
    kind: 'runes',
    recommendationId: 'rune-choice'
  })
  expect(controller.qq101.selectChampion).toHaveBeenCalledWith(22, undefined, 'first')
  expect(controller.qq101.pages.updateHero).toHaveBeenCalledWith('first', {
    mode: 'ranked',
    patch: '16.22',
    tier: 2,
    position: 'MIDDLE'
  })
  expect(controller.qq101.pages.retry).toHaveBeenCalledWith('first', 'runes')
  expect(controller.qq101.applyRunes).toHaveBeenCalledWith('first', 0)
  expect(controller.qq101.pages.updatePairs).toHaveBeenCalledWith('pairs', {
    championId: 22,
    firstRole: 'mage',
    secondRole: 'all'
  })

  store.applying.runes = true

  expect(opggContexts[1].applying.value.runes).toBe(true)
  expect(qq101Contexts.first.applying.value).toBe(true)
  expect(qq101Contexts.second.applying.value).toBe(true)
})
