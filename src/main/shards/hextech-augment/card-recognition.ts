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

function validColumns(cards: RecognizedAugment[], width: number) {
  if (cards.length < 2 || cards.length > 3) return false
  const centers = cards.map((card) => card.x + card.width / 2)
  const gaps = centers.slice(1).map((center, index) => center - centers[index])
  return Math.min(...gaps) >= width * 0.09 && Math.max(...gaps) / Math.min(...gaps) <= 1.5
}

/** Matches title text within the three card columns and preserves incomplete readings. */
export function recognizeAugmentCards(frame: OcrFrame, names: AugmentName[]): RecognizedAugment[] {
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
      if (previous && word.x - previous.x - previous.width > frame.window.width * 0.06) {
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
  const groups = new Map<string, TitleMatch[]>()
  for (const anchor of matches) {
    const row = matches
      .filter((match) => sameRow(match, anchor))
      .sort((first, second) => first.x - second.x || second.score - first.score)
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
    if (!validColumns(cards, frame.window.width)) continue
    if (new Set(cards.map((card) => card.id)).size !== cards.length) continue
    if (cards.length === 2) {
      const excluded = new Set(cards.map((card) => card.id))
      const remaining = candidates
        .filter(
          (line) =>
            cards.every((card) => sameRow(card, line)) &&
            cards.every(
              (card) =>
                Math.abs(card.x + card.width / 2 - line.x - line.width / 2) >=
                frame.window.width * 0.09
            )
        )
        .map((line) => ({ line, match: matchName(line.text, dictionary, true, excluded) }))
        .filter((entry) => entry.match !== null)
        .sort((first, second) => second.match!.score - first.match!.score)
      const third = remaining[0]
      const competing = remaining.find((entry) => entry.match?.name.id !== third?.match?.name.id)
      if (
        third?.match &&
        (!competing?.match || third.match.score - competing.match.score >= 0.08)
      ) {
        const complete = [
          ...cards,
          { ...third.match.name, ...third.line, score: third.match.score }
        ].sort((first, second) => first.x - second.x)
        if (validColumns(complete, frame.window.width)) cards.splice(0, cards.length, ...complete)
      }
    }
    const key = cards.map((card) => `${card.id}:${Math.round(card.y / 10)}`).join('|')
    groups.set(key, cards)
  }
  const ordered = [...groups.values()].sort(
    (first, second) =>
      second.length - first.length ||
      second.reduce((total, card) => total + card.score, 0) -
        first.reduce((total, card) => total + card.score, 0)
  )
  const best = ordered[0]
  if (!best) return []
  const next = ordered[1]
  if (
    next?.length === best.length &&
    Math.abs(
      best.reduce((total, card) => total + card.score, 0) -
        next.reduce((total, card) => total + card.score, 0)
    ) < 0.08
  )
    return []
  let slots: (0 | 1 | 2)[] = [0, 1, 2]
  if (best.length === 2) {
    slots = [0, 2]
    const centers = best.map((card) => card.x + card.width / 2)
    const distances = centers.map((center) => Math.abs(center - frame.window.width / 2))
    const nearest = distances[0] < distances[1] ? 0 : 1
    if (distances[nearest] <= (centers[1] - centers[0]) * 0.35) {
      slots = nearest === 0 ? [1, 2] : [0, 1]
    }
  }
  return best.map((card, index) => ({
    id: card.id,
    name: card.name,
    x: card.x,
    y: card.y,
    width: card.width,
    height: card.height,
    slot: slots[index]
  }))
}
