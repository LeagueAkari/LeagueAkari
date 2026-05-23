import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { Dep, Shard } from '@shared/akari-shard'

import { SELF_HOSTED_LCU_DATA_RENDERER_NAMESPACE } from './context'
import { watchFriendsUpdate } from './friends-watcher'
import { watchQueuesUpdate } from './queues-watcher'

/**
 * 有一些数据可以仅放在渲染进程托管
 *
 * 但是 FriendTools 里面的逻辑则暂时保持不变 (只要 works 就不要动)
 */
@Shard(SelfHostedLcuDataRenderer.id)
export class SelfHostedLcuDataRenderer {
  static id = SELF_HOSTED_LCU_DATA_RENDERER_NAMESPACE

  constructor(
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer
  ) {
    this._setupInAppScope.addSetupFn(() => watchFriendsUpdate())
    this._setupInAppScope.addSetupFn(() => watchQueuesUpdate())
  }
}
