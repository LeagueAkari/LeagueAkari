import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'

import type { OngoingGameProviderValue } from './types'

export function createAkariOngoingGameProvider(): OngoingGameProviderValue {
  const appCommon = useAppCommonStore()
  const leagueClient = useLeagueClientStore()
  const ongoingGame = useOngoingGameStore()
  const ongoingGameRenderer = useInstance(OngoingGameRenderer)

  return {
    get settings() {
      return ongoingGame.settings
    },
    get queryStage() {
      return ongoingGame.queryStage
    },
    get draft() {
      return ongoingGame.draft
    },
    get teams() {
      return ongoingGame.teams
    },
    get championSelections() {
      return ongoingGame.championSelections
    },
    get positionAssignments() {
      return ongoingGame.positionAssignments
    },
    get mergedPremadeTeamMap() {
      return ongoingGame.mergedPremadeTeamMap
    },
    get analysis() {
      return ongoingGame.analysis
    },
    get summoner() {
      return ongoingGame.summoner
    },
    get rankedStats() {
      return ongoingGame.rankedStats
    },
    get championMastery() {
      return ongoingGame.championMastery
    },
    get savedInfo() {
      return ongoingGame.savedInfo
    },
    get cachedGames() {
      return ongoingGame.cachedGames
    },
    get gameDetails() {
      return ongoingGame.gameDetails
    },
    get matchHistory() {
      return ongoingGame.matchHistory
    },
    get matchHistoryLoadingState() {
      return ongoingGame.matchHistoryLoadingState
    },
    get spells() {
      return ongoingGame.additional.spells
    },
    get isConnected() {
      return leagueClient.isConnected
    },
    get isSpectating() {
      return Boolean(leagueClient.champSelect.session?.isSpectating)
    },
    get streamerMode() {
      return appCommon.settings.streamerMode
    },
    get selfPuuid() {
      return leagueClient.summoner.me?.puuid ?? null
    },
    reloadPlayer(puuid: string) {
      ongoingGameRenderer.reloadPlayer(puuid)
    }
  }
}
