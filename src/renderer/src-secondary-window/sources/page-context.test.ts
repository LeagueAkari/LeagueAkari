import 'reflect-metadata'

import { createPinia, setActivePinia } from 'pinia'
import { afterEach, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { type OpggPageContext, provideOpggPage, useOpggPage } from '../opgg/context'
import { createOpggSourceState } from '../opgg/source-context'
import { type Qq101PageContext, provideQq101Page, useQq101Page } from '../qq101/context'
import { createQq101SourceState } from '../qq101/source-context'
import { useChampionDataStore } from '../shards/champion-data/store'

const { windowContext } = vi.hoisted(() => ({ windowContext: vi.fn() }))

vi.mock('@secondary-window/context', () => ({ useChampionData: windowContext }))

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
  const opgg = createOpggSourceState()
  const qq101 = createQq101SourceState()
  const overview = opgg.snapshot.overviewState

  opgg.snapshot = {
    ...opgg.snapshot,
    activePage: 1,
    openedPages: [1, 2],
    pages: {
      1: { ...overview, query: { ...overview.query, championId: 1 }, champion: null },
      2: { ...overview, query: { ...overview.query, championId: 64 }, champion: null }
    }
  }

  qq101.pages.activeId = 'first'
  qq101.pages.items = [
    {
      id: 'first',
      championId: 1,
      query: { mode: 'ranked', patch: '16.22', tier: 255, position: 'MIDDLE' },
      view: null,
      modeChange: { status: 'idle' }
    },
    {
      id: 'second',
      championId: 64,
      query: { mode: 'ranked', patch: '16.21', tier: 3, position: 'JUNGLE' },
      view: null,
      modeChange: { status: 'idle' }
    }
  ]

  const controller = {
    opgg: { open: vi.fn(), apply: vi.fn() },
    qq101: {
      selectChampion: vi.fn(),
      applyRunes: vi.fn(),
      pages: { updateHero: vi.fn(), retry: vi.fn() }
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
        h(Qq101Page, { id: 'second' })
      ])
  })

  app.use(pinia)
  windowContext.mockReturnValue({
    opgg: { state: opgg, controller: controller.opgg },
    qq101: { state: qq101, controller: controller.qq101 }
  })
  await renderToString(app)

  opgg.snapshot = { ...opgg.snapshot, activePage: 2 }
  qq101.pages.activeId = 'second'

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
  store.applying.runes = true

  expect(opggContexts[1].applying.value.runes).toBe(true)
  expect(qq101Contexts.first.applying.value).toBe(true)
  expect(qq101Contexts.second.applying.value).toBe(true)
})
