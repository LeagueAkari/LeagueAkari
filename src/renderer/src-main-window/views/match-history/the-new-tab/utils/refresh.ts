import { computed } from 'vue'

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

  const isSomethingLoading = computed(() => {
    return (
      isLoadingSummoner.value ||
      isLoadingEncounteredGames.value ||
      isLoadingMatchHistory.value ||
      isLoadingRankedStats.value ||
      isLoadingPlayerTag.value ||
      isLoadingSpectator.value ||
      isLoadingSummonerProfile.value
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
  }

  return {
    refresh,
    isSomethingLoading
  }
}
