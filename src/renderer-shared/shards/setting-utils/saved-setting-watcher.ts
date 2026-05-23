import type { Paths } from '@shared/utils/types'
import _ from 'lodash'
import { WatchOptions, toRaw, watch } from 'vue'

import type { SettingUtilsRenderer } from '.'

export class SavedSettingWatcher {
  private readonly _stopHandles = new Set<Function>()

  constructor(private readonly _settingUtils: SettingUtilsRenderer) {}

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
    initValueSetter(await this._settingUtils.get(namespace, key, getter()))
    const stopHandle = watch(getter, (value) => {
      this._settingUtils.set(namespace, key, toRaw(value))
    })
    this._stopHandles.add(stopHandle)
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
    const { savePropKey, watchOptions } = options

    const value = await this._settingUtils.get(
      namespace,
      savePropKey ? savePropKey : propKey,
      _.get(object, propKey)
    )
    _.set(object, propKey, value)
    const stopHandle = watch(
      () => _.get(object, propKey),
      (value) => {
        this._settingUtils.set(namespace, savePropKey ? savePropKey : propKey, toRaw(value))
      },
      watchOptions
    )
    this._stopHandles.add(stopHandle)
  }

  dispose() {
    for (const stopHandle of this._stopHandles) {
      stopHandle()
    }
    this._stopHandles.clear()
  }
}
