import type { DeepPartialObject } from '@shared/utils/types'

import type { AutoSelectMainContext } from './context'
import type { BanChampionConfig, PickChampionConfig } from './state'

export class AutoSelectIpcHandlers {
  constructor(private readonly _context: AutoSelectMainContext) {}

  register() {
    const { ipc, namespace, settings, settingService, state } = this._context

    ipc.onCall(
      namespace,
      'setPickConfig',
      async (_, type: string, config: DeepPartialObject<PickChampionConfig>) => {
        settings.setPickConfig(type, config)
        await settingService.set('pickConfig', settings.pickConfig)
      }
    )

    ipc.onCall(
      namespace,
      'setBanConfig',
      async (_, type: string, config: DeepPartialObject<BanChampionConfig>) => {
        settings.setBanConfig(type, config)
        await settingService.set('banConfig', settings.banConfig)
      }
    )

    ipc.onCall(namespace, 'setTemporarilyDisabled', async (_, temporarilyDisabled: boolean) => {
      state.setTemporarilyDisabled(temporarilyDisabled)
    })
  }
}
