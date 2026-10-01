import type { AkariFeatureGateSnapshot } from '@shared/shards/akari-api'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { watch } from 'vue'

import { FeatureGatingRenderer } from '.'
import { AkariApiRenderer } from '../akari-api'
import { useAkariApiStore } from '../akari-api/store'
import { AppCommonRenderer } from '../app-common'
import { useAppCommonStore } from '../app-common/store'
import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useSgpStore } from '../sgp/store'
import { useFeatureGatingStore } from './store'

vi.mock('i18next-vue', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

const snapshot = (gates: AkariFeatureGateSnapshot['gates']): AkariFeatureGateSnapshot => ({
  updatedAt: '2026-07-25T04:00:00.000Z',
  gates
})

describe('FeatureGatingRenderer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('can be observed from a Vue watch', () => {
    const akariApi = useAkariApiStore()
    const appCommon = useAppCommonStore()
    const featureGatingStore = useFeatureGatingStore()
    const sgp = useSgpStore()
    const featureGating = new FeatureGatingRenderer(
      {} as AkariApiRenderer,
      {} as AppCommonRenderer,
      {} as AkariIpcRenderer,
      {} as PiniaMobxUtilsRenderer
    )
    const values: boolean[] = []

    appCommon.platform = 'win32'
    appCommon.version = '1.5.0'
    sgp.availability = {
      ...sgp.availability,
      sgpServerId: 'NA1'
    }

    const stop = watch(
      () => featureGating.isEnabled('ongoing-game.deobfuscation', true),
      (enabled) => values.push(enabled),
      { immediate: true, flush: 'sync' }
    )

    akariApi.featureGates = snapshot({})
    akariApi.featureGates = snapshot({
      'ongoing-game.deobfuscation': {
        platforms: ['win32'],
        sgpServers: ['NA1']
      }
    })
    appCommon.platform = 'darwin'
    featureGatingStore.devOverrides = {
      'ongoing-game.deobfuscation': { mode: 'force-on' }
    }
    featureGatingStore.devOverrides = {}

    expect(values).toEqual([true, false, true, false, true, false])
    stop()
  })

  it('exposes structured evaluations through a Vue watch', () => {
    const akariApi = useAkariApiStore()
    const appCommon = useAppCommonStore()
    const featureGatingStore = useFeatureGatingStore()
    const featureGating = new FeatureGatingRenderer(
      {} as AkariApiRenderer,
      {} as AppCommonRenderer,
      {} as AkariIpcRenderer,
      {} as PiniaMobxUtilsRenderer
    )
    const values: string[] = []

    appCommon.platform = 'win32'
    appCommon.version = '1.5.0'
    const stop = watch(
      () => featureGating.getEvaluation('champion-data.opgg', false),
      (evaluation) => values.push(`${evaluation.decision}:${evaluation.enabled}`),
      { immediate: true, flush: 'sync' }
    )

    akariApi.featureGates = snapshot({})
    akariApi.featureGates = snapshot({ 'champion-data.opgg': {} })
    featureGatingStore.devOverrides = { 'champion-data.opgg': { mode: 'force-off' } }
    featureGatingStore.devOverrides = {
      'champion-data.opgg': { mode: 'force-off' },
      'unrelated.feature': { mode: 'force-on' }
    }

    expect(values).toEqual([
      'default-value:false',
      'not-configured:false',
      'rule-matched:true',
      'force-off:false'
    ])
    expect(featureGating.isEnabled('champion-data.opgg', false)).toBe(
      featureGating.getEvaluation('champion-data.opgg', false).enabled
    )
    stop()
  })

  it('reports the remote status independently from development overrides', () => {
    const akariApi = useAkariApiStore()
    const appCommon = useAppCommonStore()
    const featureGatingStore = useFeatureGatingStore()
    const featureGating = new FeatureGatingRenderer(
      {} as AkariApiRenderer,
      {} as AppCommonRenderer,
      {} as AkariIpcRenderer,
      {} as PiniaMobxUtilsRenderer
    )

    appCommon.platform = 'win32'
    featureGatingStore.devOverrides = { 'test.remote-gate': { mode: 'force-on' } }

    expect(featureGating.getServerStatus('test.remote-gate')).toBe('snapshot-unavailable')

    akariApi.featureGates = snapshot({
      'test.remote-gate': { platforms: ['darwin'] }
    })

    expect(featureGating.getServerStatus('test.remote-gate')).toBe('rule-not-matched')
    expect(featureGating.getServerStatus('test.unknown-gate')).toBe('not-configured')

    appCommon.platform = 'darwin'
    expect(featureGating.getServerStatus('test.remote-gate')).toBe('enabled')
  })
})
