import type { InGameSendPresetNameDisplayStrategy } from '@shared/shards/in-game-send'

import { presetCommonT } from './i18n'
import type { InGameSendPresetContext, InGameSendPresetPlayer } from './types'

export function playerRiotId(player: InGameSendPresetPlayer) {
  return player.tagLine ? `${player.gameName}#${player.tagLine}` : player.gameName
}

export function countSelectedChampionIds(players: InGameSendPresetPlayer[]) {
  const counts = new Map<number, number>()

  for (const player of players) {
    if (player.championId > 0) {
      counts.set(player.championId, (counts.get(player.championId) ?? 0) + 1)
    }
  }

  return counts
}

function championName(context: InGameSendPresetContext, championId: number) {
  return context.mainContext.leagueClient.data.gameData.championName(championId)
}

function playerCurrentChampionName(
  context: InGameSendPresetContext,
  player: InGameSendPresetPlayer
) {
  if (player.championId <= 0) {
    return null
  }

  return championName(context, player.championId)
}

export function playerDisplayName(
  context: InGameSendPresetContext,
  player: InGameSendPresetPlayer,
  strategy: InGameSendPresetNameDisplayStrategy,
  selectedChampionIdCounts: Map<number, number>
) {
  const riotId = playerRiotId(player)
  const selectedChampionName = playerCurrentChampionName(context, player)

  if (playerDisplayNameUsesChampionName(player, strategy, selectedChampionIdCounts)) {
    if (strategy === 'championNameWithName') {
      return presetCommonT('championWithPlayer', {
        champion: selectedChampionName,
        player: riotId
      })
    }

    return selectedChampionName!
  }

  return riotId
}

export function playerDisplayNameUsesChampionName(
  player: InGameSendPresetPlayer,
  strategy: InGameSendPresetNameDisplayStrategy,
  selectedChampionIdCounts: Map<number, number>
) {
  if (player.championId <= 0) {
    return false
  }

  if (strategy === 'preferName') {
    return false
  }

  if (strategy === 'championNameWithName') {
    return true
  }

  if (strategy === 'preferChampionName') {
    return selectedChampionIdCounts.get(player.championId) === 1
  }

  return false
}
