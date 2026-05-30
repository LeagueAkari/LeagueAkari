export const PLAYER_TABS_RENDERER_NAMESPACE = 'player-tabs-renderer'
export const SEARCH_HISTORY_KEY = 'searchHistory'
export const SEARCH_HISTORY_MAX_LENGTH = 20

export interface SearchHistoryItem {
  puuid: string
  sgpServerId: string
  summoner: {
    profileIconId?: number
    gameName: string
    tagLine: string
  }

  isPinned?: boolean
}

export interface SearchResult {
  puuid: string
  gameName: string
  tagLine: string
  profileIconId: number
  sgpServerId: string
  privacy: string
  summonerLevel: number
}

export interface InitParams {
  collectByChampionId?: number
  collectByPosition?: string
}

export interface CreateTabOptions {
  setCurrent?: boolean
  initParams?: InitParams
}
