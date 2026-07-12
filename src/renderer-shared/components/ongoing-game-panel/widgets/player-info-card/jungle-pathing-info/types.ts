import type {
  AggregatedAnalysis,
  AggregatedJungleAnalysis
} from '@shared/data-adapter/analysis/player'

export type JunglePathingInfoProps = {
  aggregatedAnalysis: AggregatedAnalysis
  currentChampionId?: number | null
}

export type JunglePathingTab = {
  key: string
  label: string
  stats: AggregatedJungleAnalysis
  championId: number | null
}

export type AlgorithmDescriptionLine = {
  translation: string
  keywords: Record<string, string>
}
