// @ts-nocheck
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { Config, Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { useGuideStore } from './store'
import type { GuideRendererConfig } from './types'
import { LoggerRenderer } from '../logger'

@Shard(GuideRenderer.id)
export class GuideRenderer implements IAkariShardInitDispose {
  static id = 'guide-renderer'

  constructor(
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(LoggerRenderer) private readonly _logger: LoggerRenderer,
    @Config() private _config?: GuideRendererConfig
  ) {}

  private _processQueue() {
    const store = useGuideStore()
    if (store.activeGuideId !== null) return

    while (store.queue.length > 0) {
      const nextId = store.queue.shift()!

      if (nextId) {
        store.activeGuideId = nextId
        return
      }
    }
  }

  /**
   * 目前的设计是，点击一次就永久消失掉了
   */
  confirm(groupId: string, guideId: string) {
    // const store = useGuideStore()
    // store.queue = store.queue.filter((i) => i !== id)
    // this._processQueue()
    // this._setting.set(GuideRenderer.id, `confirmed:${id}`, true).catch((error) => {
    //   this._logger.warn(GuideRenderer.id, `Failed to save confirmed guide ${id}`, error)
    // })
  }

  /**
   * 将一个 guide 安排到队列中
   */
  register(groupId: string, guideId: string, order: number) {
    // TBD
  }

  /**
   * 将一个 guide 从队列中移除
   */
  unregister(groupId: string, guideId: string) {
    // TBD
  }

  async onInit() {
    const store = useGuideStore()

    if (this._config?.enabled) {
      store.isEnabled = true
    }
  }
}

export { useGuideStore } from './store'

export { useGuide } from './composables'
