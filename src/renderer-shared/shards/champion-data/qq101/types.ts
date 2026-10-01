import type { Qq101HttpApiAxiosHelper } from '@shared/http-api-axios-helper/qq101'

export type Qq101PatchList = Awaited<ReturnType<Qq101HttpApiAxiosHelper['getPatches']>>
export type Qq101RankedOverviewData = Awaited<ReturnType<Qq101HttpApiAxiosHelper['getTierList']>>
export type Qq101ClassicOverviewData = Awaited<
  ReturnType<Qq101HttpApiAxiosHelper['getClassicTierList']>
>
export type Qq101MayhemChampionData = Awaited<
  ReturnType<Qq101HttpApiAxiosHelper['getMayhemChampions']>
>
export type Qq101MayhemAugmentData = Awaited<
  ReturnType<Qq101HttpApiAxiosHelper['getMayhemAugments']>
>
export type Qq101MayhemSynergyData = Awaited<
  ReturnType<Qq101HttpApiAxiosHelper['getMayhemPairSynergies']>
>

export type Qq101ChampionDataOverview =
  | { mode: 'ranked'; data: Qq101RankedOverviewData }
  | { mode: 'classic'; data: Qq101ClassicOverviewData }
  | { mode: 'aram'; data: Awaited<ReturnType<Qq101HttpApiAxiosHelper['getAramChampions']>> }
  | {
      mode: 'aram_mayhem'
      data: {
        date: string
        augmentDate: string | null
        synergyDate: string | null
        champions: Qq101MayhemChampionData['champions']
        augments: Qq101MayhemAugmentData['augments'] | null
        synergies: Qq101MayhemSynergyData['synergies'] | null
        errors: Partial<Record<'champions' | 'augments' | 'synergies', string>>
      }
    }

export interface Qq101RankedDetailsData {
  championId: number
  position: string
  champion: Qq101RankedOverviewData['champions'][number] | null
  errors: Record<string, string>
  matchups: Awaited<ReturnType<Qq101HttpApiAxiosHelper['getMatchups']>> | null
  synergies: Awaited<ReturnType<Qq101HttpApiAxiosHelper['getSynergies']>> | null
  summonerSpells: Awaited<ReturnType<Qq101HttpApiAxiosHelper['getSummonerSpells']>> | null
  skillOrder: Awaited<ReturnType<Qq101HttpApiAxiosHelper['getSkillOrder']>> | null
  build: Awaited<ReturnType<Qq101HttpApiAxiosHelper['getBuild']>> | null
  runes: Awaited<ReturnType<Qq101HttpApiAxiosHelper['getRunes']>> | null
  positions: Awaited<ReturnType<Qq101HttpApiAxiosHelper['getPositions']>> | null
  trend: Awaited<ReturnType<Qq101HttpApiAxiosHelper['getTrend']>> | null
  tierStats: Awaited<ReturnType<Qq101HttpApiAxiosHelper['getTierStats']>> | null
  durations: Awaited<ReturnType<Qq101HttpApiAxiosHelper['getDurations']>> | null
}

export type Qq101ChampionDataDetails =
  | { mode: 'ranked'; data: Qq101RankedDetailsData }
  | {
      mode: 'aram'
      data: Awaited<ReturnType<Qq101HttpApiAxiosHelper['getAramChampions']>>['champions'][number]
    }
  | {
      mode: 'aram_mayhem'
      data: {
        champion: Qq101MayhemChampionData['champions'][number]
        augments: Qq101MayhemAugmentData['augments'] | null
        recommendations: Awaited<ReturnType<Qq101HttpApiAxiosHelper['getMayhemDetails']>>
        error: string | null
      }
    }
