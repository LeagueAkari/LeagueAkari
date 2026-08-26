import type { SharedGlobalShard } from '@shared/akari-shard'
import type { AkariFeatureGateSnapshot } from '@shared/shards/akari-api'
import { reaction } from 'mobx'
import { describe, expect, it, vi } from 'vitest'

import { FeatureGatingMain } from '.'
import type { AkariApiMain } from '../akari-api'
import { AkariApiState } from '../akari-api/state'
import type { LeagueClientMain } from '../league-client'

vi.mock('../akari-api', () => ({ AkariApiMain: class AkariApiMain {} }))
vi.mock('../league-client', () => ({ LeagueClientMain: class LeagueClientMain {} }))

const snapshot = (gates: AkariFeatureGateSnapshot['gates']): AkariFeatureGateSnapshot => ({
  updatedAt: '2026-07-25T04:00:00.000Z',
  gates
})

describe('FeatureGatingMain', () => {
  it('can be observed from a MobX reaction', () => {
    const state = new AkariApiState()
    const featureGating = new FeatureGatingMain(
      {
        global: {
          platform: 'win32',
          version: '1.5.0'
        }
      } as unknown as SharedGlobalShard,
      { state } as unknown as AkariApiMain,
      { state: { auth: null } } as unknown as LeagueClientMain
    )
    const values: boolean[] = []
    const dispose = reaction(
      () => featureGating.isEnabled('ongoing-game.deobfuscation', true),
      (enabled) => values.push(enabled),
      { fireImmediately: true }
    )

    state.setFeatureGates(snapshot({}))
    state.setFeatureGates(snapshot({ 'ongoing-game.deobfuscation': {} }))

    expect(values).toEqual([true, false, true])
    dispose()
  })

  it('distinguishes an absent gate from a configured gate', () => {
    const state = new AkariApiState()
    const featureGating = new FeatureGatingMain(
      {
        global: { platform: 'win32', version: '1.5.0' }
      } as unknown as SharedGlobalShard,
      { state } as unknown as AkariApiMain,
      { state: { auth: null } } as unknown as LeagueClientMain
    )

    state.setFeatureGates(snapshot({ 'champion-data.source.opgg': {} }))

    expect(featureGating.hasConfiguredGate('champion-data.source.opgg')).toBe(true)
    expect(featureGating.hasConfiguredGate('champion-data.source.qq101')).toBe(false)
  })
})
