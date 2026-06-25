import _ from 'lodash'
import { runInAction } from 'mobx'

import type {
  SettingChangeContext,
  SettingFactoryMain,
  SettingPath,
  SettingRestoreContext,
  SettingSchema
} from '.'

export interface SetterSettingServiceSetConfig {
  /**
   * 短期内的防抖措施
   *
   * 当设置为 true 开启, 默认为 500ms, 当设置为 false 时, 会立即写入
   *
   * 当设置为数字时, 表示延迟时间, 单位为毫秒
   */
  delay?: boolean | number
}

/**
 * 在更新设置时同时更改状态, 状态同步的设置项服务
 * 耦合了状态和设置项读写的功能, 顺便还能读写 JSON 文件
 */
export class SetterSettingService<TSettings extends object = any> {
  static CONFIG_DIR_NAME = 'AkariConfig'

  constructor(
    private readonly _settingFactory: SettingFactoryMain,
    private readonly _namespace: string,
    // for accessibility
    public readonly _schema: SettingSchema<TSettings>,
    public readonly _obj: TSettings
  ) {}

  _getFromStorage(key: string, defaultValue?: any) {
    return this._settingFactory._getFromStorage(this._namespace, key, defaultValue)
  }

  _saveToStorage(key: string, value: any) {
    return this._settingFactory._saveToStorage(this._namespace, key, value)
  }

  _removeFromStorage(key: string) {
    return this._settingFactory._removeFromStorage(this._namespace, key)
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
      [SettingPath<TSettings>, { default: TSettings[SettingPath<TSettings>] }]
    >
    const jobs = entries.map(async ([key, schema]) => {
      if (!schema) {
        return
      }

      const value = await this._settingFactory._getFromStorage(
        this._namespace,
        key as any,
        schema.default
      )
      items[key] = await this._restoreSettingConfig(key, value)
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
    const schema = this._schema[key]
    if (!schema) {
      return newValue
    }

    const oldValue = _.get(this._obj, key) as TSettings[K]
    let value = newValue

    if (schema.transform) {
      value = await schema.transform(this._createChangeContext(key, oldValue, value))
    }

    const context = this._createChangeContext(key, oldValue, value)
    await schema.sideEffect?.(context)

    return value
  }

  private async _restoreSettingConfig<K extends SettingPath<TSettings>>(
    key: K,
    value: unknown
  ): Promise<TSettings[K]> {
    const schema = this._schema[key]
    if (!schema?.restore) {
      return value as TSettings[K]
    }

    return schema.restore(this._createRestoreContext(key, value, schema.default as TSettings[K]))
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
      this._settingFactory._delayed.add(`${this._namespace}/${key}`, () =>
        this._settingFactory._removeFromStorage(this._namespace, key)
      )
    } else {
      this._settingFactory._delayed.add(`${this._namespace}/${key}`, () =>
        this._settingFactory._saveToStorage(this._namespace, key, value)
      )
    }
  }
}
