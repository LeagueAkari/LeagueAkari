import type { SelfImprovementMetricKey } from '../data/self-improvement-metrics'

export interface SelfImprovementChartPoint {
  /** X 轴刻度，例如 10-22 */
  label: string
  /** 完整日期，用于 Tooltip */
  dateText: string
  championName: string
  resultText: string
  durationText: string
  kdaText: string
  win: boolean
  value: number
}

export interface SelfImprovementKpiDelta {
  text: string
  hint: string
  direction: 'up' | 'down'
  /** 该变化是否代表进步 */
  positive: boolean
}

export interface SelfImprovementChartView {
  key: SelfImprovementMetricKey
  title: string
  unit: string
  color: string
  precision?: number
  percent?: boolean
  points: SelfImprovementChartPoint[]
  movingAverage: (number | null)[]
  average: number
  ariaLabel: string
}
