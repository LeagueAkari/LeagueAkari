import type { OpggDecodedResponse } from '@shared/data-adapter/opgg/schemas'
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
      response: OpggDecodedResponse<'rankedOverview'>
    })
  | (OpggTieredOverviewTarget & {
      mode: 'aram'
      response: OpggDecodedResponse<'winRateOverview'>
    })
  | (OpggTieredOverviewTarget & {
      mode: 'nexus_blitz'
      response: OpggDecodedResponse<'winRateOverview'>
    })
  | (OpggTieredOverviewTarget & {
      mode: 'urf'
      response: OpggDecodedResponse<'winRateOverview'>
    })
  | (OpggVersionedOverviewTarget & {
      mode: 'arena'
      response: OpggDecodedResponse<'arenaOverview'>
    })
  | {
      mode: 'aram_mayhem'
      response: OpggDecodedResponse<'mayhemTiers'>
    }

export type OpggLoadedChampion =
  | {
      mode: 'ranked' | 'flex'
      response: OpggDecodedResponse<'rankedDetails'>
    }
  | {
      mode: 'aram'
      response: OpggDecodedResponse<'winRateDetails'>
    }
  | {
      mode: 'nexus_blitz'
      response: OpggDecodedResponse<'winRateDetails'>
    }
  | {
      mode: 'urf'
      response: OpggDecodedResponse<'winRateDetails'>
    }
  | {
      mode: 'arena'
      response: OpggDecodedResponse<'arenaDetails'>
    }
  | {
      mode: 'aram_mayhem'
      summary: OpggDecodedResponse<'mayhemTiers'>['data'][number]
      response: OpggDecodedResponse<'mayhemAugments'>
    }
