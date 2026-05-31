import { describe, expect, it } from 'vitest'

import { hasInitParams, parseInitParamsFromQuery, serializeInitParamsToQuery } from './init-params'

describe('player tab init params', () => {
  describe('parseInitParamsFromQuery', () => {
    it('parses supported init params from route query values', () => {
      expect(
        parseInitParamsFromQuery({
          collectByChampionId: '103',
          collectByPosition: 'JUNGLE',
          expectedCount: '40'
        })
      ).toEqual({
        matchHistory: {
          collectByChampionId: 103,
          collectByPosition: 'JUNGLE',
          expectedCount: 40
        }
      })
    })

    it('uses the first value when Vue Router provides query arrays', () => {
      expect(
        parseInitParamsFromQuery({
          collectByChampionId: ['126', '64'],
          collectByPosition: ['TOP', 'JUNGLE']
        })
      ).toEqual({
        matchHistory: {
          collectByChampionId: 126,
          collectByPosition: 'TOP'
        }
      })
    })

    it('ignores unknown and invalid query values', () => {
      expect(
        parseInitParamsFromQuery({
          collectByChampionId: 'abc',
          collectByPosition: '',
          expectedCount: '20',
          unrelated: 'value'
        })
      ).toBeUndefined()
    })

    it('caps expected count values to the supported maximum', () => {
      expect(
        parseInitParamsFromQuery({
          collectByChampionId: '103',
          expectedCount: '1001'
        })
      ).toEqual({
        matchHistory: {
          collectByChampionId: 103,
          expectedCount: 1000
        }
      })
    })
  })

  describe('serializeInitParamsToQuery', () => {
    it('serializes grouped init params into the flat route query contract', () => {
      expect(
        serializeInitParamsToQuery({
          matchHistory: {
            collectByChampionId: 103,
            collectByPosition: 'JUNGLE',
            expectedCount: 40
          }
        })
      ).toEqual({
        collectByChampionId: '103',
        collectByPosition: 'JUNGLE',
        expectedCount: '40'
      })
    })

    it('serializes empty init params into an empty query', () => {
      expect(serializeInitParamsToQuery({})).toEqual({})
      expect(serializeInitParamsToQuery({ matchHistory: {} })).toEqual({})
    })
  })

  describe('hasInitParams', () => {
    it('recognizes grouped init params with payload', () => {
      expect(hasInitParams({ matchHistory: { collectByChampionId: 103 } })).toBe(true)
      expect(hasInitParams({ matchHistory: { collectByPosition: 'JUNGLE' } })).toBe(true)
    })

    it('rejects empty init params', () => {
      expect(hasInitParams(undefined)).toBe(false)
      expect(hasInitParams({})).toBe(false)
      expect(hasInitParams({ matchHistory: {} })).toBe(false)
      expect(hasInitParams({ matchHistory: { expectedCount: 40 } })).toBe(false)
    })
  })
})
