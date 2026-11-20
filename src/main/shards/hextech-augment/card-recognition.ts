import type { OcrFrame, OcrWord, RecognizedAugment } from '@shared/types/hextech-augment'

export interface AugmentName {
  id: number
  name: string
  augmentNameId?: string
}

interface TitleLine {
  words: OcrWord[]
  text: string
  x: number
  y: number
  width: number
  height: number
}

interface TitleMatch extends RecognizedAugment {
  score: number
}

type CardSlot = NonNullable<RecognizedAugment['slot']>
type CardLayout = { count: 3 } | { count: 4; spacing: number }
type PositionedLayout = { layout: CardLayout; slots: CardSlot[] }

export function normalizeAugmentName(name: string) {
  return name
    .normalize('NFKC')
    .normalize('NFD')
    .replace(/[\s\p{P}\p{S}\p{M}]/gu, '')
    .toLocaleLowerCase()
}

function shapeName(name: string) {
  const normalized = normalizeAugmentName(name)
  if (/\p{Script=Han}/u.test(normalized)) return normalized
  return normalized.replace(/[l1j]/g, 'i').replace(/0/g, 'o').replace(/5/g, 's')
}

function similarity(first: string, second: string) {
  const left = [...first]
  const right = [...second]
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let row = 1; row <= left.length; row++) {
    const current = [row]
    for (let column = 1; column <= right.length; column++) {
      current.push(
        Math.min(
          current[column - 1] + 1,
          previous[column] + 1,
          previous[column - 1] + Number(left[row - 1] !== right[column - 1])
        )
      )
    }
    previous = current
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length)
}

function matchName(
  text: string,
  dictionary: Map<string, AugmentName | null>,
  relaxed = false,
  excluded = new Set<number>()
): { name: AugmentName; score: number } | null {
  const normalized = shapeName(text)
  if (normalized.length < 2) return null
  if (dictionary.has(normalized)) {
    const name = dictionary.get(normalized)
    return name && !excluded.has(name.id) ? { name, score: 1 } : null
  }
  const matches = new Map<number, { name: AugmentName; score: number; threshold: number }>()
  let ambiguousScore = 0
  for (const [alias, name] of dictionary) {
    if (name && excluded.has(name.id)) continue
    const length = Math.max([...alias].length, [...normalized].length)
    if (Math.abs([...alias].length - [...normalized].length) / length > (relaxed ? 0.5 : 0.35))
      continue
    const score = similarity(normalized, alias)
    if (!name) {
      ambiguousScore = Math.max(ambiguousScore, score)
      continue
    }
    const threshold = relaxed ? 0.6 : alias.length < 7 ? 0.9 : alias.length < 15 ? 0.78 : 0.72
    if (score > (matches.get(name.id)?.score ?? 0)) matches.set(name.id, { name, score, threshold })
  }
  const ordered = [...matches.values()].sort((first, second) => second.score - first.score)
  const best = ordered[0]
  const runnerUp = Math.max(ordered[1]?.score ?? 0, ambiguousScore)
  return best && best.score >= best.threshold && best.score - runnerUp >= 0.08 ? best : null
}

function titleLine(words: OcrWord[]): TitleLine {
  const x = Math.min(...words.map((word) => word.x))
  const y = Math.min(...words.map((word) => word.y))
  return {
    words,
    text: words.map((word) => word.text).join(''),
    x,
    y,
    width: Math.max(...words.map((word) => word.x + word.width)) - x,
    height: Math.max(...words.map((word) => word.y + word.height)) - y
  }
}

function sameRow(first: TitleLine | RecognizedAugment, second: TitleLine | RecognizedAugment) {
  return (
    Math.abs(first.y + first.height / 2 - second.y - second.height / 2) <=
    Math.max(first.height, second.height)
  )
}

function validThreeColumns(cards: RecognizedAugment[], width: number) {
  if (cards.length < 2 || cards.length > 3) return false
  const centers = cards.map((card) => card.x + card.width / 2)
  const gaps = centers.slice(1).map((center, index) => center - centers[index])
  return Math.min(...gaps) >= width * 0.09 && Math.max(...gaps) / Math.min(...gaps) <= 1.5
}

function centerX(card: RecognizedAugment | TitleLine) {
  return card.x + card.width / 2
}

const FOUR_SLOTS = [0, 1, 2, 3] as const

function matchFourColumns(
  cards: TitleMatch[],
  width: number,
  previous?: CardLayout
): PositionedLayout | null {
  const offsets = cards.map((card) => centerX(card) - width / 2)
  if (cards.length === 2 && previous?.count === 4) {
    const slots = offsets.map((offset) =>
      FOUR_SLOTS.find((slot) => Math.abs(offset / previous.spacing - (slot - 1.5)) <= 0.2)
    )
    if (slots[0] !== undefined && slots[1] !== undefined && slots[0] < slots[1]) {
      return { layout: previous, slots: [slots[0], slots[1]] }
    }
  }
  // Fit equally spaced slots around the game window center. With three readable
  // titles, try each possible missing slot before treating it as a three-card row.
  const candidates =
    cards.length === 4
      ? [[...FOUR_SLOTS]]
      : cards.length === 3
        ? FOUR_SLOTS.map((missing) => FOUR_SLOTS.filter((slot) => slot !== missing))
        : []
  const layouts = candidates.flatMap((slots) => {
    const steps = slots.map((slot) => slot - 1.5)
    const spacing =
      offsets.reduce((sum, offset, index) => sum + offset * steps[index], 0) /
      steps.reduce((sum, step) => sum + step ** 2, 0)
    if (spacing < width * 0.09 || spacing > width * 0.31) return []
    if (offsets.some((offset, index) => Math.abs(offset - spacing * steps[index]) > spacing * 0.2))
      return []
    return [{ layout: { count: 4, spacing } as const, slots }]
  })
  return layouts.length === 1 ? layouts[0] : null
}

function positionCards(
  cards: TitleMatch[],
  width: number,
  previous?: CardLayout
): PositionedLayout | null {
  if (new Set(cards.map((card) => card.id)).size !== cards.length) return null
  const four = matchFourColumns(cards, width, previous)
  if (four) return four
  if (!validThreeColumns(cards, width)) return null
  let slots: CardSlot[] = [0, 1, 2]
  if (cards.length === 2) {
    slots = [0, 2]
    const centers = cards.map(centerX)
    const distances = centers.map((center) => Math.abs(center - width / 2))
    const nearest = distances[0] < distances[1] ? 0 : 1
    if (distances[nearest] <= (centers[1] - centers[0]) * 0.35) {
      slots = nearest === 0 ? [1, 2] : [0, 1]
    }
  }
  return { layout: { count: 3 }, slots }
}

/** Identifies a card row and maps its readable titles to their visible slots. */
export function recognizeAugmentOffer(
  frame: OcrFrame,
  names: AugmentName[],
  previous?: CardLayout
): { layout: CardLayout; cards: RecognizedAugment[] } | null {
  const aliases = new Map<string, { name: AugmentName | null; priority: number }>()
  for (const name of names) {
    const normalized = shapeName(name.name)
    if (normalized.length < 2) continue
    const priority = name.augmentNameId?.startsWith('ARAM_') ? 1 : 0
    const previous = aliases.get(normalized)
    if (!previous || priority > previous.priority) {
      aliases.set(normalized, { name, priority })
    } else if (priority === previous.priority && previous.name?.id !== name.id) {
      aliases.set(normalized, { name: null, priority })
    }
  }
  const dictionary = new Map([...aliases].map(([alias, entry]) => [alias, entry.name]))
  const rows: TitleLine[] = []
  for (const line of frame.lines) {
    let words: OcrWord[] = []
    for (const word of [...line.words].sort((first, second) => first.x - second.x)) {
      const previous = words.at(-1)
      if (previous && word.x - previous.x - previous.width > frame.window.width * 0.03) {
        rows.push(titleLine(words))
        words = []
      }
      words.push(word)
    }
    if (words.length) rows.push(titleLine(words))
  }
  const candidates = rows.filter(
    (row) =>
      row.y >= frame.window.height * 0.3 &&
      row.y + row.height <= frame.window.height * 0.54 &&
      row.height >= frame.window.height * 0.01 &&
      row.width <= frame.window.width * 0.3
  )
  const joined: TitleLine[] = []
  for (const row of candidates) {
    const next = candidates
      .filter(
        (candidate) =>
          candidate.y >= row.y + row.height * 0.8 &&
          Math.abs(candidate.x + candidate.width / 2 - row.x - row.width / 2) <=
            Math.max(candidate.height, row.height)
      )
      .sort((first, second) => first.y - second.y)[0]
    if (
      next &&
      next.y - row.y - row.height <= Math.max(row.height, next.height) * 0.5 &&
      Math.max(row.height, next.height) <= Math.min(row.height, next.height) * 1.5
    )
      joined.push(titleLine([...row.words, ...next.words]))
  }
  candidates.push(...joined)
  const matches: TitleMatch[] = []
  for (const line of candidates) {
    const match = matchName(line.text, dictionary)
    if (match) matches.push({ ...match.name, ...line, score: match.score })
  }
  const groups = new Map<string, PositionedLayout & { cards: TitleMatch[] }>()
  for (const anchor of matches) {
    const row = matches
      .filter((match) => sameRow(match, anchor))
      .sort((first, second) => centerX(first) - centerX(second) || second.score - first.score)
    const cards: TitleMatch[] = []
    for (const match of row) {
      const previous = cards.at(-1)
      if (
        previous &&
        Math.abs(match.x + match.width / 2 - previous.x - previous.width / 2) <
          frame.window.width * 0.08
      ) {
        if (match.score > previous.score) cards[cards.length - 1] = match
      } else cards.push(match)
    }
    const width = frame.window.width
    let positioned = positionCards(cards, width, previous)
    if (!positioned) continue
    const count = positioned.layout.count
    if (cards.length < count) {
      const excluded = new Set(cards.map((card) => card.id))
      const remaining = candidates
        .filter((line) =>
          cards.every(
            (card) => sameRow(card, line) && Math.abs(centerX(card) - centerX(line)) >= width * 0.09
          )
        )
        .flatMap((line) => {
          const match = matchName(line.text, dictionary, true, excluded)
          if (!match) return []
          const complete = [...cards, { ...match.name, ...line, score: match.score }].sort(
            (first, second) => centerX(first) - centerX(second)
          )
          const layout = positionCards(complete, width, previous)
          return layout?.layout.count === count
            ? [{ id: match.name.id, score: match.score, complete, layout }]
            : []
        })
        .sort((first, second) => second.score - first.score)
      const missing = remaining[0]
      const competing = remaining.find((entry) => entry.id !== missing?.id)
      if (missing && (!competing || missing.score - competing.score >= 0.08)) {
        cards.splice(0, cards.length, ...missing.complete)
        positioned = missing.layout
      }
    }
    const key = cards.map((card) => `${card.id}:${Math.round(card.y / 10)}`).join('|')
    groups.set(key, { ...positioned, cards })
  }
  const score = (group: { cards: TitleMatch[] }) =>
    group.cards.reduce((total, card) => total + card.score, 0)
  const ordered = [...groups.values()].sort(
    (first, second) => second.cards.length - first.cards.length || score(second) - score(first)
  )
  const [best, next] = ordered
  if (
    !best ||
    (next?.cards.length === best.cards.length && Math.abs(score(best) - score(next)) < 0.08)
  )
    return null
  return {
    layout: best.layout,
    cards: best.cards.map((card, index) => ({
      id: card.id,
      name: card.name,
      x: card.x,
      y: card.y,
      width: card.width,
      height: card.height,
      slot: best.slots[index]
    }))
  }
}
