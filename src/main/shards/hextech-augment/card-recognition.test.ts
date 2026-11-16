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

  it('never guesses a rating for a dropped or misread character', () => {
    const input = frame()
    input.lines[2].words.splice(2, 1)
    expect(recognizeAugmentCards(input, names)).toEqual([])
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
    expect(recognizeAugmentCards(frame(), [...names, { id: 9, name: names[1].name }])).toEqual([])
  })

  it('rejects scoreboard-like vertical names and unevenly spaced incidental matches', () => {
    const input = frame()
    input.lines[1].words.forEach((word) => {
      word.y += 70
    })
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
        words: line.words.map((word) => ({ ...word, y: word.y - 80 }))
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
})
