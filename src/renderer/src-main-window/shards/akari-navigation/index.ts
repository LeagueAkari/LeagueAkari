import {
  type AkariNavigationOptions,
  type AkariNavigationPath,
  provideAkariNavigation
} from '@renderer-shared/composables/useAkariNavigation'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import {
  AKARI_NAVIGATION_DEFAULT_DEADLINE_MS,
  AKARI_NAVIGATION_RENDERER_NAMESPACE
} from './context'
import { AkariNavigationController } from './navigation-controller'
import {
  type SettingsNavigationTargetId,
  createSettingsNavigationPath,
  getSettingsNavigationTarget
} from './settings/registry'

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

  get rootOutlet() {
    return this._controller.rootOutlet
  }

  provideContext() {
    provideAkariNavigation(this._controller.context)
    return this._controller.context
  }

  navigate(path: AkariNavigationPath, options?: AkariNavigationOptions) {
    return this._controller.navigate(path, options)
  }

  async navigateToSetting(id: SettingsNavigationTargetId) {
    const deadlineAt = Date.now() + AKARI_NAVIGATION_DEFAULT_DEADLINE_MS
    let currentTarget = getSettingsNavigationTarget(id)

    if (!currentTarget) {
      throw new Error(`Unknown settings navigation target: ${id}`)
    }

    while (true) {
      const result = await this.navigate(createSettingsNavigationPath(currentTarget), {
        deadlineAt
      })

      if (result.status !== 'unavailable' || !currentTarget.fallbackId) {
        return result
      }

      const fallbackTarget = getSettingsNavigationTarget(currentTarget.fallbackId)
      if (!fallbackTarget) {
        throw new Error(`Unknown settings navigation fallback target: ${currentTarget.fallbackId}`)
      }
      currentTarget = fallbackTarget
    }
  }

  async onDispose() {
    this._controller.dispose()
  }
}

export * from './context'
export { AkariNavigationController } from './navigation-controller'
export * from './settings/registry'
