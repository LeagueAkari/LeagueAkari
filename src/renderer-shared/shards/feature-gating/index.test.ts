import type { AkariFeatureGateSnapshot } from '@shared/shards/akari-api'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { watch } from 'vue'

import { FeatureGatingRenderer } from '.'
import { AkariApiRenderer } from '../akari-api'
import { useAkariApiStore } from '../akari-api/store'
import { AppCommonRenderer } from '../app-common'
import { useAppCommonStore } from '../app-common/store'
import { useSgpStore } from '../sgp/store'

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
    const sgp = useSgpStore()
    const featureGating = new FeatureGatingRenderer({} as AkariApiRenderer, {} as AppCommonRenderer)
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

    expect(values).toEqual([true, false, true, false])
    stop()
  })
})
