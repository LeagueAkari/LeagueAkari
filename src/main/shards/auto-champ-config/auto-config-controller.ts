import { i18next } from '@main/i18n'
import { formatError } from '@shared/utils/errors'
import { comparer } from 'mobx'

import {
  type AutoChampionConfigMainContext,
  type ChampionConfigMeta,
  GAME_MODE_TYPE_MAP
} from './context'
import type { ChampionRunesConfig, SummonerSpellsConfig } from './state'

export class AutoChampConfigController {
  constructor(private readonly context: AutoChampionConfigMainContext) {}

  watch() {
    this._watchCurrentChampion()
    this._watchChampionSelectConversation()
  }

  private _watchCurrentChampion() {
    const { leagueClient, mobxUtils, settings } = this.context

    mobxUtils.reaction(
      () => [leagueClient.data.champSelect.currentChampion, settings.enabled] as const,
      ([championId, enabled]) => {
        if (!enabled || !championId) {
          return
        }

        if (!leagueClient.data.gameflow.session || !leagueClient.data.champSelect.session) {
          return
        }

        const localPlayerCellId = leagueClient.data.champSelect.session.localPlayerCellId
        const self = leagueClient.data.champSelect.session.myTeam.find(
          (player) => player.cellId === localPlayerCellId
        )

        if (!self) {
          return
        }

        const gameMode = leagueClient.data.gameflow.session.gameData.queue.gameMode
        const queueType = leagueClient.data.gameflow.session.gameData.queue.type
        const selfPosition = self.assignedPosition

        let configKey: string | null
        // CLASSIC 模式下, 特别区分是否是 RANKED
        if (gameMode === 'CLASSIC') {
          // 目前有 RANKED_FLEX_SR, RANKED_SOLO_5x5
          if (queueType.startsWith('RANKED_')) {
            const rankedConfigKey = `ranked-${selfPosition}`
            if (settings.runesV2[championId] && settings.runesV2[championId][rankedConfigKey]) {
              configKey = rankedConfigKey
            } else {
              configKey = 'ranked-default'
            }
          } else {
            configKey = 'normal'
          }
        } else {
          configKey = GAME_MODE_TYPE_MAP[gameMode] || null
        }

        if (!configKey) {
          return
        }

        const runes = settings.runesV2[championId]?.[configKey]
        const spells = settings.summonerSpells[championId]?.[configKey]

        if (runes) {
          void this._createOrReplaceRunesPage(runes, { championId, position: selfPosition })
        }

        if (spells) {
          void this._applySummonerSpells(spells, { championId, position: selfPosition })
        }
      }
    )
  }

  private _watchChampionSelectConversation() {
    const { leagueClient, mobxUtils, settings } = this.context

    mobxUtils.reaction(
      () =>
        [
          leagueClient.data.chat.conversations.championSelect?.id,
          Boolean(leagueClient.data.gameflow.session),
          Boolean(leagueClient.data.champSelect.session)
        ] as const,
      ([id, g, c]) => {
        if (
          settings.enabled &&
          id &&
          leagueClient.data.gameflow.phase === 'ChampSelect' &&
          g &&
          c
        ) {
          const gSession = leagueClient.data.gameflow.session!
          const cSession = leagueClient.data.champSelect.session!

          const localPlayerCellId = cSession.localPlayerCellId
          const self = cSession.myTeam.find((player) => player.cellId === localPlayerCellId)

          if (!self) {
            return
          }

          const gameMode = gSession.gameData.queue.gameMode
          const queueType = gSession.gameData.queue.type
          const selfPosition = self.assignedPosition

          const isRankedMode = queueType.startsWith('RANKED_')

          let configKey: string | null
          if (gameMode === 'CLASSIC') {
            if (isRankedMode) {
              configKey = `ranked-${selfPosition}`
            } else {
              configKey = 'normal'
            }
          } else {
            configKey = GAME_MODE_TYPE_MAP[gameMode] || null
          }

          if (!configKey) {
            return
          }

          // 寻找已配置的所有英雄
          const runesChampionIds: number[] = []
          const spellsChampionIds: number[] = []

          Object.entries(settings.runesV2).forEach(([championId, runesConfig]) => {
            if (runesConfig[configKey!]) {
              runesChampionIds.push(Number(championId))
            } else {
              if (isRankedMode && runesConfig['ranked-default']) {
                runesChampionIds.push(Number(championId))
              }
            }
          })

          Object.entries(settings.summonerSpells).forEach(([championId, spellsConfig]) => {
            if (spellsConfig[configKey!]) {
              spellsChampionIds.push(Number(championId))
            } else {
              if (isRankedMode && spellsConfig['ranked-default']) {
                spellsChampionIds.push(Number(championId))
              }
            }
          })

          const unionChampionIds = Array.from(new Set([...runesChampionIds, ...spellsChampionIds]))
          const names = unionChampionIds
            .map((id) => leagueClient.data.gameData.champions[id]?.name || id)
            .slice(0, 16)

          if (names.length) {
            void this._sendInChat(
              i18next.t('auto-champ-config-main.auto-config-enabled', {
                names: names.join(', ')
              })
            )
          } else {
            void this._sendInChat(
              i18next.t('auto-champ-config-main.auto-config-enabled-no-champion')
            )
          }
        }
      },
      { equals: comparer.shallow }
    )
  }

  private _getRunesName(config: ChampionRunesConfig, meta: ChampionConfigMeta) {
    const { leagueClient } = this.context
    const { championId, position } = meta

    const championName = leagueClient.data.gameData.champions[championId]?.name || championId
    const positionName = position ? i18next.t(`positions.${position}`, { ns: 'common' }) : null

    const primaryStyleName =
      leagueClient.data.gameData.perkstyles.styles[config.primaryStyleId]?.name ||
      config.primaryStyleId
    const subStyleName =
      leagueClient.data.gameData.perkstyles.styles[config.subStyleId]?.name || config.subStyleId
    const perkNames = config.selectedPerkIds.map(
      (id) => leagueClient.data.gameData.perks[id]?.name || id
    )

    if (positionName) {
      return {
        pageName: `[Akari] ${i18next.t('auto-champ-config-main.runes.pageNameWithPosition', {
          name: championName,
          position: positionName
        })}`,
        message: i18next.t('auto-champ-config-main.runes.appliedWithPosition', {
          name: championName,
          primary: primaryStyleName,
          sub: subStyleName,
          all: perkNames.join(', '),
          position: positionName
        }),
        errorMessage: i18next.t('auto-champ-config-main.runes.errorAppliedWithPosition', {
          name: championName,
          position: positionName
        })
      }
    } else {
      return {
        pageName: `[Akari] ${i18next.t('auto-champ-config-main.runes.pageName', {
          name: championName
        })}`,
        message: i18next.t('auto-champ-config-main.runes.applied', {
          name: championName,
          primary: primaryStyleName,
          sub: subStyleName,
          all: perkNames.join(', ')
        }),
        errorMessage: i18next.t('auto-champ-config-main.runes.errorApplied', {
          name: championName
        })
      }
    }
  }

  private _getSummonerSpellsName(config: SummonerSpellsConfig, meta: ChampionConfigMeta) {
    const { leagueClient } = this.context
    const { championId, position } = meta

    const championName = leagueClient.data.gameData.champions[championId]?.name || championId
    const positionName = position ? i18next.t(`positions.${position}`, { ns: 'common' }) : null

    const spell1Name =
      leagueClient.data.gameData.summonerSpells[config.spell1Id]?.name || config.spell1Id
    const spell2Name =
      leagueClient.data.gameData.summonerSpells[config.spell2Id]?.name || config.spell2Id

    if (positionName) {
      return {
        message: i18next.t('auto-champ-config-main.summonerSpells.appliedWithPosition', {
          name: championName,
          spell1: spell1Name,
          spell2: spell2Name,
          position: positionName
        }),
        errorMessage: i18next.t('auto-champ-config-main.summonerSpells.errorAppliedWithPosition', {
          name: championName,
          position: positionName
        })
      }
    } else {
      return {
        message: i18next.t('auto-champ-config-main.summonerSpells.applied', {
          name: championName,
          spell1: spell1Name,
          spell2: spell2Name
        }),
        errorMessage: i18next.t('auto-champ-config-main.summonerSpells.errorApplied', {
          name: championName
        })
      }
    }
  }

  private async _createOrReplaceRunesPage(config: ChampionRunesConfig, meta: ChampionConfigMeta) {
    const { ipc, leagueClient, logger, namespace } = this.context
    const { message, pageName, errorMessage } = this._getRunesName(config, meta)

    try {
      const inventory = (await leagueClient.api.perks.getPerkInventory()).data
      if (inventory.canAddCustomPage) {
        const { data: added } = await leagueClient.api.perks.postPerkPage({
          name: pageName,
          isEditable: true,
          primaryStyleId: config.primaryStyleId.toString()
        })
        await leagueClient.api.perks.putPage({
          id: added.id,
          isRecommendationOverride: false,
          isTemporary: false,
          name: pageName,
          primaryStyleId: config.primaryStyleId,
          selectedPerkIds: config.selectedPerkIds,
          subStyleId: config.subStyleId
        })
        await leagueClient.api.perks.putCurrentPage(added.id)
      } else {
        const pages = (await leagueClient.api.perks.getPerkPages()).data
        if (!pages.length) {
          return
        }

        const page1 = pages[0]
        await leagueClient.api.perks.putPage({
          id: page1.id,
          isRecommendationOverride: false,
          isTemporary: false,
          name: pageName,
          primaryStyleId: config.primaryStyleId,
          selectedPerkIds: config.selectedPerkIds,
          subStyleId: config.subStyleId
        })
        await leagueClient.api.perks.putCurrentPage(page1.id)
      }

      await this._sendInChat(message)
      logger.info(`Runes page updated`, config, meta)
    } catch (error) {
      ipc.sendEvent(namespace, 'error-runes-update', formatError(error))
      logger.warn(`Unable to update runes page`, error)
      await this._sendInChat(errorMessage)
    }
  }

  private async _applySummonerSpells(config: SummonerSpellsConfig, meta: ChampionConfigMeta) {
    const { ipc, leagueClient, logger, namespace } = this.context
    const { message, errorMessage } = this._getSummonerSpellsName(config, meta)

    try {
      await leagueClient.api.champSelect.setSummonerSpells({
        spell1Id: config.spell1Id,
        spell2Id: config.spell2Id
      })

      await this._sendInChat(message)
    } catch (error) {
      ipc.sendEvent(namespace, 'error-spells-update', formatError(error))
      logger.warn(`Unable to update summoner spells`, error)
      await this._sendInChat(errorMessage)
    }
  }

  private async _sendInChat(message: string) {
    const { ipc, leagueClient, logger, namespace } = this.context

    if (!leagueClient.data.chat.conversations.championSelect) {
      return
    }

    try {
      await leagueClient.api.chat.chatSend(
        leagueClient.data.chat.conversations.championSelect.id,
        `[League Akari] ${message}`,
        'celebration'
      )
    } catch (error) {
      ipc.sendEvent(namespace, 'error-chat-send', formatError(error))
      logger.warn(`Unable to send message`, error)
    }
  }
}
