import { i18next } from '@main/i18n'
import { SUMMONER_SPELL_FLASH_ID } from '@shared/constants/summoner-spells'
import type {
  OpggApplyRecommendation,
  OpggChampionDataDetails,
  OpggChampionDataSnapshot,
  OpggFlashPosition
} from '@shared/types/champion-data/opgg'
import { runInAction } from 'mobx'

import type { OpggChampionDataMainContext } from '../context'
import { restoreRecipe } from './recipe-restore'

export class OpggLoadoutExecutor {
  constructor(private readonly _context: OpggChampionDataMainContext) {}

  async apply(request: OpggApplyRecommendation) {
    const { state, leagueClient, settings } = this._context
    const current = state.snapshot
    const page = current.pages[request.championId]

    if (
      !state.enabled ||
      !page ||
      page.status !== 'ready' ||
      page.stale ||
      !page.champion ||
      current.generation !== request.generation ||
      page.revision !== request.revision
    ) {
      throw new Error('OP.GG champion data is not ready')
    }
    const snapshot = {
      ...current,
      query: { ...current.query, championId: request.championId },
      champion: page.champion
    }

    if (!leagueClient.state.isConnected) {
      throw new Error('League Client is disconnected')
    }

    if (state.isApplying) {
      throw new Error('Another recommendation is being applied')
    }

    const details = snapshot.champion

    runInAction(() => {
      state.isApplying = true
    })

    try {
      if (request.kind === 'runes') {
        const runes = details.runes.find(
          (item) => item.recommendationId === request.recommendationId
        )

        if (!runes) {
          throw new Error('Rune recommendation does not exist')
        }

        await this._applyRunes(snapshot, runes)
      } else if (request.kind === 'spells') {
        const spells = details.summonerSpells.find(
          (item) => item.recommendationId === request.recommendationId
        )

        if (!spells) {
          throw new Error('Summoner spell recommendation does not exist')
        }

        await this._applySpells(spells.ids, settings.opggFlashPosition)
      } else {
        if (!details.itemSet || request.recommendationId !== details.itemSet.recommendationId) {
          throw new Error('Item set recommendation does not exist')
        }

        await this._applyItems(snapshot, details)
      }
    } finally {
      runInAction(() => {
        state.isApplying = false
      })
    }
  }

  private _t(key: string, values: Record<string, unknown> = {}) {
    return i18next.t(`opgg.${key}`, { ns: 'opgg', ...values })
  }

  private _name(snapshot: OpggChampionDataSnapshot, includeMode = false) {
    const query = snapshot.query
    let name = `[${i18next.t('appName', { ns: 'common' })}] ${this._context.leagueClient.data.gameData.championName(query.championId!)}`

    if (includeMode) {
      name += ` - ${this._t(`filters.modes.${query.mode}`)}`
    }

    if (query.mode === 'ranked') {
      name += ` - ${this._t(`filters.positions.${query.position}`)}`
    }

    return name
  }

  private async _applyRunes(
    snapshot: OpggChampionDataSnapshot,
    runes: OpggChampionDataDetails['runes'][number]
  ) {
    const { api } = this._context.leagueClient
    const name = this._name(snapshot)
    const inventory = (await api.perks.getPerkInventory()).data
    let pageId: number

    if (inventory.canAddCustomPage) {
      const { data } = await api.perks.postPerkPage({
        name,
        isEditable: true,
        primaryStyleId: runes.primary_page_id.toString()
      })

      pageId = data.id
    } else {
      const pages = (await api.perks.getPerkPages()).data

      if (!pages.length) {
        throw new Error('No rune page is available')
      }

      pageId = pages[0].id
    }

    await api.perks.putPage({
      id: pageId,
      name,
      isRecommendationOverride: false,
      isTemporary: false,
      primaryStyleId: runes.primary_page_id,
      subStyleId: runes.secondary_page_id,
      selectedPerkIds: [
        ...runes.primary_rune_ids,
        ...runes.secondary_rune_ids,
        ...runes.stat_mod_ids
      ]
    })
    await api.perks.putCurrentPage(pageId)
    await this._sendChat(
      this._t('view.runesSet', {
        name,
        action: this._t(inventory.canAddCustomPage ? 'view.create' : 'view.replace')
      })
    )
  }

  private async _applySpells(ids: [number, number], flashPosition: OpggFlashPosition) {
    const { leagueClient } = this._context
    const selection = (await leagueClient.api.champSelect.getMySelections()).data
    let [spell1Id, spell2Id] = ids

    if (flashPosition !== 'auto' && ids.includes(SUMMONER_SPELL_FLASH_ID)) {
      if (
        (spell1Id === SUMMONER_SPELL_FLASH_ID && flashPosition === 'f') ||
        (spell2Id === SUMMONER_SPELL_FLASH_ID && flashPosition === 'd')
      ) {
        ;[spell1Id, spell2Id] = [spell2Id, spell1Id]
      }
    } else if (spell1Id === selection.spell2Id || spell2Id === selection.spell1Id) {
      ;[spell1Id, spell2Id] = [spell2Id, spell1Id]
    }

    await leagueClient.api.champSelect.setSummonerSpells({ spell1Id, spell2Id })
    const spells = leagueClient.data.gameData.summonerSpells

    await this._sendChat(
      this._t('view.spellsSet', {
        spell1: spells[spell1Id]?.name ?? spell1Id,
        spell2: spells[spell2Id]?.name ?? spell2Id
      })
    )
  }

  private async _applyItems(snapshot: OpggChampionDataSnapshot, details: OpggChampionDataDetails) {
    const { query, version } = snapshot
    const keys = {
      starter: 'starterItem',
      boots: 'bootsDesc',
      prism: 'prismItemsDesc',
      core: 'coreItem',
      last: 'itemsDesc'
    }

    await this._context.leagueClient.writeItemSetsToDisk([
      {
        uid: `akari1-${query.championId}-${query.mode}-${query.region}-${query.tier}-${query.position}-${version ?? '_'}`,
        title: this._name(snapshot, true),
        sortrank: 0,
        type: 'global',
        map: 'any',
        mode: 'any',
        blocks: details.itemSet!.groups.map((group) => ({
          type: this._t(`champion.${keys[group.kind]}`, {
            index: group.index,
            pickRate: group.pickRate == null ? '-' : (group.pickRate * 100).toFixed(2)
          }),
          items: group.items.map((id) => ({ id: restoreRecipe(id).toString(), count: 1 }))
        })),
        associatedChampions: [],
        associatedMaps: [],
        preferredItemSlots: []
      }
    ])
    await this._sendChat(this._t('champion.writeToDisk', { name: this._name(snapshot) }))
  }

  private async _sendChat(message: string) {
    const { leagueClient, logger } = this._context
    const conversation = leagueClient.data.chat.conversations.championSelect

    if (!conversation) {
      return
    }

    try {
      await leagueClient.api.chat.chatSend(conversation.id, message, 'celebration')
    } catch (error) {
      logger.warn('Failed to send OP.GG recommendation message', String(error))
    }
  }
}
