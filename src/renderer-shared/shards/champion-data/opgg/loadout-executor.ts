import { i18next } from '@renderer-shared/i18n'
import { SUMMONER_SPELL_FLASH_ID } from '@shared/constants/summoner-spells'
import { restoreRecipe } from '@shared/data-adapter/opgg/recipe-restore'
import type {
  OpggChampionDataDetails,
  OpggChampionDataSnapshot,
  OpggFlashPosition,
  OpggStandardDetails
} from '@shared/types/champion-data/opgg'
import { toRaw } from 'vue'
import { z } from 'zod'

import type { OpggApplySelection, OpggRendererContext } from './context'

export class OpggLoadoutExecutor {
  constructor(private readonly _context: OpggRendererContext) {}

  async apply(request: OpggApplySelection) {
    const { state, leagueClient, settings } = this._context
    const current = state.snapshot
    const page = current.pages[request.pageId]

    if (
      !state.enabled ||
      !page ||
      page.status !== 'ready' ||
      page.stale ||
      !page.champion ||
      !page.query.championId
    ) {
      throw new Error('OP.GG champion data is not ready')
    }

    const snapshot = {
      ...current,
      query: { ...page.query },
      version: page.version,
      champion: structuredClone(toRaw(page.champion))
    }

    if (!leagueClient.isConnected) {
      throw new Error('League Client is disconnected')
    }

    if (state.isApplying) {
      throw new Error('Another recommendation is being applied')
    }

    const details = snapshot.champion

    state.isApplying = true

    try {
      if (details.kind === 'aram_mayhem') {
        throw new Error('This mode does not provide loadout recommendations')
      }

      if (request.kind === 'runes') {
        if (details.kind === 'arena') {
          throw new Error('Arena does not provide rune pages')
        }

        const runes = details.runes.find(
          (item) => item.recommendationId === request.recommendationId
        )

        if (!runes) {
          throw new Error('Rune recommendation does not exist')
        }

        const positiveId = z.number().int().positive()
        z.object({
          primaryStyleId: positiveId,
          secondaryStyleId: positiveId,
          primaryRuneIds: z.array(positiveId).length(4),
          secondaryRuneIds: z.array(positiveId).length(2),
          statShardIds: z.array(positiveId).length(3)
        }).parse(runes)
        await this._applyRunes(snapshot, runes)
      } else if (request.kind === 'spells') {
        if (details.kind === 'arena') {
          throw new Error('Arena does not provide summoner spell recommendations')
        }

        const spells = details.summonerSpells.find(
          (item) => item.recommendationId === request.recommendationId
        )

        if (!spells) {
          throw new Error('Summoner spell recommendation does not exist')
        }

        z.tuple([z.number().int().positive(), z.number().int().positive()])
          .refine(([a, b]) => a !== b)
          .parse(spells.spellIds)
        await this._applySpells([...spells.spellIds], settings.opggFlashPosition)
      } else {
        if (!details.itemSet || request.recommendationId !== details.itemSet.recommendationId) {
          throw new Error('Item set recommendation does not exist')
        }

        z.array(z.object({ items: z.array(z.number().int().positive()).min(1) }))
          .min(1)
          .parse(details.itemSet.groups)
        await this._applyItems(snapshot, details)
      }
    } finally {
      state.isApplying = false
    }
  }

  private _t(key: string, values: Record<string, unknown> = {}) {
    return i18next.t(`opgg.${key}`, { ns: 'renderer', ...values })
  }

  private _name(snapshot: OpggChampionDataSnapshot, includeMode = false) {
    const query = snapshot.query
    let name = `[${i18next.t('appName', { ns: 'common' })}] ${this._context.leagueClient.gameData.championName(query.championId!)}`

    if (includeMode) {
      name += ` - ${this._t(`filters.modes.${query.mode}`)}`
    }

    if (query.mode === 'ranked' || query.mode === 'flex') {
      name += ` - ${this._t(`filters.positions.${query.position}`)}`
    }

    return name
  }

  private async _applyRunes(
    snapshot: OpggChampionDataSnapshot,
    runes: OpggStandardDetails['runes'][number]
  ) {
    const { api } = this._context.client
    const name = this._name(snapshot)
    const inventory = (await api.perks.getPerkInventory()).data
    let pageId: number

    if (inventory.canAddCustomPage) {
      const { data } = await api.perks.postPerkPage({
        name,
        isEditable: true,
        primaryStyleId: runes.primaryStyleId.toString()
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
      primaryStyleId: runes.primaryStyleId,
      subStyleId: runes.secondaryStyleId,
      selectedPerkIds: [...runes.primaryRuneIds, ...runes.secondaryRuneIds, ...runes.statShardIds]
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
    const { client, leagueClient } = this._context
    const selection = (await client.api.champSelect.getMySelections()).data
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

    await client.api.champSelect.setSummonerSpells({ spell1Id, spell2Id })
    const spells = leagueClient.gameData.summonerSpells

    await this._sendChat(
      this._t('view.spellsSet', {
        spell1: spells[spell1Id]?.name ?? spell1Id,
        spell2: spells[spell2Id]?.name ?? spell2Id
      })
    )
  }

  private async _applyItems(
    snapshot: OpggChampionDataSnapshot,
    details: Exclude<OpggChampionDataDetails, { kind: 'aram_mayhem' }>
  ) {
    const { query, version } = snapshot
    const keys = {
      starter: 'starterItem',
      boots: 'bootsDesc',
      prism: 'prismItemsDesc',
      core: 'coreItem',
      last: 'itemsDesc'
    }

    await this._context.client.writeItemSetsToDisk([
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
    const { leagueClient, client, logger } = this._context
    const conversation = leagueClient.chat.conversations.championSelect

    if (!conversation) {
      return
    }

    try {
      await client.api.chat.chatSend(conversation.id, message, 'celebration')
    } catch (error) {
      logger.warn('Failed to send OP.GG recommendation message', String(error))
    }
  }
}
