export interface OcrWord {
  text: string
  x: number
  y: number
  width: number
  height: number
}
export interface OcrFrame {
  type: 'frame'
  capturedAt: number
  elapsedMs: number
  focused?: boolean
  reused?: boolean
  window: { id: string; x: number; y: number; width: number; height: number }
  lines: { words: OcrWord[] }[]
}
export interface RecognizedAugment {
  id: number
  slot?: 0 | 1 | 2 | 3
  name: string
  x: number
  y: number
  width: number
  height: number
}
export interface HextechAugmentLabel extends Omit<RecognizedAugment, 'id'> {
  id: number | null
  tier: string | null
  tierRank?: number | null
  tierCount?: number
}
export interface HextechAugmentSnapshot {
  championId: number
  capturedAt: number
  expiresAt: number
  labels: HextechAugmentLabel[]
  window: OcrFrame['window']
}
