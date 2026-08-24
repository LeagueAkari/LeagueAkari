import {
  CHAMPION_DATA_CAPABILITIES,
  type ChampionDataPreferences,
  type ChampionDataQuery,
  type ChampionDataSourceId
} from '@shared/data-adapter/champion-data'

import type { AkariIpcMain } from '../ipc'
import type { ChampionDataMainContext, ChampionDataService } from './context'

export class ChampionDataIpcHandlers {
  constructor(
    private readonly _context: ChampionDataMainContext,
    private readonly _ipc: AkariIpcMain,
    private readonly _service: ChampionDataService
  ) {}

  register() {
    const { namespace, settingService, settings, state } = this._context

    this._ipc.onCall(namespace, 'getAvailability', () => state.availability)
    this._ipc.onCall(namespace, 'getCapabilities', () => CHAMPION_DATA_CAPABILITIES)
    this._ipc.onCall(namespace, 'loadOverview', (_, query: ChampionDataQuery) =>
      this._service.loadOverview(query)
    )
    this._ipc.onCall(namespace, 'loadDetails', (_, query: ChampionDataQuery, championId: number) =>
      this._service.loadDetails(query, championId)
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
}
