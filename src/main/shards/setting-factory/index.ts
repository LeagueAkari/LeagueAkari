import { IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'
import { Paths } from '@shared/utils/types'

import { AkariIpcMain } from '../ipc'
import { StorageMain } from '../storage'
import { Setting } from '../storage/entities/Settings'
import { SETTING_FACTORY_MAIN_NAMESPACE, type SettingFactoryMainContext } from './context'
import { DelayedTaskScheduler } from './delayed-task-scheduler'
import { SettingFactoryIpcHandlers } from './ipc-handlers'
import { SetterSettingService } from './setter-setting-service'
import { SettingsJsonFileService } from './settings-json-file-service'

export type OnChangeCallback<T = any> = (
  newValue: T,
  extra: {
    oldValue: T
    key: string

    /** 提交到状态变更和数据库存储, 空值为继承 */
    setter: (newValue?: T) => void | Promise<void>
  }
) => void | Promise<void>

export interface SettingConfig<T = any> {
  /**
   * 这个设置项的默认值
   */
  default: T

  /**
   * 实现该设置项的类型, 不提供将会直接修改状态值
   */
  onChange?: OnChangeCallback<T>
}

export type SettingSchema<T extends object> = Partial<Record<Paths<T>, SettingConfig>>

/**
 * 创建日志记录器的工厂, 供给其他模块使用
 * 在原有状态同步的基础上, 现在将会读取设置项以及接管设置项的变更
 */
@Shard(SettingFactoryMain.id)
export class SettingFactoryMain implements IAkariShardInitDispose {
  static id = SETTING_FACTORY_MAIN_NAMESPACE

  private readonly _settings: Map<string, SetterSettingService> = new Map()
  private readonly _context: SettingFactoryMainContext
  private readonly _settingsJsonFileService: SettingsJsonFileService
  private readonly _ipcHandlers: SettingFactoryIpcHandlers

  readonly _delayed = new DelayedTaskScheduler()

  constructor(
    private readonly _ipc: AkariIpcMain,
    private readonly _storage: StorageMain,
    private readonly _shared: SharedGlobalShard
  ) {
    this._context = {
      namespace: SettingFactoryMain.id,
      ipc: this._ipc,
      storage: this._storage,
      shared: this._shared
    }
    this._settingsJsonFileService = new SettingsJsonFileService(this._context)
    this._ipcHandlers = new SettingFactoryIpcHandlers(
      this._context,
      this,
      this._settingsJsonFileService
    )
  }

  register<T extends object = any>(
    namespace: string,
    schema: SettingSchema<T> = {},
    obj: T = {} as T
  ) {
    if (this._settings.has(namespace)) {
      throw new Error(`namespace ${namespace} already created`)
    }

    const service = new SetterSettingService(this, SettingFactoryMain, namespace, schema, obj, {
      storage: this._storage
    })

    this._settings.set(namespace, service)
    return service
  }

  getSettingService(namespace: string) {
    return this._settings.get(namespace)
  }

  async setSetting(namespace: string, key: string, newValue: any) {
    const service = this._settings.get(namespace)

    if (service) {
      await service.set(key, newValue)
    } else {
      await this._saveToStorage(namespace, key, newValue)
    }
  }

  async getSetting(namespace: string, key: string) {
    const service = this._settings.get(namespace)
    if (service) {
      return service.get(key)
    }

    return this._getFromStorage(namespace, key)
  }

  async getSettingsByPrefix(namespace: string, keyPrefix: string) {
    return this._getByPrefixFromStorage(namespace, keyPrefix)
  }

  async removeSettingsByPrefix(namespace: string, keyPrefix: string) {
    const service = this._settings.get(namespace)
    if (service) {
      return service._removeByPrefixFromStorage(keyPrefix)
    }

    return this._removeByPrefixFromStorage(namespace, keyPrefix)
  }

  /**
   * 拥有指定设置项吗？
   */
  _hasKeyInStorage(namespace: string, key: string) {
    const key2 = `${namespace}/${key}`
    return this._storage.dataSource.manager.existsBy(Setting, { key: key2 })
  }

  /**
   * 获取指定设置项的值
   * @param key
   * @param defaultValue
   * @returns
   */
  async _getFromStorage<T = any>(namespace: string, key: string): Promise<T | undefined>
  async _getFromStorage<T>(namespace: string, key: string, defaultValue: T): Promise<T>
  async _getFromStorage(namespace: string, key: string, defaultValue?: any) {
    const key2 = `${namespace}/${key}`
    const v = await this._storage.dataSource.manager.findOneBy(Setting, { key: key2 })
    if (!v) {
      if (defaultValue !== undefined) {
        return defaultValue
      }
      return undefined
    }

    return v.value
  }

  /**
   * 获取指定前缀下的设置项
   */
  async _getByPrefixFromStorage(namespace: string, keyPrefix: string) {
    const { lowerBound, upperBound } = this._getStorageKeyPrefixBounds(namespace, keyPrefix)

    return this._storage.dataSource
      .getRepository(Setting)
      .createQueryBuilder('setting')
      .where('setting.key >= :lowerBound AND setting.key < :upperBound', { lowerBound, upperBound })
      .getMany()
  }

  /**
   * 删除指定前缀下的设置项
   */
  async _removeByPrefixFromStorage(namespace: string, keyPrefix: string) {
    const { lowerBound, upperBound } = this._getStorageKeyPrefixBounds(namespace, keyPrefix)

    const result = await this._storage.dataSource
      .createQueryBuilder()
      .delete()
      .from(Setting)
      .where('key >= :lowerBound AND key < :upperBound', { lowerBound, upperBound })
      .execute()

    return result.affected || 0
  }

  private _getStorageKeyPrefixBounds(namespace: string, keyPrefix: string) {
    if (keyPrefix.endsWith('/')) {
      keyPrefix = keyPrefix.slice(0, -1)
    }

    const lowerBound = keyPrefix ? `${namespace}/${keyPrefix}/` : `${namespace}/`
    const upperBound = `${lowerBound.slice(0, -1)}0`

    return { lowerBound, upperBound }
  }

  /**
   * unused
   */
  async _setJsonValue(namespace: string, key: string, path: string, value: any, defaultJson?: any) {
    const key2 = `${namespace}/${key}`

    const jsonExists = await this._hasKeyInStorage(namespace, key)

    if (!jsonExists) {
      if (defaultJson === undefined) {
        throw new Error(`key ${key2} does not exist`)
      }

      await this._saveToStorage(namespace, key, defaultJson)
    }

    const ph = path.startsWith('[') ? path : `$.${path}`

    const result = await this._storage.dataSource.manager
      .createQueryBuilder()
      .update()
      .set({
        value: () => `json_set(value, '${ph}', :jsonValue)`
      })
      .where('key = :key2', { key2 })
      .setParameter('jsonValue', JSON.stringify(value))
      .execute()

    return result.affected || 0
  }

  /**
   * unused
   */
  async _removeJsonValue(namespace: string, key: string, path: string) {
    const key2 = `${namespace}/${key}`

    const ph = path.startsWith('[') ? path : `$.${path}`

    const result = await this._storage.dataSource.manager
      .createQueryBuilder()
      .update()
      .set({
        value: () => `json_remove(value, '${ph}')`
      })
      .where('key = :key2', { key2 })
      .execute()

    return result.affected
  }

  /**
   * 设置指定设置项的值
   * @param key
   * @param value
   */
  async _saveToStorage(namespace: string, key: string, value: any) {
    const key2 = `${namespace}/${key}`

    if (!key2 || value === undefined) {
      throw new Error(`key or value cannot be empty: ${key2} ${value}`)
    }

    await this._storage.dataSource.manager.save(Setting.create(key2, value))
  }

  /**
   * 删除设置项, 但通常没有用过
   * @param key
   */
  async _removeFromStorage(namespace: string, key: string) {
    const key2 = `${namespace}/${key}`
    if (!key2) {
      throw new Error('key is required')
    }

    await this._storage.dataSource.manager.delete(Setting, { key: key2 })
  }

  /**
   * 从应用目录读取某个 JSON 文件，提供一个文件名
   */
  async readFromJsonConfigFile<T = any>(namespace: string, filename: string): Promise<T> {
    return this._settingsJsonFileService.readConfigFile(namespace, filename)
  }

  /**
   * 将某个东西写入到 JSON 文件中，提供一个文件名
   */
  async writeToJsonConfigFile(namespace: string, filename: string, data: any) {
    return this._settingsJsonFileService.writeConfigFile(namespace, filename, data)
  }

  /**
   * 检查某个 json 配置文件是否存在
   */
  async jsonConfigFileExists(namespace: string, filename: string) {
    return this._settingsJsonFileService.configFileExists(namespace, filename)
  }

  async onInit() {
    this._ipcHandlers.register()
  }

  async onDispose() {
    this._settings.clear()
    await this._delayed.flush()
  }
}
