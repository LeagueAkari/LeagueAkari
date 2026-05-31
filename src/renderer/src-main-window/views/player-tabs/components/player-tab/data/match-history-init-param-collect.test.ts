import { describe, expect, it } from 'vitest'

import {
  createInitParamCollectFilterState,
  createInitParamCollectSettings
} from './match-history-init-param-collect'

describe('createInitParamCollectFilterState', () => {
  it('creates a current-player champion filter state', () => {
    const state = createInitParamCollectFilterState({ collectByChampionId: 103 }, 'puuid-1')

    expect(state?.nodeMap['init-param-collect-player']).toMatchObject({
      type: 'player',
      args: [
        { kind: 'param', value: 'puuid-1' },
        { kind: 'node', value: 'init-param-collect-champion' }
      ]
    })
    expect(state?.nodeMap['init-param-collect-champion']).toMatchObject({
      type: 'isChampion',
      args: [{ kind: 'param', value: 103 }]
    })
  })

  it('creates a current-player position filter state', () => {
    const state = createInitParamCollectFilterState({ collectByPosition: 'JUNGLE' }, 'puuid-1')

    expect(state?.nodeMap['init-param-collect-player']).toMatchObject({
      type: 'player',
      args: [
        { kind: 'param', value: 'puuid-1' },
        { kind: 'node', value: 'init-param-collect-position' }
      ]
    })
    expect(state?.nodeMap['init-param-collect-position']).toMatchObject({
      type: 'isPosition',
      args: [{ kind: 'param', value: 'JUNGLE' }]
    })
  })

  it('combines champion and position filters under the current player', () => {
    const state = createInitParamCollectFilterState(
      { collectByChampionId: 64, collectByPosition: 'JUNGLE' },
      'puuid-1'
    )

    expect(state?.nodeMap['init-param-collect-player']).toMatchObject({
      type: 'player',
      args: [
        { kind: 'param', value: 'puuid-1' },
        { kind: 'node', value: 'init-param-collect-player-and' }
      ]
    })
    expect(state?.nodeMap['init-param-collect-player-and']).toMatchObject({
      type: 'and',
      args: [
        { kind: 'node', value: 'init-param-collect-champion' },
        { kind: 'node', value: 'init-param-collect-position' }
      ]
    })
  })

  it('creates default collection settings', () => {
    expect(createInitParamCollectSettings({ collectByChampionId: 103 })).toEqual({
      countPerIteration: 20,
      expectedCount: 20,
      maxIteration: 10
    })
  })

  it('creates collection settings from the expected count', () => {
    expect(
      createInitParamCollectSettings({
        collectByChampionId: 103,
        expectedCount: 80
      })
    ).toEqual({
      countPerIteration: 20,
      expectedCount: 80,
      maxIteration: 40
    })
  })

  it('caps init-param collection scans to 1000 matches', () => {
    expect(
      createInitParamCollectSettings({
        collectByChampionId: 103,
        expectedCount: 200
      })
    ).toEqual({
      countPerIteration: 20,
      expectedCount: 200,
      maxIteration: 50
    })
  })

  it('caps init-param collection target count to 1000 matches', () => {
    expect(
      createInitParamCollectSettings({
        collectByChampionId: 103,
        expectedCount: 2000
      })
    ).toEqual({
      countPerIteration: 20,
      expectedCount: 1000,
      maxIteration: 50
    })
  })
})
