import _ from 'lodash'
import { runInAction } from 'mobx'
import type { ZodIssue } from 'zod'

import type {
  SettingChangeContext,
  SettingFactoryMain,
  SettingPath,
  SettingRestoreContext,
  SettingSchema
} from '.'
import type { AkariLogger } from '../logger-factory'

export interface SetterSettingServiceSetConfig {
  /**
   * 短期内的防抖措施
   *
   * 当设置为数字时开启延迟写入, 单位为毫秒
   */
  delay?: number
}

type PendingStorageOperation =
  | {
      type: 'save'
      value: unknown
    }
  | {
      type: 'remove'
    }

/**
 * 在更新设置时同时更改状态, 状态同步的设置项服务
 * 耦合了状态和设置项读写的功能, 顺便还能读写 JSON 文件
 */
export class SetterSettingService<TSettings extends object = any> {
  static CONFIG_DIR_NAME = 'AkariConfig'

  private readonly _pendingStorageOperations = new Map<string, PendingStorageOperation>()
  private readonly _defaults = new Map<SettingPath<TSettings>, TSettings[SettingPath<TSettings>]>()

  constructor(
    private readonly _settingFactory: SettingFactoryMain,
    private readonly _namespace: string,
    // for accessibility
    public readonly _schema: SettingSchema<TSettings>,
    public readonly _obj: TSettings,
    private readonly _logger: AkariLogger
  ) {
    this._validateDefaults()
  }

  async _getFromStorage<T = any>(key: string): Promise<T | undefined>
  async _getFromStorage<T>(key: string, defaultValue: T): Promise<T>
  async _getFromStorage(key: string, defaultValue?: any) {
    const pendingOperation = this._pendingStorageOperations.get(key)
    if (pendingOperation?.type === 'save') {
      return pendingOperation.value
    }

    if (pendingOperation?.type === 'remove') {
      return defaultValue
    }

    return this._settingFactory._getFromStorage(this._namespace, key, defaultValue)
  }

  _saveToStorage(key: string, value: any, config: SetterSettingServiceSetConfig = {}) {
    if (typeof config.delay === 'number') {
      return this._scheduleStorageSave(key, value, config.delay)
    }

    return this._saveToStorageImmediately(key, value)
  }

  _removeFromStorage(key: string) {
    return this._removeFromStorageImmediately(key)
  }

  private _scheduleStorageSave(key: string, value: any, delay: number) {
    const pendingOperation: PendingStorageOperation = { type: 'save', value }

    this._pendingStorageOperations.set(key, pendingOperation)
    this._settingFactory._delayed.add(
      this._createStorageKey(key),
      async () => {
        try {
          await this._settingFactory._saveToStorage(this._namespace, key, value)
        } finally {
          this._clearPendingStorageOperation(key, pendingOperation)
        }
      },
      delay
    )

    return Promise.resolve()
  }

  private _scheduleStorageRemove(key: string, delay: number) {
    const pendingOperation: PendingStorageOperation = { type: 'remove' }

    this._pendingStorageOperations.set(key, pendingOperation)
    this._settingFactory._delayed.add(
      this._createStorageKey(key),
      async () => {
        try {
          await this._settingFactory._removeFromStorage(this._namespace, key)
        } finally {
          this._clearPendingStorageOperation(key, pendingOperation)
        }
      },
      delay
    )

    return Promise.resolve()
  }

  private _saveToStorageImmediately(key: string, value: any) {
    this._cancelPendingStorageOperation(key)
    return this._settingFactory._saveToStorage(this._namespace, key, value)
  }

  private _removeFromStorageImmediately(key: string) {
    this._cancelPendingStorageOperation(key)
    return this._settingFactory._removeFromStorage(this._namespace, key)
  }

  private _createStorageKey(key: string) {
    return `${this._namespace}/${key}`
  }

  private _cancelPendingStorageOperation(key: string) {
    this._pendingStorageOperations.delete(key)
    this._settingFactory._delayed.remove(this._createStorageKey(key))
  }

  private _clearPendingStorageOperation(key: string, pendingOperation: PendingStorageOperation) {
    if (this._pendingStorageOperations.get(key) === pendingOperation) {
      this._pendingStorageOperations.delete(key)
    }
  }

  _getByPrefixFromStorage(keyPrefix: string) {
    return this._settingFactory._getByPrefixFromStorage(this._namespace, keyPrefix)
  }

  _removeByPrefixFromStorage(keyPrefix: string) {
    return this._settingFactory._removeByPrefixFromStorage(this._namespace, keyPrefix)
  }

  _setJsonValue(key: string, path: string, value: any) {
    return this._settingFactory._setJsonValue(this._namespace, key, path, value)
  }

  _removeJsonValue(key: string, path: string) {
    return this._settingFactory._removeJsonValue(this._namespace, key, path)
  }

  /**
   * 获取所有设置项
   */
  async _getAllFromStorage() {
    const items: Record<string, any> = {}
    const entries = Object.entries(this._schema) as Array<
      [SettingPath<TSettings>, NonNullable<SettingSchema<TSettings>[SettingPath<TSettings>]>]
    >
    const jobs = entries.map(async ([key, config]) => {
      if (!config) {
        return
      }

      if (!config.schema) {
        const value = await this._getFromStorage(key as any, config.default)
        items[key] = await this._restoreSettingConfig(key, value)
        return
      }

      items[key] = await this._restoreValidatedSetting(key, config)
    })
    await Promise.all(jobs)
    return items
  }

  /**
   * 获取设置项, 并存储到这个 mobx 对象中
   * @param obj Mobx Observable
   * @returns 所有设置项
   */
  async applyToState() {
    const items = await this._getAllFromStorage()
    Object.entries(items).forEach(([key, value]) => {
      _.set(this._obj, key, value)
    })

    return items
  }

  async readFromJsonConfigFile<T = any>(filename: string): Promise<T> {
    return this._settingFactory.readFromJsonConfigFile(this._namespace, filename)
  }

  async writeToJsonConfigFile(filename: string, data: any) {
    return this._settingFactory.writeToJsonConfigFile(this._namespace, filename, data)
  }

  async jsonConfigFileExists(filename: string) {
    return this._settingFactory.jsonConfigFileExists(this._namespace, filename)
  }

  async deleteJsonConfigFile(filename: string) {
    return this._settingFactory.deleteJsonConfigFile(this._namespace, filename)
  }

  /**
   * 设置设置项的新值, 并**更新状态**
   *
   * 会被延迟写入
   * @param key
   * @param newValue
   */
  async set<K extends SettingPath<TSettings>>(key: K, newValue: TSettings[K]) {
    const value = await this._applySettingConfig(key, newValue)
    this._commitSetting(key, value)
  }

  async get<K extends SettingPath<TSettings>>(key: K): Promise<TSettings[K]> {
    return _.get(this._obj, key)
  }

  /**
   * placeholder
   * @param key
   */
  remove(_key: string): never {
    throw new Error('not implemented')
  }

  private async _applySettingConfig<K extends SettingPath<TSettings>>(
    key: K,
    newValue: TSettings[K]
  ) {
    const config = this._schema[key]
    if (!config) {
      return newValue
    }

    const oldValue = _.get(this._obj, key) as TSettings[K]
    let value = newValue

    if (config.transform) {
      value = await config.transform(this._createChangeContext(key, oldValue, value))
    }

    value = this._parseOrDefault(key, value, 'set')

    const context = this._createChangeContext(key, oldValue, value)
    await config.sideEffect?.(context)

    return value
  }

  private async _restoreSettingConfig<K extends SettingPath<TSettings>>(
    key: K,
    value: unknown
  ): Promise<TSettings[K]> {
    const config = this._schema[key]
    if (!config?.restore) {
      return value as TSettings[K]
    }

    return config.restore(this._createRestoreContext(key, value, this._getDefault(key)))
  }

  private _validateDefaults() {
    const entries = Object.entries(this._schema) as Array<
      [SettingPath<TSettings>, NonNullable<SettingSchema<TSettings>[SettingPath<TSettings>]>]
    >

    for (const [key, config] of entries) {
      if (!config) {
        continue
      }

      if (!config.schema) {
        this._defaults.set(key, config.default)
        continue
      }

      const result = config.schema.safeParse(config.default)
      if (!result.success) {
        throw new Error(
          `Invalid default value for setting ${this._namespace}/${key}: ${this._formatIssues(result.error.issues)}`
        )
      }

      this._defaults.set(key, result.data)
    }
  }

  private async _restoreValidatedSetting<K extends SettingPath<TSettings>>(
    key: K,
    config: NonNullable<SettingSchema<TSettings>[K]>
  ): Promise<TSettings[K]> {
    const storedValue = await this._getFromStorage(key)
    if (storedValue === undefined) {
      return this._getDefault(key)
    }

    let restoredValue: unknown
    try {
      restoredValue = await this._restoreSettingConfig(key, storedValue)
    } catch (error) {
      this._warnFallback(key, 'restore', error)
      await this._removeInvalidStoredValue(key)
      return this._getDefault(key)
    }

    const result = config.schema!.safeParse(restoredValue)
    if (!result.success) {
      this._warnFallback(key, 'restore', result.error.issues)
      await this._removeInvalidStoredValue(key)
      return this._getDefault(key)
    }

    if (!_.isEqual(result.data, storedValue)) {
      await this._writeNormalizedStoredValue(key, result.data)
    }

    return result.data
  }

  private _parseOrDefault<K extends SettingPath<TSettings>>(
    key: K,
    value: unknown,
    source: 'set'
  ): TSettings[K] {
    const config = this._schema[key]
    if (!config?.schema) {
      return value as TSettings[K]
    }

    const result = config.schema.safeParse(value)
    if (result.success) {
      return result.data
    }

    this._warnFallback(key, source, result.error.issues)
    return this._getDefault(key)
  }

  private _getDefault<K extends SettingPath<TSettings>>(key: K): TSettings[K] {
    return this._defaults.get(key) as TSettings[K]
  }

  private async _removeInvalidStoredValue(key: string) {
    try {
      await this._removeFromStorage(key)
    } catch (error) {
      this._logger.warn(
        'Failed to remove invalid setting value',
        { namespace: this._namespace, key },
        error
      )
    }
  }

  private async _writeNormalizedStoredValue(key: string, value: unknown) {
    try {
      if (value === null) {
        await this._removeFromStorage(key)
      } else {
        await this._saveToStorage(key, value)
      }
    } catch (error) {
      this._logger.warn(
        'Failed to persist normalized setting value',
        { namespace: this._namespace, key },
        error
      )
    }
  }

  private _warnFallback(key: string, source: 'restore' | 'set', error: unknown) {
    this._logger.warn('Invalid setting value, falling back to default', {
      namespace: this._namespace,
      key,
      source,
      issues: Array.isArray(error) ? this._formatIssues(error as ZodIssue[]) : String(error)
    })
  }

  private _formatIssues(issues: ZodIssue[]) {
    return issues
      .map((issue) => `${issue.path.join('.') || '<root>'} [${issue.code}]: ${issue.message}`)
      .join('; ')
  }

  private _createChangeContext<T>(key: string, oldValue: T, value: T): SettingChangeContext<T> {
    return {
      namespace: this._namespace,
      key,
      oldValue,
      value
    }
  }

  private _createRestoreContext<T>(
    key: string,
    value: unknown,
    defaultValue: T
  ): SettingRestoreContext<T> {
    return {
      namespace: this._namespace,
      key,
      value,
      defaultValue
    }
  }

  private _commitSetting<K extends SettingPath<TSettings>>(key: K, value: TSettings[K]) {
    runInAction(() => _.set(this._obj, key, value))

    if (value === null) {
      this._scheduleStorageRemove(key, 1000)
    } else {
      this._scheduleStorageSave(key, value, 1000)
    }
  }
}
