import { Dep, Shard } from '@shared/akari-shard'
import {
  type FeatureGateDevOverride,
  FeatureGateEvaluator,
  type FeatureGateServerStatus,
  isFeatureGateEnabled
} from '@shared/shards/feature-gating'

import { AkariApiRenderer } from '../akari-api'
import { useAkariApiStore } from '../akari-api/store'
import { AppCommonRenderer } from '../app-common'
import { useAppCommonStore } from '../app-common/store'
import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useSgpStore } from '../sgp/store'
import { useFeatureGatingStore } from './store'

@Shard(FeatureGatingRenderer.id)
export class FeatureGatingRenderer {
  static readonly id = 'feature-gating-renderer'
  static readonly mainId = 'feature-gating-main'

  private readonly _evaluator = new FeatureGateEvaluator()
  private readonly _serverEvaluator = new FeatureGateEvaluator()

  constructor(
    @Dep(AkariApiRenderer) _akariApi: AkariApiRenderer,
    @Dep(AppCommonRenderer) _appCommon: AppCommonRenderer,
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer)
    private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer
  ) {}

  async onInit() {
    if (import.meta.env.DEV) {
      await this._piniaMobxUtils.sync(
        FeatureGatingRenderer.mainId,
        'settings',
        useFeatureGatingStore()
      )
    }
  }

  isEnabled(key: string, defaultValue: boolean) {
    const akariApi = useAkariApiStore()
    const featureGating = useFeatureGatingStore()

    const evaluation = this._evaluator.evaluate(
      akariApi.featureGates,
      this._getContext(),
      import.meta.env.DEV ? featureGating.devOverrides : undefined
    )

    return isFeatureGateEnabled(key, defaultValue, evaluation)
  }

  getServerStatus(key: string): FeatureGateServerStatus {
    const snapshot = useAkariApiStore().featureGates
    if (!snapshot) return 'snapshot-unavailable'
    if (!Object.hasOwn(snapshot.gates, key)) return 'not-configured'

    const evaluation = this._serverEvaluator.evaluate(snapshot, this._getContext())
    return isFeatureGateEnabled(key, false, evaluation) ? 'enabled' : 'rule-not-matched'
  }

  setDevOverride(key: string, value: FeatureGateDevOverride | null) {
    if (!import.meta.env.DEV) {
      return Promise.reject(
        new Error('Feature gate development overrides are unavailable outside development mode')
      )
    }

    return this._ipc.call(FeatureGatingRenderer.mainId, 'setDevOverride', key, value) as Promise<{
      key: string
      value: FeatureGateDevOverride | null
    }>
  }

  private _getContext() {
    const appCommon = useAppCommonStore()
    const sgp = useSgpStore()
    return {
      platform: appCommon.platform,
      version: appCommon.version,
      sgpServerId: sgp.availability.sgpServerId
    }
  }
}
