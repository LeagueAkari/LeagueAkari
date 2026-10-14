/**
 * 遇到的对局记录
 */
export const ENCOUNTERED_GAME_QUERY_DEFAULT_PAGE_SIZE = 40

export const SAVED_PLAYER_TAG_PHRASE_MAX_ITEMS = 20
export const SAVED_PLAYER_TAG_PHRASE_MAX_LENGTH = 100

export function createDefaultSavedPlayerTagPhrases(): string[] {
  return []
}

export function normalizeSavedPlayerTagPhrase(value: unknown): string {
  return String(value ?? '')
    .trim()
    .slice(0, SAVED_PLAYER_TAG_PHRASE_MAX_LENGTH)
}

export function normalizeSavedPlayerTagPhrases(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const phrases: string[] = []
  const seen = new Set<string>()

  for (const item of value) {
    const phrase = normalizeSavedPlayerTagPhrase(item)

    if (!phrase || seen.has(phrase)) {
      continue
    }

    phrases.push(phrase)
    seen.add(phrase)

    if (phrases.length >= SAVED_PLAYER_TAG_PHRASE_MAX_ITEMS) {
      break
    }
  }

  return phrases
}

export interface EncounteredGame {
  id: number
  gameId: number
  puuid: string
  selfPuuid: string
  region: string
  rsoPlatformId: string
  updateAt: Date
  queueType: string
  championId: number | null
}

export interface SavedPlayerQueryDto {
  selfPuuid: string
  puuid: string
  rsoPlatformId?: string
  region?: string
}

export interface AllTaggedPlayerQueryDto {
  selfPuuid: string
  puuid: string
  region: string
  rsoPlatformId: string
  timeOrder: 'desc' | 'asc'
  page: number
  pageSize: number
}

export interface PlayerTagDto {
  markedBySelf: boolean
  puuid: string
  selfPuuid: string
  region: string
  rsoPlatformId: string
  tag: string | null
  updateAt: Date
  lastMetAt: Date | null
}

export interface UpdateTagDto {
  selfPuuid: string
  puuid: string
  tag: string | null
  rsoPlatformId?: string
  region?: string
}

export interface EncounteredGameSaveDto {
  selfPuuid: string
  puuid: string
  region: string
  rsoPlatformId: string
  gameId: number
  queueType: string
  championId?: number | null
}

export interface EncounteredGameQueryDto {
  selfPuuid: string
  puuid: string
  region?: string
  rsoPlatformId?: string
  queueType?: string
  pageSize?: number
  page?: number
  timeOrder?: 'desc' | 'asc'
}

export interface PaginationDto {
  page: number
  pageSize: number
}

export interface OrderByDto {
  timeOrder: 'desc' | 'asc'
}

export interface WithEncounteredGamesQueryDto {
  queueType?: string
}

export interface SavedPlayerSaveDto extends SavedPlayerQueryDto {
  rsoPlatformId: string
  region: string
  tag?: string
  encountered: boolean
}

export interface QueryAllSavedPlayersDto {
  page: number
  pageSize: number
}

export interface SavedInfo {
  puuid: string
  selfPuuid: string
  region: string
  rsoPlatformId: string
  tag: string | null
  updateAt: Date
  lastMetAt: Date | null
  tags: PlayerTagDto[]
  encounteredGames: {
    data: EncounteredGame[]
    page: number
    pageSize: number
    total: number
  }
}
