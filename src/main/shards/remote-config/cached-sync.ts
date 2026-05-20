import { IntervalTask } from '@main/utils/timer'
import dayjs from 'dayjs'

import { CACHED_RESOURCES, type CachedResource, type CachedResourceData } from './cached-resources'
import type { RemoteConfigMainContext } from './context'
import { hasReachedRemoteRateLimit } from './rate-limit'

export class RemoteConfigCachedSync {
  private readonly _tasks = new Map<string, IntervalTask>()

  constructor(
    private readonly _context: RemoteConfigMainContext,
    private readonly _resources = CACHED_RESOURCES
  ) {
    for (const resource of this._resources) {
      this._tasks.set(
        resource.id,
        new IntervalTask(() => this._updateFromRemoteAndSave(resource), {
          interval: resource.intervalMs
        })
      )
    }
  }

  async initFromLocal() {
    for (const resource of this._resources) {
      await this._initResourceFromLocal(resource)
    }
  }

  watch() {
    const { mobxUtils, settings } = this._context

    // 源切换时需要重新获取可缓存的远程配置。
    mobxUtils.reaction(
      () => settings.preferredSource,
      () => {
        this.startAllImmediately()
      },
      { fireImmediately: true }
    )
  }

  startAllImmediately() {
    for (const task of this._tasks.values()) {
      task.start({ runImmediately: true })
    }
  }

  private async _initResourceFromLocal<T extends CachedResourceData>(resource: CachedResource<T>) {
    const { logger, settingService, state } = this._context

    if (!(await settingService.jsonConfigFileExists(resource.cachePath))) {
      return
    }

    const rawJson = await settingService.readFromJsonConfigFile(resource.cachePath)
    const result = resource.schema.safeParse(rawJson)

    if (result.success) {
      resource.apply(state, result.data)
    } else {
      logger.warn(`Invalid ${resource.name} json`, result.error)
    }
  }

  private async _updateFromRemoteAndSave<T extends CachedResourceData>(
    resource: CachedResource<T>
  ) {
    const { logger, settingService, state } = this._context

    if (resource.getUpdating(state)) {
      return
    }

    resource.setUpdating(state, true)

    try {
      const remoteData = await resource.fetchRemote(this._context)
      const result = resource.schema.safeParse(remoteData)

      if (result.success) {
        if (result.data.lastUpdate > resource.getCurrentLastUpdate(state)) {
          resource.apply(state, result.data)
          await settingService.writeToJsonConfigFile(resource.cachePath, result.data)
          logger.info(
            `Updated ${resource.name} from remote`,
            dayjs(result.data.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
          )
        } else {
          logger.info(
            `${resource.name} is up to date`,
            dayjs(resource.getCurrentLastUpdate(state)).format('YYYY-MM-DD HH:mm:ss')
          )
        }
      } else {
        logger.warn(`Invalid ${resource.name} json`, result.error)
      }
    } catch (error) {
      if (hasReachedRemoteRateLimit(error, logger)) {
        return
      }

      logger.warn(`Update ${resource.name} from remote failed`, error)
    } finally {
      resource.setUpdating(state, false)
    }
  }
}
