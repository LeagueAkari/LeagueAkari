import type {
  OpggAramChampionDetailsResponse,
  OpggAramChampionsResponse,
  OpggAramMayhemChampionAugmentsResponse,
  OpggAramMayhemTiersResponse,
  OpggArenaChampionDetailsResponse,
  OpggArenaChampionsResponse,
  OpggRankedChampionDetailsResponse,
  OpggRankedChampionsResponse
} from '@shared/types/opgg'
import type { OpggRegion, OpggTierFilter } from '@shared/types/opgg'

interface OpggVersionedOverviewTarget {
  region: OpggRegion
  version: string
}

interface OpggTieredOverviewTarget extends OpggVersionedOverviewTarget {
  tier: OpggTierFilter
}

export type OpggOverviewTarget =
  | (OpggTieredOverviewTarget & { mode: 'ranked' | 'flex' | 'aram' | 'nexus_blitz' | 'urf' })
  | (OpggVersionedOverviewTarget & { mode: 'arena' })
  | { mode: 'aram_mayhem' }

export interface OpggResolvedTarget {
  target: OpggOverviewTarget
  versions: string[]
  requestedVersion: string | null
}

export type OpggLoadedOverview =
  | (OpggTieredOverviewTarget & {
      mode: 'ranked' | 'flex'
      response: OpggRankedChampionsResponse
    })
  | (OpggTieredOverviewTarget & {
      mode: 'aram'
      response: OpggAramChampionsResponse
    })
  | (OpggTieredOverviewTarget & {
      mode: 'nexus_blitz'
      response: OpggAramChampionsResponse
    })
  | (OpggTieredOverviewTarget & {
      mode: 'urf'
      response: OpggAramChampionsResponse
    })
  | (OpggVersionedOverviewTarget & {
      mode: 'arena'
      response: OpggArenaChampionsResponse
    })
  | {
      mode: 'aram_mayhem'
      response: OpggAramMayhemTiersResponse
    }

export type OpggLoadedChampion =
  | {
      mode: 'ranked' | 'flex'
      response: OpggRankedChampionDetailsResponse
    }
  | {
      mode: 'aram'
      response: OpggAramChampionDetailsResponse
    }
  | {
      mode: 'nexus_blitz'
      response: OpggAramChampionDetailsResponse
    }
  | {
      mode: 'urf'
      response: OpggAramChampionDetailsResponse
    }
  | {
      mode: 'arena'
      response: OpggArenaChampionDetailsResponse
    }
  | {
      mode: 'aram_mayhem'
      summary: OpggAramMayhemTiersResponse['data'][number]
      response: OpggAramMayhemChampionAugmentsResponse
    }
