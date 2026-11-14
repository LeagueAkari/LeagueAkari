/** desktop-api.op.gg/timer/jungle-fullcamps. Last verified: 2026-11-15. */
export interface OpggJungleFullCamp {
  id: number
  region: string
  team: 'red' | 'blue'
  queueId: number
  riotId: string
  championId: number
  /** Completion time in milliseconds, not a route or list of camps. */
  fullCampTime: number
  tier: string
  profileId: string
  matchId: string
  insertedAt: string
}

interface OpggPageSort {
  unsorted: boolean
  sorted: boolean
  empty: boolean
}

export interface OpggJungleFullCampsResponse {
  content: OpggJungleFullCamp[]
  pageable: {
    sort: OpggPageSort
    pageSize: number
    pageNumber: number
    offset: number
    paged: boolean
    unpaged: boolean
  }

  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
  numberOfElements: number
  size: number
  number: number
  sort: OpggPageSort
  empty: boolean
}
