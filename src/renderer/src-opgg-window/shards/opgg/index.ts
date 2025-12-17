import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { Dep, Shard } from '@shared/akari-shard'
import { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import { ModeType, PositionType, RegionType, TierType } from '@shared/types/opgg'
import { useLocalStorage } from '@vueuse/core'
import axios from 'axios'
import { toRaw, watch } from 'vue'

import { useOpggStore } from './store'

@Shard(OpggRenderer.id)
export class OpggRenderer {
  static id = 'opgg-renderer'

  private _http = axios.create()

  public readonly api = new OpggHttpApiAxiosHelper(this._http)

  constructor(
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(LeagueClientRenderer) private readonly _lc: LeagueClientRenderer,
    @Dep(LoggerRenderer) private readonly _logger: LoggerRenderer
  ) {}

  async onInit() {
    const store = useOpggStore()

    await this._setting.savedPropVue(OpggRenderer.id, store.frontendSettings, 'autoApplyItems')
    await this._setting.savedPropVue(OpggRenderer.id, store.frontendSettings, 'autoApplyRunes')
    await this._setting.savedPropVue(OpggRenderer.id, store.frontendSettings, 'autoApplySpells')

    await this._migratePreferences()

    const savedPreferences = await this._setting.get(OpggRenderer.id, 'savedPreferences')
    if (savedPreferences) {
      store.savedPreferences = savedPreferences
    }

    this._handleRestoreItemSet()
    this._handleHttpProxy()
  }

  private _handleRestoreItemSet() {
    const lcs = useLeagueClientStore()

    watch(
      () => lcs.gameflow.phase === 'EndOfGame',
      (isEndOfGame) => {
        if (isEndOfGame) {
          this._lc.writeItemSetsToDisk(null)
        }
      }
    )
  }

  private _handleHttpProxy() {
    const as = useAppCommonStore()

    watch(
      () => as.settings.httpProxy,
      (httpProxy) => {
        if (httpProxy.strategy === 'force') {
          this._http.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
        } else if (httpProxy.strategy === 'disable') {
          this._http.defaults.proxy = false
        }
      },
      { immediate: true }
    )
  }

  async updatePreferences(
    options: Partial<{
      flashPosition: 'auto' | 'd' | 'f'
      mode: ModeType
      position: PositionType
      region: RegionType
      tier: TierType
    }>
  ) {
    const store = useOpggStore()
    store.savedPreferences = { ...store.savedPreferences, ...options }
    return this._setting.set(OpggRenderer.id, 'savedPreferences', toRaw(store.savedPreferences))
  }

  private async _migratePreferences() {
    const flashPosition = useLocalStorage<string>(
      'opgg-flash-position',
      '<akari:flashPositionMigrated1217>'
    )

    if (flashPosition.value !== '<akari:flashPositionMigrated1217>') {
      await this.updatePreferences({
        flashPosition: flashPosition.value as 'auto' | 'd' | 'f'
      })

      this._logger.info('opgg', 'Migrated flash position from local storage', {
        flashPosition: flashPosition.value
      })
    }
  }
}
