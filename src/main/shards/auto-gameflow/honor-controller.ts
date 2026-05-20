import { ChoiceMaker } from '@shared/utils/choice-maker'
import { formatError } from '@shared/utils/errors'
import { randomInt } from '@shared/utils/random'
import { comparer, computed } from 'mobx'

import type { AutoGameflowActions } from './actions'
import { AUTO_GAMEFLOW_HONOR_CATEGORY, type AutoGameflowMainContext } from './context'

export class AutoGameflowHonorController {
  constructor(
    private readonly _context: AutoGameflowMainContext,
    private readonly _actions: AutoGameflowActions
  ) {}

  watch() {
    const { ipc, leagueClient, logger, mobxUtils, namespace, settings } = this._context

    const honorables = computed(() => {
      if (!leagueClient.data.honor.ballot) {
        return null
      }

      const {
        eligibleAllies,
        eligibleOpponents,
        gameId,
        votePool: { votes }
      } = leagueClient.data.honor.ballot

      return {
        allies: eligibleAllies.filter((player) => !player.botPlayer).map((player) => player.puuid),
        opponents: eligibleOpponents
          .filter((player) => !player.botPlayer)
          .map((player) => player.puuid),
        votes,
        gameId
      }
    })

    mobxUtils.reaction(
      () => [honorables.get(), settings.autoHonorEnabled] as const,
      async ([honorablePlayers, enabled]) => {
        if (honorablePlayers && honorablePlayers.gameId) {
          this._actions.cancelPlayAgain()
        }

        if (honorablePlayers && honorablePlayers.gameId && enabled) {
          try {
            const endOfGameStatus = (await leagueClient.api.lobby.getEogStatus()).data
            const lobbyMembers = [
              ...endOfGameStatus.eogPlayers,
              ...endOfGameStatus.leftPlayers,
              ...endOfGameStatus.readyPlayers
            ]

            const candidates: string[] = []

            // 1. 优先从房间中的己方成员选择
            const lobbyAllies = honorablePlayers.allies.filter((puuid) =>
              lobbyMembers.includes(puuid)
            )
            const firstBatchVotes = Math.min(honorablePlayers.votes, lobbyAllies.length)
            if (firstBatchVotes > 0) {
              const weights = Array(lobbyAllies.length).fill(1)
              const maker = new ChoiceMaker(weights, lobbyAllies)
              const chosenLobbyAllies = maker.choose(firstBatchVotes)
              candidates.push(...chosenLobbyAllies)
            }

            // 2. 如果还有剩余点赞数，从非房间内的己方成员中选择
            const remainingVotesAfterFirst = honorablePlayers.votes - candidates.length
            if (remainingVotesAfterFirst > 0) {
              const nonLobbyAllies = honorablePlayers.allies.filter(
                (puuid) => !lobbyMembers.includes(puuid) && !candidates.includes(puuid)
              )
              const secondBatchVotes = Math.min(remainingVotesAfterFirst, nonLobbyAllies.length)
              if (secondBatchVotes > 0) {
                const weights = Array(nonLobbyAllies.length).fill(1)
                const maker = new ChoiceMaker(weights, nonLobbyAllies)
                const chosenNonLobbyAllies = maker.choose(secondBatchVotes)
                candidates.push(...chosenNonLobbyAllies)
              }
            }

            // 3. 如果还有剩余点赞数，从非房间内的敌方成员中选择
            const remainingVotesAfterSecond = honorablePlayers.votes - candidates.length
            if (remainingVotesAfterSecond > 0) {
              const nonLobbyOpponents = honorablePlayers.opponents.filter(
                (puuid) => !lobbyMembers.includes(puuid) && !candidates.includes(puuid)
              )
              const thirdBatchVotes = Math.min(remainingVotesAfterSecond, nonLobbyOpponents.length)
              if (thirdBatchVotes > 0) {
                const weights = Array(nonLobbyOpponents.length).fill(1)
                const maker = new ChoiceMaker(weights, nonLobbyOpponents)
                const chosenNonLobbyOpponents = maker.choose(thirdBatchVotes)
                candidates.push(...chosenNonLobbyOpponents)
              }
            }

            // 对选择出的 candidates 进行点赞
            for (const puuid of candidates) {
              await leagueClient.api.honor.honor(
                AUTO_GAMEFLOW_HONOR_CATEGORY[randomInt(0, AUTO_GAMEFLOW_HONOR_CATEGORY.length)],
                puuid
              )
            }

            await leagueClient.api.honor.ballot()
            logger.info(
              `Auto-honor: voting for ${candidates.join(', ')}, game ID: ${honorablePlayers.gameId}`
            )
          } catch (error) {
            ipc.sendEvent(namespace, 'error-auto-honor', formatError(error))

            logger.warn(`Auto-honor error: ${formatError(error)}`)
          }
        }
      },
      {
        equals: comparer.structural,
        fireImmediately: true
      }
    )
  }
}
