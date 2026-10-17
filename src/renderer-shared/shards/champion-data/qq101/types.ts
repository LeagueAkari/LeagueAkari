import type { Qq101AkariData } from '@shared/data-adapter/qq101/akari-adapter'
import type { Qq101PairQuery } from '@shared/http-api-axios-helper/qq101'

export type Qq101HeroQuery =
  { mode: 'ranked'; patch: string; tier: number; position: string | null } | { mode: 'aram_mayhem' }

export type Qq101Page =
  | {
      kind: 'champion'
      id: string
      championId: number
      query: Qq101HeroQuery
      view: Qq101DetailView | null
      modeChange: { status: 'idle' | 'loading' } | { status: 'error'; message: string }
    }
  | {
      kind: 'pairs'
      id: string
      query: Qq101PairQuery
      state: Qq101Section<Qq101AkariData<'pairs'>>
    }

export type Qq101PatchList = Qq101AkariData<'patches'>

export type Qq101RankedOverviewData = Qq101AkariData<'ranked'>

export type Qq101ClassicOverviewData = Qq101AkariData<'classic'>

export type Qq101MayhemChampionData = Qq101AkariData<'mayhem'>

export type Qq101MayhemAugmentData = Qq101AkariData<'augments'>

export type Qq101MayhemSynergyData = Qq101AkariData<'pairs'>

export type Qq101Section<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string }

export interface Qq101RiftSections {
  positions: Qq101AkariData<'positions'>
  matchups: Qq101AkariData<'matchups'>
  synergies: Qq101AkariData<'synergies'>
  summonerSpells: Qq101AkariData<'spells'>
  skillOrder: Qq101AkariData<'skills'>
  build: Qq101AkariData<'build'>
  runes: Qq101AkariData<'runes'>
  trend: Qq101AkariData<'trend'>
  tierStats: Qq101AkariData<'tiers'>
  durations: Qq101AkariData<'durations'>
  jungle: Qq101AkariData<'jungle'>
}

export type Qq101RiftSectionKey = keyof Qq101RiftSections

export type Qq101DetailSectionKey = Qq101RiftSectionKey | 'recommendations' | 'summary'

export type Qq101DetailView =
  | {
      mode: 'ranked'
      championId: number
      position: string | null
      patch: string
      tier: number
      sections: { [K in Qq101RiftSectionKey]: Qq101Section<Qq101RiftSections[K]> }
    }
  | {
      mode: 'aram_mayhem'
      championId: number
      summary: Qq101Section<Qq101AkariData<'mayhem'>>
      recommendations: Qq101Section<Qq101AkariData<'mayhemDetails'>>
    }

export type Qq101ChampionDataOverview =
  | { mode: 'ranked'; data: Qq101RankedOverviewData }
  | { mode: 'classic'; data: Qq101ClassicOverviewData }
  | { mode: 'aram'; data: Qq101AkariData<'aram'> }
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
