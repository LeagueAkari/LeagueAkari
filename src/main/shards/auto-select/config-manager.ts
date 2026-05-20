import { runInAction } from 'mobx'

import type { AutoSelectMainContext } from './context'

export class AutoSelectConfigManager {
  constructor(private readonly _context: AutoSelectMainContext) {}

  async fillAutoBanPickConfig() {
    const { settings, settingService, state } = this._context
    let modified = false

    runInAction(() => {
      for (const group of state.groups) {
        if (!settings.pickConfig[group.groupId]) {
          modified = true
          settings.setPickConfig(group.groupId, settings.createNewEmptyPickConfig())
        }

        if (!settings.banConfig[group.groupId]) {
          modified = true
          settings.setBanConfig(group.groupId, settings.createNewEmptyBanConfig())
        }
      }
    })

    if (modified) {
      await settingService.set('pickConfig', settings.pickConfig)
      await settingService.set('banConfig', settings.banConfig)
    }
  }
}
