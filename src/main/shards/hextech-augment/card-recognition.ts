import type { OcrFrame, OcrWord, RecognizedAugment } from '@shared/types/hextech-augment'

export interface AugmentName {
  id: number
  name: string
  augmentNameId?: string
}
export function normalizeAugmentName(name: string) {
  return name
    .normalize('NFKC')
    .replace(/[\s\p{P}\p{S}]/gu, '')
    .toLocaleLowerCase()
}

/** Exact dictionary matches only. Ambiguous aliases and fuzzy OCR guesses never receive ratings. */
export function recognizeAugmentCards(frame: OcrFrame, names: AugmentName[]): RecognizedAugment[] {
  // LCU mixes Arena and Mayhem entries. Prefer the explicitly ARAM variant of a
  // translated name, retaining shared entries that have no mode-specific override.
  const dictionary = new Map<string, { name: AugmentName | null; priority: number }>()
  for (const name of names) {
    const normalized = normalizeAugmentName(name.name)
    if (normalized.length < 2) continue
    const priority = name.augmentNameId?.startsWith('ARAM_') ? 1 : 0
    const previous = dictionary.get(normalized)
    if (!previous || priority > previous.priority) {
      dictionary.set(normalized, { name, priority })
    } else if (priority === previous.priority && previous.name?.id !== name.id) {
      dictionary.set(normalized, { name: null, priority })
    }
  }
  const lines = [...frame.lines]
  const rows = frame.lines
    .filter((line) => line.words.length > 0)
    .map((line) => {
      const x = Math.min(...line.words.map((word) => word.x))
      const y = Math.min(...line.words.map((word) => word.y))
      const right = Math.max(...line.words.map((word) => word.x + word.width))
      const bottom = Math.max(...line.words.map((word) => word.y + word.height))
      return { ...line, x, y, width: right - x, height: bottom - y }
    })
    .filter((row) => row.width <= frame.window.width * 0.3)
  for (const row of rows) {
    const next = rows
      .filter(
        (candidate) =>
          candidate.y >= row.y + row.height * 0.8 &&
          Math.abs(candidate.x + candidate.width / 2 - row.x - row.width / 2) <=
            Math.max(candidate.height, row.height)
      )
      .sort((a, b) => a.y - b.y)[0]
    if (
      !next ||
      next.y - row.y - row.height > Math.max(row.height, next.height) * 0.5 ||
      Math.max(row.height, next.height) > Math.min(row.height, next.height) * 1.5
    )
      continue
    const words = [...row.words, ...next.words]
    const name = normalizeAugmentName(words.map((word) => word.text).join(''))
    if (dictionary.get(name)?.name) lines.push({ words })
  }
  const matches: RecognizedAugment[] = []
  for (const line of lines) {
    for (let start = 0; start < line.words.length; start++) {
      const words: OcrWord[] = []
      for (let end = start; end < Math.min(line.words.length, start + 16); end++) {
        words.push(line.words[end])
        const text = normalizeAugmentName(words.map((word) => word.text).join(''))
        const name = dictionary.get(text)?.name
        if (!name) continue
        const x = Math.min(...words.map((word) => word.x))
        const y = Math.min(...words.map((word) => word.y))
        const right = Math.max(...words.map((word) => word.x + word.width))
        const bottom = Math.max(...words.map((word) => word.y + word.height))
        if (
          y < frame.window.height * 0.12 ||
          bottom > frame.window.height * 0.8 ||
          right - x > frame.window.width * 0.3
        )
          continue
        matches.push({ ...name, x, y, width: right - x, height: bottom - y })
      }
    }
  }
  const ordered = matches.sort((a, b) => a.x - b.x || b.name.length - a.name.length)
  const groups: RecognizedAugment[][] = []
  for (const anchor of ordered) {
    const row = ordered.filter(
      (match) => Math.abs(match.y - anchor.y) < Math.max(match.height, anchor.height) * 0.8
    )
    const slots: RecognizedAugment[] = []
    for (const match of row) {
      const previous = slots.at(-1)
      if (previous && match.x - previous.x < frame.window.width * 0.12) {
        if (match.name.length > previous.name.length) slots[slots.length - 1] = match
      } else slots.push(match)
    }
    if (slots.length !== 3) continue
    const centers = slots.map((match) => match.x + match.width / 2)
    const firstGap = centers[1] - centers[0]
    const secondGap = centers[2] - centers[1]
    if (
      firstGap < frame.window.width * 0.14 ||
      secondGap < frame.window.width * 0.14 ||
      Math.max(firstGap, secondGap) / Math.min(firstGap, secondGap) > 1.5
    )
      continue
    if (new Set(slots.map((match) => match.id)).size !== 3) continue
    groups.push(slots)
  }
  const unique = new Map(
    groups.map((group) => [
      group.map((match) => `${match.id}:${Math.round(match.y / 10)}`).join('|'),
      group
    ])
  )
  return unique.size === 1 ? [...unique.values()][0] : []
}
