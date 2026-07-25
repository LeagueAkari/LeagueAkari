import { Shard, SharedGlobalShard } from '@shared/akari-shard'
import { FeatureGateEvaluator, isFeatureGateEnabled } from '@shared/shards/feature-gating'
import { getSgpServerId } from '@shared/utils/sgp'

import { AkariApiMain } from '../akari-api'
import { LeagueClientMain } from '../league-client'

@Shard(FeatureGatingMain.id)
export class FeatureGatingMain {
  static readonly id = 'feature-gating-main'

  private readonly _evaluator = new FeatureGateEvaluator()

  constructor(
    private readonly _shared: SharedGlobalShard,
    private readonly _akariApi: AkariApiMain,
    private readonly _leagueClient: LeagueClientMain
  ) {}

  isEnabled(key: string, defaultValue: boolean) {
    const auth = this._leagueClient.state.auth
    const evaluation = this._evaluator.evaluate(this._akariApi.state.featureGates, {
      platform: this._shared.global.platform,
      version: this._shared.global.version,
      sgpServerId: auth ? getSgpServerId(auth.region, auth.rsoPlatformId) : ''
    })

    return isFeatureGateEnabled(key, defaultValue, evaluation)
  }
}
