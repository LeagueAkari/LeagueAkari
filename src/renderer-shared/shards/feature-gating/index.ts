import { Dep, Shard } from '@shared/akari-shard'
import {
  type FeatureGateDevOverride,
  FeatureGateEvaluator,
  type FeatureGateServerStatus
} from '@shared/shards/feature-gating'

import { AkariApiRenderer } from '../akari-api'
import { useAkariApiStore } from '../akari-api/store'
import { AppCommonRenderer } from '../app-common'
import { useAppCommonStore } from '../app-common/store'
import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useSgpStore } from '../sgp/store'
import { FEATURE_GATING_MAIN_NAMESPACE, FEATURE_GATING_RENDERER_NAMESPACE } from './context'
import { useFeatureGatingStore } from './store'

@Shard(FeatureGatingRenderer.id)
export class FeatureGatingRenderer {
  static readonly id = FEATURE_GATING_RENDERER_NAMESPACE
  static readonly mainId = FEATURE_GATING_MAIN_NAMESPACE

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
        FEATURE_GATING_MAIN_NAMESPACE,
        'settings',
        useFeatureGatingStore()
      )
    }
  }

  isEnabled(key: string, defaultValue: boolean) {
    return this.getEvaluation(key, defaultValue).enabled
  }

  getEvaluation(key: string, defaultValue: boolean) {
    const akariApi = useAkariApiStore()
    const featureGating = useFeatureGatingStore()

    this._evaluator.evaluate(
      akariApi.featureGates,
      this._getContext(),
      import.meta.env.DEV ? featureGating.devOverrides : undefined
    )

    return this._evaluator.getEvaluation(key, defaultValue)
  }

  getServerStatus(key: string): FeatureGateServerStatus {
    const snapshot = useAkariApiStore().featureGates
    this._serverEvaluator.evaluate(snapshot, this._getContext())
    const evaluation = this._serverEvaluator.getEvaluation(key, false)

    if (evaluation.snapshotStatus === 'unavailable') {
      return 'snapshot-unavailable'
    }

    if (!evaluation.configured) {
      return 'not-configured'
    }

    return evaluation.enabled ? 'enabled' : 'rule-not-matched'
  }

  setDevOverride(key: string, value: FeatureGateDevOverride | null, previousKey?: string) {
    if (!import.meta.env.DEV) {
      return Promise.reject(
        new Error('Feature gate development overrides are unavailable outside development mode')
      )
    }

    return this._ipc.call(
      FEATURE_GATING_MAIN_NAMESPACE,
      'setDevOverride',
      key,
      value,
      previousKey
    ) as Promise<{
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
