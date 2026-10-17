import type {
  ChampionDataSourcePreferences,
  OpggChampionDataPreferences,
  Qq101ChampionDataPreferences
} from '@shared/types/champion-data'
import type { OpggFlashPosition } from '@shared/types/champion-data/opgg'

import type { AkariIpcMain } from '../ipc'
import type { ChampionDataMainContext } from './context'

export class ChampionDataIpcHandlers {
  constructor(
    private readonly _context: ChampionDataMainContext,
    private readonly _ipc: AkariIpcMain
  ) {}

  register() {
    this._ipc.onCall(
      this._context.namespace,
      'setSourcePreferences',
      (_, value: ChampionDataSourcePreferences) =>
        this._context.settingService.set('sourcePreferences', value)
    )
    this._ipc.onCall(
      this._context.namespace,
      'setOpggPreferences',
      (_, value: OpggChampionDataPreferences) =>
        this._context.settingService.set('opggPreferences', value)
    )
    this._ipc.onCall(
      this._context.namespace,
      'setOpggFlashPosition',
      (_, value: OpggFlashPosition) => this._context.settingService.set('opggFlashPosition', value)
    )
    this._ipc.onCall(
      this._context.namespace,
      'setQq101Preferences',
      (_, value: Qq101ChampionDataPreferences) =>
        this._context.settingService.set('qq101Preferences', value)
    )
  }
}
