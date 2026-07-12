import type { OngoingGamePanelPlayerTabInitParams } from '../../context'

export const PLAYER_INFO_CARD_ACTION_KEYS = {
  editTag: 'edit-tag',
  collectByChampion: 'collect-by-champion',
  collectByPosition: 'collect-by-position'
} as const

export type PlayerInfoCardActionKey =
  (typeof PLAYER_INFO_CARD_ACTION_KEYS)[keyof typeof PLAYER_INFO_CARD_ACTION_KEYS]

export function createCollectByChampionInitParams(
  championId: number,
  expectedCount: number
): OngoingGamePanelPlayerTabInitParams {
  return {
    matchHistory: {
      collectByChampionId: championId,
      expectedCount
    }
  }
}

export function getPlayerInfoCardActionKeys(options: {
  isStandaloneOngoingGameWindow?: boolean
  canEditTag: boolean
  canCollectByChampion: boolean
  canCollectByPosition: boolean
}): PlayerInfoCardActionKey[] {
  if (options.isStandaloneOngoingGameWindow) {
    return []
  }

  const keys: PlayerInfoCardActionKey[] = []

  if (options.canEditTag) {
    keys.push(PLAYER_INFO_CARD_ACTION_KEYS.editTag)
  }

  if (options.canCollectByChampion) {
    keys.push(PLAYER_INFO_CARD_ACTION_KEYS.collectByChampion)
  }

  if (options.canCollectByPosition) {
    keys.push(PLAYER_INFO_CARD_ACTION_KEYS.collectByPosition)
  }

  return keys
}
