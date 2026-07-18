import { IntervalTask } from '@main/utils/timer'
import type { AkariConfigMetadata } from '@shared/shards/akari-api'
import dayjs from 'dayjs'

import { AKARI_API_CACHED_RESOURCES, type CachedResource } from './cached-resources'
import type { AkariApiMainContext } from './context'

export class AkariApiConfigLoader {
  private readonly _tasks = new Map<string, IntervalTask>()

  constructor(
    private readonly _context: AkariApiMainContext,
    private readonly _resources = AKARI_API_CACHED_RESOURCES
  ) {
    for (const resource of this._resources) {
      this._tasks.set(
        resource.id,
        new IntervalTask(() => this._updateAndSave(resource), {
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
    for (const task of this._tasks.values()) {
      task.start({ runImmediately: true })
    }
  }

  dispose() {
    for (const task of this._tasks.values()) {
      task.cancel()
    }
  }

  private async _initResourceFromLocal<T extends AkariConfigMetadata>(resource: CachedResource<T>) {
    const { logger, settingService, state } = this._context

    if (!(await settingService.jsonConfigFileExists(resource.cachePath))) {
      return
    }

    let cached: unknown
    try {
      cached = await settingService.readFromJsonConfigFile(resource.cachePath)
    } catch (error) {
      logger.warn(`Invalid cached ${resource.name}`, error)
      await this._deleteCachedResource(resource)
      return
    }

    const result = resource.schema.safeParse(cached)

    if (!result.success) {
      logger.warn(`Invalid cached ${resource.name}`, result.error)
      await this._deleteCachedResource(resource)
      return
    }

    const cachedUpdatedAt = Date.parse(result.data.updatedAt)
    const currentUpdatedAt = Date.parse(resource.getCurrentUpdatedAt(state))

    if (cachedUpdatedAt < currentUpdatedAt) {
      logger.info(`Removed stale cached ${resource.name}`)
      await this._deleteCachedResource(resource)
      return
    }

    if (cachedUpdatedAt > currentUpdatedAt) {
      resource.apply(state, result.data)
    }
  }

  private async _deleteCachedResource<T extends AkariConfigMetadata>(resource: CachedResource<T>) {
    const { logger, settingService } = this._context

    try {
      await settingService.deleteJsonConfigFile(resource.cachePath)
    } catch (error) {
      logger.warn(`Failed to delete cached ${resource.name}`, error)
    }
  }

  private async _updateAndSave<T extends AkariConfigMetadata>(resource: CachedResource<T>) {
    const { api, logger, settingService, state } = this._context

    if (resource.getUpdating(state)) {
      return
    }

    resource.setUpdating(state, true)

    try {
      const response = await api.getConfig(resource.resource)
      const result = resource.schema.safeParse(response.data)

      if (!result.success) {
        logger.warn(`Invalid ${resource.name} response`, result.error)
        return
      }

      if (Date.parse(result.data.updatedAt) > Date.parse(resource.getCurrentUpdatedAt(state))) {
        resource.apply(state, result.data)
        await settingService.writeToJsonConfigFile(resource.cachePath, result.data)
        logger.info(
          `Updated ${resource.name}`,
          dayjs(result.data.updatedAt).format('YYYY-MM-DD HH:mm:ss')
        )
      } else {
        logger.info(
          `${resource.name} is up to date`,
          dayjs(resource.getCurrentUpdatedAt(state)).format('YYYY-MM-DD HH:mm:ss')
        )
      }
    } catch (error) {
      logger.warn(`Update ${resource.name} failed`, error)
    } finally {
      resource.setUpdating(state, false)
    }
  }
}
