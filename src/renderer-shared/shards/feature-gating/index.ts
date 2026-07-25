import { Dep, Shard } from '@shared/akari-shard'
import { FeatureGateEvaluator, isFeatureGateEnabled } from '@shared/shards/feature-gating'

import { AkariApiRenderer } from '../akari-api'
import { useAkariApiStore } from '../akari-api/store'
import { AppCommonRenderer } from '../app-common'
import { useAppCommonStore } from '../app-common/store'
import { useSgpStore } from '../sgp/store'

@Shard(FeatureGatingRenderer.id)
export class FeatureGatingRenderer {
  static readonly id = 'feature-gating-renderer'

  private readonly _evaluator = new FeatureGateEvaluator()

  constructor(
    @Dep(AkariApiRenderer) _akariApi: AkariApiRenderer,
    @Dep(AppCommonRenderer) _appCommon: AppCommonRenderer
  ) {}

  isEnabled(key: string, defaultValue: boolean) {
    const akariApi = useAkariApiStore()
    const appCommon = useAppCommonStore()
    const sgp = useSgpStore()

    const evaluation = this._evaluator.evaluate(akariApi.featureGates, {
      platform: appCommon.platform,
      version: appCommon.version,
      sgpServerId: sgp.availability.sgpServerId
    })

    return isFeatureGateEnabled(key, defaultValue, evaluation)
  }
}
