import { describe, expect, it } from 'vitest'

import {
  SAVED_PLAYER_TAG_PHRASE_MAX_ITEMS,
  SAVED_PLAYER_TAG_PHRASE_MAX_LENGTH,
  createDefaultSavedPlayerTagPhrases,
  normalizeSavedPlayerTagPhrase,
  normalizeSavedPlayerTagPhrases
} from '.'

describe('saved player tag phrases', () => {
  it('starts without built-in phrases', () => {
    expect(createDefaultSavedPlayerTagPhrases()).toEqual([])
  })

  it('trims and limits an individual phrase to 100 characters', () => {
    expect(SAVED_PLAYER_TAG_PHRASE_MAX_LENGTH).toBe(100)
    expect(normalizeSavedPlayerTagPhrase(`  ${'文'.repeat(101)}  `)).toBe('文'.repeat(100))
  })

  it('filters empty and duplicate phrases and limits the item count', () => {
    const phrases = normalizeSavedPlayerTagPhrases([
      '',
      '  repeated  ',
      'repeated',
      ...Array.from(
        { length: SAVED_PLAYER_TAG_PHRASE_MAX_ITEMS + 1 },
        (_, index) => `phrase-${index}`
      )
    ])

    expect(phrases).toHaveLength(SAVED_PLAYER_TAG_PHRASE_MAX_ITEMS)
    expect(phrases[0]).toBe('repeated')
    expect(phrases.at(-1)).toBe(`phrase-${SAVED_PLAYER_TAG_PHRASE_MAX_ITEMS - 2}`)
  })

  it('falls back to an empty list for invalid persisted values', () => {
    expect(normalizeSavedPlayerTagPhrases(null)).toEqual([])
    expect(normalizeSavedPlayerTagPhrases('not-an-array')).toEqual([])
  })
})
