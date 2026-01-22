/**
 * 遇到的对局记录
 */
export interface EncounteredGame {
  id: number
  gameId: number
  puuid: string
  selfPuuid: string
  region: string
  rsoPlatformId: string
  updateAt: Date
  queueType: string
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
