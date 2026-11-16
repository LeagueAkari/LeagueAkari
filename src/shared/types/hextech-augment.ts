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
  window: { id: string; x: number; y: number; width: number; height: number }
  lines: { words: OcrWord[] }[]
}
export interface RecognizedAugment {
  id: number
  name: string
  x: number
  y: number
  width: number
  height: number
}
export interface HextechAugmentLabel extends RecognizedAugment {
  tier: string | null
  performance: number | null
}
export interface HextechAugmentSnapshot {
  championId: number
  capturedAt: number
  labels: HextechAugmentLabel[]
  window: OcrFrame['window']
}
