import _ from 'lodash'
import { runInAction } from 'mobx'

import type { AutoSelectMainContext } from './context'

/**
 * 已保存的配置可能缺少后续新增的字段，取其默认值补齐
 */
function getMissingDefaults<T extends object>(current: T, defaults: T) {
  const missing = _.omitBy(defaults, (_value, key) => Object.hasOwn(current, key)) as Partial<T>

  return Object.keys(missing).length ? missing : null
}

export class AutoSelectConfigManager {
  constructor(private readonly _context: AutoSelectMainContext) {}

  async fillAutoBanPickConfig() {
    const { settings, settingService, state } = this._context
    let modified = false

    runInAction(() => {
      for (const group of state.groups) {
        const pickConfig = settings.pickConfig[group.groupId]

        if (!pickConfig) {
          modified = true
          settings.setPickConfig(group.groupId, settings.createNewEmptyPickConfig())
        } else {
          const missing = getMissingDefaults(pickConfig, settings.createNewEmptyPickConfig())

          if (missing) {
            modified = true
            settings.setPickConfig(group.groupId, missing)
          }
        }

        const banConfig = settings.banConfig[group.groupId]

        if (!banConfig) {
          modified = true
          settings.setBanConfig(group.groupId, settings.createNewEmptyBanConfig())
        } else {
          const missing = getMissingDefaults(banConfig, settings.createNewEmptyBanConfig())

          if (missing) {
            modified = true
            settings.setBanConfig(group.groupId, missing)
          }
        }
      }
    })

    if (modified) {
      await settingService.set('pickConfig', settings.pickConfig)
      await settingService.set('banConfig', settings.banConfig)
    }
  }
}
