import {
  CHAMPION_DATA_CAPABILITIES,
  type ChampionDataPreferences,
  type ChampionDataQuery,
  type ChampionDataSourceId
} from '@shared/data-adapter/champion-data'

import type { AkariIpcMain } from '../ipc'
import type { ChampionDataMainContext, ChampionDataService } from './context'
import { ChampionDataRequestController } from './request-controller'

export class ChampionDataIpcHandlers {
  private readonly _requests = new ChampionDataRequestController()

  constructor(
    private readonly _context: ChampionDataMainContext,
    private readonly _ipc: AkariIpcMain,
    private readonly _service: ChampionDataService
  ) {}

  register() {
    const { namespace, settingService, settings, state } = this._context

    this._ipc.onCall(namespace, 'getAvailability', () => state.availability)
    this._ipc.onCall(namespace, 'getCapabilities', () => CHAMPION_DATA_CAPABILITIES)
    this._ipc.onCall(
      namespace,
      'loadPatches',
      (event, requestId: string, query: ChampionDataQuery) =>
        this._requests.run(event.sender.id, requestId, (signal) =>
          this._service.loadPatches(query, { signal })
        )
    )
    this._ipc.onCall(
      namespace,
      'loadOverview',
      (event, requestId: string, query: ChampionDataQuery) =>
        this._requests.run(event.sender.id, requestId, (signal) =>
          this._service.loadOverview(query, { signal })
        )
    )
    this._ipc.onCall(
      namespace,
      'loadDetails',
      (event, requestId: string, query: ChampionDataQuery, championId: number) =>
        this._requests.run(event.sender.id, requestId, (signal) =>
          this._service.loadDetails(query, championId, { signal })
        )
    )
    this._ipc.onCall(namespace, 'cancelRequest', (event, requestId: string) =>
      this._requests.cancel(event.sender.id, requestId)
    )
    this._ipc.onCall(namespace, 'setPreferredSource', async (_, source: ChampionDataSourceId) => {
      await settingService.set('preferredSource', source)
    })
    this._ipc.onCall(
      namespace,
      'setPreferences',
      async (_, preferences: Partial<ChampionDataPreferences>) => {
        await settingService.set('preferences', { ...settings.preferences, ...preferences })
      }
    )
  }

  dispose() {
    this._requests.cancelAll()
  }
}
