import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AKARI_NAVIGATION_RENDERER_NAMESPACE } from './context'
import { AkariNavigationController } from './navigation-controller'
import type { AkariNavigationRuntime } from './useAkariNavigation'

@Shard(AkariNavigationRenderer.id)
export class AkariNavigationRenderer implements IAkariShardInitDispose {
  static id = AKARI_NAVIGATION_RENDERER_NAMESPACE

  private readonly _controller: AkariNavigationController

  constructor(@Dep(LoggerRenderer) logger: LoggerRenderer) {
    this._controller = new AkariNavigationController({
      namespace: AkariNavigationRenderer.id,
      logger
    })
  }

  get runtime(): AkariNavigationRuntime {
    return this._controller
  }

  async onDispose() {
    this._controller.dispose()
  }
}

export * from './context'
export * from './useAkariNavigation'
export { AkariNavigationController } from './navigation-controller'
