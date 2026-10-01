import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import type {
  OpggApplyRecommendation,
  OpggChampionDataQueryUpdate,
  OpggFlashPosition
} from '@shared/types/champion-data/opgg'

import type { AkariIpcMain } from '../ipc'
import type { ChampionDataMainContext } from './context'
import type { OpggChampionDataController } from './opgg/data-controller'
import type { OpggLoadoutExecutor } from './opgg/loadout-executor'

export class ChampionDataIpcHandlers {
  constructor(
    private readonly _context: ChampionDataMainContext,
    private readonly _ipc: AkariIpcMain,
    private readonly _opgg: OpggChampionDataController,
    private readonly _loadout: OpggLoadoutExecutor
  ) {}

  register() {
    this._ipc.onCall(
      this._context.namespace,
      'updateOpggQuery',
      (_, query: OpggChampionDataQueryUpdate) => this._opgg.update(query)
    )
    this._ipc.onCall(this._context.namespace, 'openOpggChampion', (_, id: number) =>
      this._opgg.open(id)
    )
    this._ipc.onCall(this._context.namespace, 'activateOpggPage', (_, id: number | null) =>
      this._opgg.activate(id)
    )
    this._ipc.onCall(this._context.namespace, 'closeOpggChampion', (_, id: number) =>
      this._opgg.close(id)
    )
    this._ipc.onCall(this._context.namespace, 'reorderOpggChampions', (_, ids: number[]) =>
      this._opgg.reorder(ids)
    )
    this._ipc.onCall(this._context.namespace, 'refreshOpgg', (_, id?: number | null) =>
      this._opgg.refresh(id)
    )
    this._ipc.onCall(this._context.namespace, 'cancelOpgg', (_, id: number | null) =>
      this._opgg.cancelPage(id)
    )
    this._ipc.onCall(
      this._context.namespace,
      'setOpggFlashPosition',
      (_, value: OpggFlashPosition) => this._context.settingService.set('opggFlashPosition', value)
    )
    this._ipc.onCall(
      this._context.namespace,
      'applyOpggRecommendation',
      (_, request: OpggApplyRecommendation) => this._loadout.apply(request)
    )
    this._ipc.onCall(
      this._context.namespace,
      'setQq101Preferences',
      async (_, preferences: Qq101ChampionDataPreferences) => {
        await this._context.settingService.set('qq101Preferences', preferences)
      }
    )
  }
}
