import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useGameResourceProvider } from '@renderer-shared/providers/game-resource/context'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import { useOngoingGamePanel } from '../../../context'
import type { PlayerCardTagContext } from './types'

export function usePlayerCardTagContext(puuid: string) {
  const { t } = useTranslation()
  const { ongoingGame, mergedPremadeTeams, previewGame, navigateToSummonerByPuuid } =
    useOngoingGamePanel()
  const resources = useGameResourceProvider()
  const { masked } = useStreamerModeMaskedText()

  const analysis = computed(() => {
    if (!ongoingGame.value.analysis?.players[puuid]) {
      return null
    }

    return ongoingGame.value.analysis.players[puuid]
  })

  const savedInfo = computed(() => ongoingGame.value.savedInfo[puuid] ?? null)
  const premadeTeamId = computed(() => mergedPremadeTeams.value.premadeTeamIdMap[puuid])

  const previewEncounteredGame = (gameId: number) => {
    const summary = ongoingGame.value.cachedGames[gameId]

    previewGame(
      summary
        ? {
            summary,
            details: ongoingGame.value.gameDetails[gameId],
            puuid
          }
        : {
            summary: gameId,
            puuid
          }
    )
  }

  return computed<PlayerCardTagContext>(() => ({
    puuid,
    selfPuuid: ongoingGame.value.selfPuuid,
    settings: ongoingGame.value.settings.playerCardTags,
    analysis: analysis.value,
    summoners: ongoingGame.value.summoner,
    savedInfo: savedInfo.value,
    premadeTeamId: premadeTeamId.value,
    positionAssignment: ongoingGame.value.positionAssignments[puuid],
    spells: ongoingGame.value.spells[puuid],
    cachedGames: ongoingGame.value.cachedGames,
    locale: resources.runtime.locale,
    t,
    masked,
    navigateToSummonerByPuuid,
    previewEncounteredGame
  }))
}
