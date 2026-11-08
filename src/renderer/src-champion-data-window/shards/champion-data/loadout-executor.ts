import type { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { SUMMONER_SPELL_FLASH_ID } from '@shared/constants/summoner-spells'
import type { ChampionRunesConfig, SummonerSpellsConfig } from '@shared/shards/auto-champ-config'

import type { ChampionDataCommands } from './source-contract'
import { runeSchema, toSummonerSpellsConfig } from './source-contract'
import { type LoadoutKind, useChampionDataStore } from './store'

export interface RuneWriteProgress {
  page?: { id: number; created: boolean }
  written?: boolean
}

/** One writer per window. Pinia only exposes whether each kind of write is active. */
export class LoadoutExecutor implements ChampionDataCommands {
  private readonly _writes = new Map<
    LoadoutKind,
    { controller: AbortController; finished: Promise<void> }
  >()

  constructor(private readonly _client: Pick<LeagueClientRenderer, 'api'>) {}

  async apply<T>(kind: LoadoutKind, apply: (signal: AbortSignal) => Promise<T>) {
    const { applying } = useChampionDataStore()
    const previous = this._writes.get(kind)

    const controller = new AbortController()
    const finished = Promise.withResolvers<void>()

    this._writes.set(kind, { controller, finished: finished.promise })
    applying[kind] = true

    previous?.controller.abort()

    try {
      // Wait for an already-issued client write before starting its replacement.
      if (previous) {
        await previous.finished
      }

      controller.signal.throwIfAborted()

      const result = await apply(controller.signal)
      controller.signal.throwIfAborted()

      return result
    } finally {
      if (this._writes.get(kind)?.controller === controller) {
        this._writes.delete(kind)
        applying[kind] = false
      }

      finished.resolve()
    }
  }

  dispose() {
    for (const write of this._writes.values()) {
      write.controller.abort()
    }
  }

  async setSummonerSpells(config: SummonerSpellsConfig) {
    if (!toSummonerSpellsConfig([config.spell1Id, config.spell2Id])) {
      throw new Error('Invalid summoner spell pair')
    }

    const store = useChampionDataStore()
    const flashPosition = store.settings.opggFlashPosition

    return this.apply('spells', async (signal) => {
      const api = this._client.api.champSelect
      const selection = (await api.getMySelections({ signal })).data

      const { spell1Id, spell2Id } = config
      const flash = SUMMONER_SPELL_FLASH_ID
      const swap =
        flashPosition !== 'auto' && (spell1Id === flash || spell2Id === flash)
          ? (spell1Id === flash && flashPosition === 'f') ||
            (spell2Id === flash && flashPosition === 'd')
          : spell1Id === selection.spell2Id || spell2Id === selection.spell1Id

      const spells = swap ? { spell1Id: spell2Id, spell2Id: spell1Id } : { spell1Id, spell2Id }

      signal.throwIfAborted()
      await api.setSummonerSpells(spells)

      return spells
    })
  }

  async setRunes(
    config: ChampionRunesConfig,
    name: string,
    progress: RuneWriteProgress = {},
    isCurrent?: () => boolean
  ) {
    const runes = runeSchema.parse(config)
    const { currentGame } = useChampionDataStore()

    if (!isCurrent && currentGame.active) {
      currentGame.manual = true
    }

    return this.apply('runes', async (signal) => {
      const check = () => {
        signal.throwIfAborted()
        if (isCurrent && !isCurrent()) {
          throw new DOMException('Rune selection changed', 'AbortError')
        }
      }

      const { perks } = this._client.api
      check()
      progress.page ??= await this._getWritablePage(name, runes.primaryStyleId, signal, check)

      if (!progress.written) {
        check()
        await perks.putPage({
          id: progress.page.id,
          name,
          isRecommendationOverride: false,
          isTemporary: false,
          ...runes
        })
        progress.written = true
      }

      check()
      await perks.putCurrentPage(progress.page.id)

      return progress.page.created
    })
  }

  private async _getWritablePage(
    name: string,
    primaryStyleId: number,
    signal: AbortSignal,
    check: () => void
  ) {
    const { perks } = this._client.api
    const { data: inventory } = await perks.getPerkInventory({ signal })
    check()

    if (inventory.canAddCustomPage) {
      const { data } = await perks.postPerkPage({
        name,
        isEditable: true,
        primaryStyleId: primaryStyleId.toString()
      })

      return { id: data.id, created: true }
    }

    const { data: pages } = await perks.getPerkPages({ signal })
    if (!pages.length) {
      throw new Error('No rune page is available')
    }

    return { id: pages[0].id, created: false }
  }
}
