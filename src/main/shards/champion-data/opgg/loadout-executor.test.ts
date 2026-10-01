import type { OpggRankedChampionDetailsResponse } from '@shared/types/opgg'
import { runInAction } from 'mobx'
import { describe, expect, it, vi } from 'vitest'

import type { OpggChampionDataMainContext } from '../context'
import { ChampionDataSettings, OpggChampionDataState } from '../state'
import { projectDetails } from './data-adapter'
import { OpggLoadoutExecutor } from './loadout-executor'

vi.mock('@main/i18n', () => ({
  i18next: { t: (key: string, values: unknown) => key + ':' + JSON.stringify(values) }
}))

function setup() {
  const state = new OpggChampionDataState()
  const raw = {
    data: {
      summary: { id: 1, average_stats: null, positions: [], roles: [] },
      runes: [
        {
          id: 3,
          primary_page_id: 8000,
          secondary_page_id: 8100,
          primary_rune_ids: [8005, 9111],
          secondary_rune_ids: [8126],
          stat_mod_ids: [5008],
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
  runInAction(() => {
    state.enabled = true
    state.snapshot = {
      ...state.snapshot,

      status: 'ready',
      version: '16.18',
      query: { ...state.snapshot.query, championId: 1 }
    }
    state.snapshot.champion = projectDetails({ mode: 'ranked', response: raw }, 'top', {
      aramBalance: [],
      augmentRarity: () => null
    })
    state.snapshot.activePage = 1
    state.snapshot.openedChampions = [1]
    state.snapshot.pages = {
      1: {
        champion: state.snapshot.champion,
        status: 'ready',
        error: null,
        revision: 1,
        stale: false
      }
    }
  })
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
    settings: new ChampionDataSettings(),
    logger: { warn: vi.fn() },
    leagueClient: {
      state: { isConnected: true },
      api: { perks, champSelect: championSelect, chat: { chatSend } },
      writeItemSetsToDisk,
      data: {
        gameData: {
          championName: (id: number) => `Champion ${id}`,
          summonerSpells: { 4: { name: 'Flash' }, 14: { name: 'Ignite' } }
        },
        chat: { conversations: { championSelect: { id: 'selection-chat' } } }
      }
    }
  } as unknown as OpggChampionDataMainContext
  const executor = new OpggLoadoutExecutor(context)
  return { executor, state, perks, championSelect, chatSend, writeItemSetsToDisk, context }
}

const pageIdentity = { championId: 1, generation: 0, revision: 1 }

describe('OP.GG recommendation application', () => {
  it.each([{ championId: 2 }, { generation: 10 }, { revision: 10 }])(
    'rejects stale or closed-page identities: %j',
    async (identity) => {
      const { executor, perks } = setup()
      await expect(
        executor.apply({ ...pageIdentity, ...identity, recommendationId: 'runes:0', kind: 'runes' })
      ).rejects.toThrow('not ready')
      expect(perks.getPerkInventory).not.toHaveBeenCalled()
    }
  )

  it('rejects data marked stale even if the request identity matches', async () => {
    const { executor, state } = setup()
    runInAction(() => {
      state.snapshot.pages[1].stale = true
    })
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
        selectedPerkIds: [8005, 9111, 8126, 5008],
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
  ] as const)(
    'uses the main-process Flash setting: %s',
    async (flashPosition, spell1Id, spell2Id) => {
      const { executor, championSelect, context } = setup()

      runInAction(() => {
        context.settings.opggFlashPosition = flashPosition
      })

      await executor.apply({ ...pageIdentity, recommendationId: 'spells:0', kind: 'spells' })
      expect(championSelect.setSummonerSpells).toHaveBeenCalledWith({ spell1Id, spell2Id })
    }
  )

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
    runInAction(() => {
      state.snapshot = {
        ...state.snapshot,

        query: { ...state.snapshot.query, championId: 2 }
      }
    })
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
