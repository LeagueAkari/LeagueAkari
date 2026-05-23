import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { Paths } from '@shared/utils/types'
import { WatchOptions } from 'vue'

import { AkariIpcRenderer } from '../ipc'
import {
  SETTING_FACTORY_MAIN_NAMESPACE,
  SETTING_UTILS_RENDERER_NAMESPACE,
  type SettingUtilsRendererContext
} from './context'
import { SavedSettingWatcher } from './saved-setting-watcher'

export { SETTING_FACTORY_MAIN_NAMESPACE as MAIN_SHARD_NAMESPACE } from './context'

@Shard(SettingUtilsRenderer.id)
export class SettingUtilsRenderer implements IAkariShardInitDispose {
  static id = SETTING_UTILS_RENDERER_NAMESPACE

  private readonly _context: SettingUtilsRendererContext
  private readonly _savedSettingWatcher: SavedSettingWatcher

  constructor(@Dep(AkariIpcRenderer) ipc: AkariIpcRenderer) {
    this._context = { ipc }
    this._savedSettingWatcher = new SavedSettingWatcher(this)
  }

  set(namespace: string, key: string, value: any) {
    return this._context.ipc.call(SETTING_FACTORY_MAIN_NAMESPACE, 'set', namespace, key, value)
  }

  async get(namespace: string, key: string, defaultValue?: any) {
    return (
      (await this._context.ipc.call(SETTING_FACTORY_MAIN_NAMESPACE, 'get', namespace, key)) ??
      defaultValue
    )
  }

  getByPrefix(namespace: string, keyPrefix: string) {
    return this._context.ipc.call(
      SETTING_FACTORY_MAIN_NAMESPACE,
      'getByPrefix',
      namespace,
      keyPrefix
    )
  }

  removeByPrefix(namespace: string, keyPrefix: string) {
    return this._context.ipc.call(
      SETTING_FACTORY_MAIN_NAMESPACE,
      'removeByPrefix',
      namespace,
      keyPrefix
    )
  }

  exportSettingsToJsonFile() {
    return this._context.ipc.call(SETTING_FACTORY_MAIN_NAMESPACE, 'exportSettingsToJsonFile')
  }

  importSettingsFromJsonFile() {
    return this._context.ipc.call(SETTING_FACTORY_MAIN_NAMESPACE, 'importSettingsFromJsonFile')
  }

  /**
   * 远古工具方法 2.0, 仅用于渲染进程的某些数据存储和初始化
   * 用于持久化某些仅用于渲染进程的数据
   */
  async savedGetterVue(
    namespace: string,
    key: string,
    getter: () => any,
    initValueSetter: (value: any) => void
  ) {
    await this._savedSettingWatcher.savedGetterVue(namespace, key, getter, initValueSetter)
  }

  /**
   * synced in ONE renderer process
   */
  async savedPropVue<T extends object>(
    namespace: string,
    object: T,
    propKey: Paths<T>,
    options: {
      savePropKey?: string
      watchOptions?: WatchOptions
    } = {}
  ) {
    await this._savedSettingWatcher.savedPropVue(namespace, object, propKey, options)
  }

  async onDispose() {
    this._savedSettingWatcher.dispose()
  }
}
