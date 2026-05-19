import { computed } from 'vue'

import { useChallengesPlayerData } from '../data/challenges'
import { useChampionMastery } from '../data/champion-mastery'
import { useEncounteredGames } from '../data/encountered-games'
import { useMatchHistory } from '../data/match-history'
import { useRankedStats } from '../data/ranked-stats'
import { useSpectator } from '../data/spectator'
import { useSummoner } from '../data/summoner'
import { useSummonerProfile } from '../data/summoner-profile'
import { useTags } from '../data/tags'

export function useRefresh() {
  const { loadSummoner, isLoading: isLoadingSummoner } = useSummoner()
  const { loadGames, isLoading: isLoadingEncounteredGames } = useEncounteredGames()
  const { loadMatchHistory, isLoading: isLoadingMatchHistory } = useMatchHistory()
  const { loadRankedStats, isLoading: isLoadingRankedStats } = useRankedStats()
  const { loadTags, isLoading: isLoadingPlayerTag } = useTags()
  const { loadSpectatorData, isLoading: isLoadingSpectator } = useSpectator()
  const { loadSummonerProfile, isLoading: isLoadingSummonerProfile } = useSummonerProfile()
  const { loadChampionMastery, isLoading: isLoadingChampionMastery } = useChampionMastery()
  const { loadChallengesPlayerData, isLoading: isLoadingChallengesPlayerData } =
    useChallengesPlayerData()

  const isSomethingLoading = computed(() => {
    return (
      isLoadingSummoner.value ||
      isLoadingEncounteredGames.value ||
      isLoadingMatchHistory.value ||
      isLoadingRankedStats.value ||
      isLoadingPlayerTag.value ||
      isLoadingSpectator.value ||
      isLoadingSummonerProfile.value ||
      isLoadingChampionMastery.value ||
      isLoadingChallengesPlayerData.value
    )
  })

  const refresh = () => {
    loadSummoner()
    loadGames()
    loadMatchHistory()
    loadRankedStats()
    loadTags()
    loadSpectatorData()
    loadSummonerProfile()
    loadChampionMastery()
    loadChallengesPlayerData()
  }

  return {
    refresh,
    isSomethingLoading
  }
}
