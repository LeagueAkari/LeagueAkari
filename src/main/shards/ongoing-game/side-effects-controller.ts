import { i18next } from '@main/i18n'
import { comparer, computed } from 'mobx'

import type { OngoingGameMainContext } from './context'

export class OngoingGameSideEffectsController {
  constructor(private readonly _context: OngoingGameMainContext) {}

  watch() {
    this._watchEndOfGameSave()
    this._watchTaggedPlayerReminders()
  }

  private _watchEndOfGameSave() {
    const { leagueClient, logger, mobxUtils, savedPlayer, state } = this._context
    const isInEndOfGame = computed(() => {
      return (
        leagueClient.data.gameflow.phase === 'EndOfGame' ||
        leagueClient.data.gameflow.phase === 'PreEndOfGame'
      )
    })

    mobxUtils.reaction(
      () => isInEndOfGame.get(),
      async (yes) => {
        if (yes) {
          if (
            !leagueClient.state.auth ||
            !leagueClient.data.summoner.me ||
            !state.queryStage.gameInfo
          ) {
            return
          }

          if (state.queryStage.phase !== 'in-game' || !state.queryStage.gameInfo.gameId) {
            return
          }

          const players = Object.values(state.teams || {}).flat()

          if (!players.includes(leagueClient.data.summoner.me.puuid)) {
            logger.info('Current player not in this game, skip recording')
            return
          }

          const filteredPlayers = players.filter((p) => p !== leagueClient.data.summoner.me?.puuid)

          for (const player of filteredPlayers) {
            await savedPlayer.saveEncounteredGame({
              gameId: state.queryStage.gameInfo.gameId,
              puuid: player,
              region: leagueClient.state.auth.region,
              rsoPlatformId: leagueClient.state.auth.rsoPlatformId,
              selfPuuid: leagueClient.data.summoner.me.puuid,
              queueType: state.queryStage.gameInfo.queueType
            })

            logger.info(`Save game info: ${state.queryStage.gameInfo.gameId}`)
            await savedPlayer.saveSavedPlayer({
              encountered: true,
              puuid: player,
              selfPuuid: leagueClient.data.summoner.me.puuid,
              region: leagueClient.state.auth.region,
              rsoPlatformId: leagueClient.state.auth.rsoPlatformId
            })
            logger.info(`Save player info: ${player}`)
          }
        }
      }
    )
  }

  private _watchTaggedPlayerReminders() {
    const { leagueClient, mobxUtils, state } = this._context
    let reminded: string[] = []

    const itsTimeToSend = computed(() => {
      if (state.draft) {
        return null
      }

      if (!leagueClient.data.chat.conversations.championSelect) {
        return null
      }

      return leagueClient.data.chat.conversations.championSelect.id
    })

    const playersToSend = computed(
      () => {
        return Object.entries(state.savedInfo)
          .map(([puuid, info]) => {
            if (!info.tag) {
              return null
            }

            const summoner = state.summoner[puuid]
            if (!summoner) {
              return null
            }

            return {
              puuid,
              name: `${summoner.gameName}#${summoner.tagLine}`,
              tag: info.tag
            }
          })
          .filter((p) => p !== null)
      },
      {
        equals: (a, b) => {
          const aPuuids = a.map((p) => p.puuid)
          const bPuuids = b.map((p) => p.puuid)
          return comparer.shallow(aPuuids, bPuuids)
        }
      }
    )

    mobxUtils.reaction(
      () => itsTimeToSend.get(),
      (id) => {
        if (!id) {
          reminded = []
          return
        }
      }
    )

    mobxUtils.reaction(
      () => [playersToSend.get(), itsTimeToSend.get()] as const,
      ([players, roomId]) => {
        if (!roomId) {
          return
        }

        for (const player of players) {
          if (reminded.includes(player.puuid)) {
            continue
          }

          leagueClient.api.chat
            .chatSend(
              roomId,
              `[${i18next.t('ongoing-game-main.taggedPlayer')}: ${player.name}]: \n${player.tag}`,
              'celebration'
            )
            .catch(() => {})
          reminded.push(player.puuid)
        }
      }
    )
  }
}
