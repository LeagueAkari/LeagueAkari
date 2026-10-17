import { parseOpggRankedDetails } from '@shared/data-adapter/opgg'
import { projectDetails } from '@shared/data-adapter/opgg/projection'
import type { OpggRankedChampionDetailsResponse } from '@shared/types/opgg'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'

import { useChampionDataStore } from '../store'
import type { OpggRendererContext } from './context'
import { OpggLoadoutExecutor } from './loadout-executor'

vi.mock('@renderer-shared/i18n', () => ({
  i18next: { t: (key: string, values: unknown) => key + ':' + JSON.stringify(values) }
}))

function setup() {
  setActivePinia(createPinia())
  const state = useChampionDataStore().opgg
  const raw = {
    data: {
      summary: { id: 1, average_stats: null, positions: [], roles: [] },
      runes: [
        {
          id: 3,
          primary_page_id: 8000,
          secondary_page_id: 8100,
          primary_rune_ids: [8005, 9111, 9104, 8014],
          secondary_rune_ids: [8126, 8138],
          stat_mod_ids: [5008, 5008, 5001],
          play: 100,
          win: 60,
          pick_rate: 0.8
        }
      ],
      summoner_spells: [{ ids: [14, 4], play: 100, win: 60, pick_rate: 0.9 }],
      starter_items: [{ ids: [3042], play: 100, win: 60, pick_rate: 0.8 }],
      core_items: [{ ids: [3040, 3121], play: 100, win: 60, pick_rate: 0.5 }],
      last_items: [],
      boots: [],
      prism_items: [],
      counters: [],
      skill_masteries: []
    },
    meta: { version: '16.18', cached_at: '' }
  } as unknown as OpggRankedChampionDetailsResponse
  state.enabled = true
  state.snapshot = {
    ...state.snapshot,

    status: 'ready',
    version: '16.18',
    query: { ...state.snapshot.query, championId: 1 }
  }
  state.snapshot.champion = projectDetails(
    { mode: 'ranked', response: parseOpggRankedDetails(raw).data },
    'top',
    {
      aramBalance: [],
      augmentRarity: () => null
    }
  )
  state.snapshot.activePage = 1
  state.snapshot.openedPages = [1]
  state.snapshot.pages = {
    1: {
      query: state.snapshot.query,
      version: state.snapshot.version,
      versions: [],
      champion: state.snapshot.champion,
      status: 'ready',
      error: null,
      revision: 1,
      stale: false
    }
  }
  const perks = {
    getPerkInventory: vi.fn(async () => ({ data: { canAddCustomPage: true } })),
    postPerkPage: vi.fn(async () => ({ data: { id: 88 } })),
    getPerkPages: vi.fn(async () => ({ data: [{ id: 99 }] })),
    putPage: vi.fn(async (_page: unknown) => undefined),
    putCurrentPage: vi.fn(async () => undefined)
  }
  const championSelect = {
    getMySelections: vi.fn(async () => ({ data: { spell1Id: 4, spell2Id: 14 } })),
    setSummonerSpells: vi.fn(async () => undefined)
  }
  const chatSend = vi.fn(async () => undefined)
  const writeItemSetsToDisk = vi.fn(async () => undefined)
  const context = {
    state,
    settings: useChampionDataStore().settings,
    logger: { warn: vi.fn() },
    client: {
      api: { perks, champSelect: championSelect, chat: { chatSend } },
      writeItemSetsToDisk
    },
    leagueClient: {
      isConnected: true,
      gameData: {
        championName: (id: number) => `Champion ${id}`,
        summonerSpells: { 4: { name: 'Flash' }, 14: { name: 'Ignite' } }
      },
      chat: { conversations: { championSelect: { id: 'selection-chat' } } }
    }
  } as unknown as OpggRendererContext
  const executor = new OpggLoadoutExecutor(context)

  return { executor, state, perks, championSelect, chatSend, writeItemSetsToDisk, context }
}

const pageIdentity = { pageId: 1 }

describe('OP.GG recommendation application', () => {
  it('rejects disconnected clients and invalid rune pages before any client write', async () => {
    const { executor, context, state, perks } = setup()
    Object.assign(context.leagueClient, { isConnected: false })
    await expect(
      executor.apply({ pageId: 1, kind: 'runes', recommendationId: 'runes:0' })
    ).rejects.toThrow('disconnected')
    Object.assign(context.leagueClient, { isConnected: true })
    const details = state.snapshot.pages[1].champion!
    if (details.kind !== 'ranked') throw new Error('Expected ranked fixture')

    details.runes[0].primaryRuneIds = [0]
    await expect(
      executor.apply({ pageId: 1, kind: 'runes', recommendationId: 'runes:0' })
    ).rejects.toThrow()
    expect(perks.getPerkInventory).not.toHaveBeenCalled()
    expect(state.isApplying).toBe(false)
  })
  it.each([{ pageId: 999 }])('rejects stale or closed-page identities: %j', async (identity) => {
    const { executor, perks } = setup()
    await expect(
      executor.apply({ ...pageIdentity, ...identity, recommendationId: 'runes:0', kind: 'runes' })
    ).rejects.toThrow('not ready')
    expect(perks.getPerkInventory).not.toHaveBeenCalled()
  })

  it('rejects data marked stale even if the request identity matches', async () => {
    const { executor, state } = setup()
    state.snapshot.pages[1].stale = true
    await expect(
      executor.apply({ ...pageIdentity, recommendationId: 'runes:0', kind: 'runes' })
    ).rejects.toThrow('not ready')
  })
  it.each([true, false])('creates or replaces a rune page (can add: %s)', async (canAdd) => {
    const { executor, perks, chatSend } = setup()
    perks.getPerkInventory.mockResolvedValueOnce({ data: { canAddCustomPage: canAdd } })
    await executor.apply({ ...pageIdentity, recommendationId: 'runes:0', kind: 'runes' })
    expect(perks.putPage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: canAdd ? 88 : 99,
        primaryStyleId: 8000,
        subStyleId: 8100,
        selectedPerkIds: [8005, 9111, 9104, 8014, 8126, 8138, 5008, 5008, 5001],
        isTemporary: false
      })
    )
    expect(perks.putCurrentPage).toHaveBeenCalledWith(canAdd ? 88 : 99)
    expect(chatSend).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['auto', 4, 14],
    ['d', 4, 14],
    ['f', 14, 4]
  ] as const)('uses the persisted Flash setting: %s', async (flashPosition, spell1Id, spell2Id) => {
    const { executor, championSelect, context } = setup()

    context.settings.opggFlashPosition = flashPosition

    await executor.apply({ ...pageIdentity, recommendationId: 'spells:0', kind: 'spells' })
    expect(championSelect.setSummonerSpells).toHaveBeenCalledWith({ spell1Id, spell2Id })
  })

  it('restores recipe IDs and writes the selected version into the existing item-set UID', async () => {
    const { executor, writeItemSetsToDisk } = setup()
    await executor.apply({ ...pageIdentity, recommendationId: 'items', kind: 'items' })
    expect(writeItemSetsToDisk).toHaveBeenCalledWith([
      expect.objectContaining({
        uid: 'akari1-1-ranked-global-all-top-16.18',
        blocks: [
          expect.objectContaining({ items: [{ id: '3004', count: 1 }] }),
          expect.objectContaining({
            items: [
              { id: '3003', count: 1 },
              { id: '3119', count: 1 }
            ]
          })
        ]
      })
    ])
  })

  it('rejects missing recommendations before issuing a write', async () => {
    const { executor, perks, championSelect, writeItemSetsToDisk } = setup()
    await expect(
      executor.apply({ ...pageIdentity, recommendationId: 'missing', kind: 'spells' })
    ).rejects.toThrow('does not exist')
    expect(perks.getPerkInventory).not.toHaveBeenCalled()
    expect(championSelect.setSummonerSpells).not.toHaveBeenCalled()
    expect(writeItemSetsToDisk).not.toHaveBeenCalled()
  })

  it('applies the selected page when the same hero has multiple query pages', async () => {
    const { executor, state, perks } = setup()
    const original = state.snapshot.pages[1]
    state.snapshot.pages = {
      ...state.snapshot.pages,
      2: { ...original, revision: 2, query: { ...original.query, position: 'mid' } }
    }
    state.snapshot.openedPages = [1, 2]
    state.snapshot.activePage = 1
    await executor.apply({
      ...pageIdentity,
      pageId: 2,
      recommendationId: 'runes:0',
      kind: 'runes'
    })
    expect(perks.putPage).toHaveBeenCalledOnce()
    expect(state.snapshot.activePage).toBe(1)
  })

  it('binds the accepted snapshot and rejects duplicate applications while browsing changes', async () => {
    const { executor, perks, state } = setup()
    let resolve!: (value: { data: { canAddCustomPage: boolean } }) => void
    const inventory = new Promise<{ data: { canAddCustomPage: boolean } }>((done) => {
      resolve = done
    })
    perks.getPerkInventory.mockReturnValueOnce(inventory)
    const first = executor.apply({ ...pageIdentity, recommendationId: 'runes:0', kind: 'runes' })
    await expect(
      executor.apply({ ...pageIdentity, recommendationId: 'runes:0', kind: 'runes' })
    ).rejects.toThrow('being applied')
    state.snapshot = {
      ...state.snapshot,

      query: { ...state.snapshot.query, championId: 2 }
    }
    state.snapshot.pages = {}
    resolve({ data: { canAddCustomPage: true } })
    await first
    expect(perks.putPage.mock.calls[0][0]).toMatchObject({
      name: expect.stringContaining('Champion 1')
    })
    expect(state.isApplying).toBe(false)
  })

  it('reports write failures and keeps chat failures nonfatal', async () => {
    const { executor, perks, state, chatSend } = setup()
    perks.putPage.mockRejectedValueOnce(new Error('write failed'))
    await expect(
      executor.apply({ ...pageIdentity, recommendationId: 'runes:0', kind: 'runes' })
    ).rejects.toThrow('write failed')
    expect(state.isApplying).toBe(false)
    expect(chatSend).not.toHaveBeenCalled()
    chatSend.mockRejectedValueOnce(new Error('chat unavailable'))
    await expect(
      executor.apply({ ...pageIdentity, recommendationId: 'runes:0', kind: 'runes' })
    ).resolves.toBeUndefined()
  })
})
