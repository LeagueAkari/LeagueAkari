import type { OcrFrame } from '@shared/types/hextech-augment'
import { describe, expect, it } from 'vitest'

import { recognizeAugmentCards } from './card-recognition'

const names = [
  { id: 1, name: '双重打击' },
  { id: 2, name: '针插垫' },
  { id: 3, name: '面包和黄油' }
]
function frame(): OcrFrame {
  return {
    type: 'frame',
    capturedAt: Date.now(),
    elapsedMs: 110,
    window: { id: 'game', x: -1920, y: 0, width: 1600, height: 900 },
    lines: names.map((name, slot) => ({
      words: [...name.name].map((text, index) => ({
        text,
        x: 180 + slot * 480 + index * 30,
        y: 330,
        width: 30,
        height: 40
      }))
    }))
  }
}

describe('three augment card recognition', () => {
  it('joins Chinese OCR tokens, returns three distinct slots, and keeps game coordinates', () => {
    const result = recognizeAugmentCards(frame(), names)
    expect(result.map((card) => card.id)).toEqual([1, 2, 3])
    expect(result[0]).toMatchObject({ x: 180, y: 330, width: 120 })
  })

  it.each([
    { name: '面包和黄油', first: '面包和', second: '黄油' },
    { name: 'Quest: Three Sacred Treasures', first: 'Quest: Three', second: 'Sacred Treasures' }
  ])('recognizes an aligned two-line title: $name', ({ name, first, second }) => {
    const input = frame()
    input.lines.splice(
      2,
      1,
      { words: [{ text: first, x: 1110, y: 310, width: 180, height: 30 }] },
      { words: [{ text: second, x: 1140, y: 348, width: 120, height: 30 }] }
    )
    const result = recognizeAugmentCards(input, [...names.slice(0, 2), { id: 3, name }])
    expect(result.map((card) => card.id)).toEqual([1, 2, 3])
    expect(result[2]).toMatchObject({ x: 1110, y: 310, width: 180, height: 68 })
  })

  it.each([
    { label: 'another card', x: 1440, y: 348, height: 30 },
    { label: 'separated text', x: 1140, y: 420, height: 30 },
    { label: 'smaller body text', x: 1140, y: 348, height: 16 }
  ])('keeps ambiguous fragments unresolved with $label', ({ x, y, height }) => {
    const input = frame()
    input.lines.splice(
      2,
      1,
      { words: [{ text: '面包和', x: 1110, y: 310, width: 180, height: 30 }] },
      { words: [{ text: '黄油', x, y, width: 120, height }] }
    )
    const result = recognizeAugmentCards(input, [...names, { id: 4, name: '面包和奶油' }])
    expect(result.map(({ id, slot }) => ({ id, slot }))).toEqual([
      { id: 1, slot: 0 },
      { id: 2, slot: 1 }
    ])
  })

  it('rejects fragments separated by an intervening line in the same card', () => {
    const input = frame()
    input.lines.splice(
      2,
      1,
      { words: [{ text: '面包和', x: 1110, y: 310, width: 180, height: 30 }] },
      { words: [{ text: '伤害', x: 1170, y: 342, width: 60, height: 10 }] },
      { words: [{ text: '黄油', x: 1140, y: 348, width: 120, height: 30 }] }
    )
    expect(
      recognizeAugmentCards(input, [...names, { id: 4, name: '面包和奶油' }]).map((card) => card.id)
    ).toEqual([1, 2])
  })

  it('recovers a dropped character with two confirmed titles in the same row', () => {
    const input = frame()
    input.lines[2].words.splice(2, 1)
    expect(recognizeAugmentCards(input, names).map((card) => card.id)).toEqual([1, 2, 3])
  })

  it('prefers Mayhem IDs over same-name Arena entries while retaining shared augments', () => {
    const mixed = [
      { ...names[0], augmentNameId: 'ARAM_DoubleStrike' },
      { id: 99, name: names[0].name, augmentNameId: 'DoubleStrike' },
      names[1],
      names[2]
    ]
    expect(recognizeAugmentCards(frame(), mixed).map((card) => card.id)).toEqual([1, 2, 3])
    expect(recognizeAugmentCards(frame(), mixed.reverse()).map((card) => card.id)).toEqual([
      1, 2, 3
    ])
  })

  it('recognizes the real 4K selection despite an Arena name collision', () => {
    const input: OcrFrame = {
      type: 'frame',
      capturedAt: Date.now(),
      elapsedMs: 354,
      window: { id: 'game', x: 0, y: 0, width: 3840, height: 2160 },
      lines: [
        { words: [{ text: '狙神飞星', x: 1100, y: 868, width: 168, height: 42 }] },
        { words: [{ text: '夺金', x: 1878, y: 868, width: 84, height: 40 }] },
        { words: [{ text: '老练狙神', x: 2572, y: 868, width: 168, height: 42 }] }
      ]
    }
    expect(
      recognizeAugmentCards(input, [
        { id: 2103, name: '狙神飞星', augmentNameId: 'ARAM_BangBang' },
        { id: 1335, name: '夺金', augmentNameId: 'Goldrend' },
        { id: 1113, name: '老练狙神', augmentNameId: 'ARAM_SkilledSniper' },
        { id: 113, name: '老练狙神', augmentNameId: 'SkilledSniper' }
      ]).map((card) => card.id)
    ).toEqual([2103, 1335, 1113])
  })

  it('rejects dictionary names with ambiguous IDs', () => {
    expect(
      recognizeAugmentCards(frame(), [...names, { id: 9, name: names[1].name }]).map(
        ({ id, slot }) => ({ id, slot })
      )
    ).toEqual([
      { id: 1, slot: 0 },
      { id: 3, slot: 2 }
    ])
  })

  it('rejects scoreboard-like vertical names and unevenly spaced incidental matches', () => {
    const input = frame()
    input.lines.forEach((line, slot) =>
      line.words.forEach((word) => {
        word.y += slot * 70
      })
    )
    expect(recognizeAugmentCards(input, names)).toEqual([])
    const uneven = frame()
    uneven.lines[2].words.forEach((word) => {
      word.x -= 300
    })
    expect(recognizeAugmentCards(uneven, names)).toEqual([])
  })

  it('rejects duplicate visible groups rather than picking a potentially captured overlay', () => {
    const input = frame()
    input.lines.push(
      ...input.lines.map((line) => ({
        words: line.words.map((word) => ({ ...word, y: word.y + 80 }))
      }))
    )
    expect(recognizeAugmentCards(input, names)).toEqual([])
  })

  it('replaces a rerolled card instead of retaining its previous ID', () => {
    const input = frame()
    const updated = [...names, { id: 4, name: '珠光护手' }]
    input.lines[1].words = [{ text: '珠光护手', x: 660, y: 330, width: 120, height: 40 }]
    expect(recognizeAugmentCards(input, updated).map((card) => card.id)).toEqual([1, 4, 3])
  })

  it('splits a merged OCR row into the three card columns', () => {
    const input = frame()
    input.lines = [{ words: input.lines.flatMap((line) => line.words) }]
    expect(recognizeAugmentCards(input, names).map((card) => card.id)).toEqual([1, 2, 3])
  })

  it('normalizes Latin OCR shapes and recovers a long title typo', () => {
    const input = frame()
    input.lines[0].words = [{ text: 'Lightn1ng Str1kes', x: 180, y: 330, width: 250, height: 40 }]
    input.lines[2].words = [
      { text: 'Quest Three Sacred Treasvres', x: 1110, y: 330, width: 280, height: 40 }
    ]
    expect(
      recognizeAugmentCards(input, [
        { id: 1, name: 'Lightning Strikes' },
        names[1],
        { id: 3, name: 'Quest: Three Sacred Treasures' }
      ]).map((card) => card.id)
    ).toEqual([1, 2, 3])
  })

  it('requires two confirmed columns before accepting a relaxed title match', () => {
    const input = frame()
    input.lines.splice(0, 2)
    input.lines[0].words.splice(2, 1)
    expect(recognizeAugmentCards(input, names)).toEqual([])
  })
})
