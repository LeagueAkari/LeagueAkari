export function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)

  return `${m}:${s.toString().padStart(2, '0')}`
}
