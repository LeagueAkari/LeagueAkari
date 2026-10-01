import type { SharedGlobalShard } from '@shared/akari-shard'
import type { AkariFeatureGateSnapshot } from '@shared/shards/akari-api'
import type { FeatureGateDevOverrides } from '@shared/shards/feature-gating'
import { reaction } from 'mobx'
import { describe, expect, it, vi } from 'vitest'

import { FeatureGatingMain } from '.'
import type { AkariApiMain } from '../akari-api'
import { AkariApiState } from '../akari-api/state'
import type { AkariIpcMain } from '../ipc'
import type { LeagueClientMain } from '../league-client'
import type { MobxUtilsMain } from '../mobx-utils'
import type { SettingFactoryMain } from '../setting-factory'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { FeatureGatingSettings } from './state'

vi.mock('@electron-toolkit/utils', () => ({ is: { dev: true } }))
vi.mock('../akari-api', () => ({ AkariApiMain: class AkariApiMain {} }))
vi.mock('../ipc', () => ({ AkariIpcMain: class AkariIpcMain {} }))
vi.mock('../league-client', () => ({ LeagueClientMain: class LeagueClientMain {} }))
vi.mock('../mobx-utils', () => ({ MobxUtilsMain: class MobxUtilsMain {} }))
vi.mock('../setting-factory', () => ({ SettingFactoryMain: class SettingFactoryMain {} }))

const snapshot = (gates: AkariFeatureGateSnapshot['gates']): AkariFeatureGateSnapshot => ({
  updatedAt: '2026-07-25T04:00:00.000Z',
  gates
})

function createFeatureGating(persistedOverrides: FeatureGateDevOverrides = {}) {
  const state = new AkariApiState()
  let registeredSettings: FeatureGatingSettings
  const settingService = {
    applyToState: vi.fn(async () => registeredSettings.setDevOverrides(persistedOverrides)),
    set: vi.fn(async (_key: string, value: FeatureGateDevOverrides) =>
      registeredSettings.setDevOverrides(value)
    )
  } as unknown as SetterSettingService<FeatureGatingSettings>
  const settingFactory = {
    register: vi.fn((_namespace: string, _schema: unknown, settings: FeatureGatingSettings) => {
      registeredSettings = settings

      return settingService
    })
  } as unknown as SettingFactoryMain
  const ipc = { onCall: vi.fn() } as unknown as AkariIpcMain
  const mobxUtils = { propSync: vi.fn() } as unknown as MobxUtilsMain
  const featureGating = new FeatureGatingMain(
    {
      global: {
        platform: 'win32',
        version: '1.5.0'
      }
    } as unknown as SharedGlobalShard,
    { state } as unknown as AkariApiMain,
    { state: { auth: null } } as unknown as LeagueClientMain,
    ipc,
    mobxUtils,
    settingFactory
  )

  return { featureGating, ipc, mobxUtils, settingService, state }
}

describe('FeatureGatingMain', () => {
  it('can be observed from a MobX reaction', () => {
    const { featureGating, state } = createFeatureGating()
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

  it('exposes structured evaluations through a MobX reaction', () => {
    const { featureGating, state } = createFeatureGating()
    const values: string[] = []
    const dispose = reaction(
      () => featureGating.getEvaluation('champion-data.opgg', false),
      (evaluation) => values.push(`${evaluation.decision}:${evaluation.enabled}`),
      { fireImmediately: true }
    )

    state.setFeatureGates(snapshot({}))
    state.setFeatureGates(snapshot({ 'champion-data.opgg': { minVersionInclusive: '2.0.0' } }))
    featureGating.settings.setDevOverrides({
      'champion-data.opgg': { mode: 'force-on' }
    })
    featureGating.settings.setDevOverrides({
      'champion-data.opgg': { mode: 'force-on' },
      'unrelated.feature': { mode: 'force-off' }
    })

    expect(values).toEqual([
      'default-value:false',
      'not-configured:false',
      'rule-not-matched:false',
      'force-on:true'
    ])
    expect(featureGating.isEnabled('champion-data.opgg', false)).toBe(
      featureGating.getEvaluation('champion-data.opgg', false).enabled
    )
    dispose()
  })

  it('distinguishes an absent gate from a configured gate', () => {
    const { featureGating, state } = createFeatureGating()

    state.setFeatureGates(snapshot({ 'champion-data.opgg': {} }))

    expect(featureGating.hasConfiguredGate('champion-data.opgg')).toBe(true)
    expect(featureGating.hasConfiguredGate('champion-data.qq101')).toBe(false)
  })

  it('merges persisted development overrides before consumers evaluate gates', async () => {
    const { featureGating, mobxUtils, settingService, state } = createFeatureGating({
      'champion-data.opgg': { mode: 'force-off' },
      'champion-data.qq101': { mode: 'force-on' }
    })
    state.setFeatureGates(snapshot({ 'champion-data.opgg': {} }))

    await featureGating.onInit()

    expect(settingService.applyToState).toHaveBeenCalledOnce()
    expect(mobxUtils.propSync).toHaveBeenCalledWith(
      FeatureGatingMain.id,
      'settings',
      featureGating.settings,
      'devOverrides'
    )
    expect(featureGating.isEnabled('champion-data.opgg', true)).toBe(false)
    expect(featureGating.isEnabled('champion-data.qq101', false)).toBe(true)
    expect(featureGating.hasConfiguredGate('champion-data.qq101')).toBe(true)
  })
})
