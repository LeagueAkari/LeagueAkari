import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { Dep, Shard } from '@shared/akari-shard'
import { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import {
  ModeType,
  OpggAramBalanceItem,
  PositionType,
  RegionType,
  TierType
} from '@shared/types/opgg'
import { useIntervalFn } from '@vueuse/core'
import axios from 'axios'
import { toRaw, watch } from 'vue'

import { useOpggStore } from './store'

@Shard(OpggRenderer.id)
export class OpggRenderer {
  static id = 'opgg-renderer'

  private _httpClient = axios.create()

  public readonly api = new OpggHttpApiAxiosHelper(this._httpClient)

  constructor(
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer,
    @Dep(LeagueClientRenderer) private readonly _leagueClient: LeagueClientRenderer,
    @Dep(LoggerRenderer) private readonly _logger: LoggerRenderer
  ) {}

  async onInit() {
    const store = useOpggStore()

    await this._settingUtils.savedPropVue(OpggRenderer.id, store.frontendSettings, 'autoApplyItems')
    await this._settingUtils.savedPropVue(OpggRenderer.id, store.frontendSettings, 'autoApplyRunes')
    await this._settingUtils.savedPropVue(
      OpggRenderer.id,
      store.frontendSettings,
      'autoApplySpells'
    )

    await this._migratePreferences()

    const savedPreferences = await this._settingUtils.get(OpggRenderer.id, 'savedPreferences')
    if (savedPreferences) {
      store.savedPreferences = savedPreferences
    }

    this._restoreItemSet()
    this._watchAramBalance()
    this._registerHttpProxy()
  }

  private _restoreItemSet() {
    const leagueClientStore = useLeagueClientStore()

    watch(
      () => leagueClientStore.gameflow.phase === 'EndOfGame',
      (isEndOfGame) => {
        if (isEndOfGame) {
          this._leagueClient.writeItemSetsToDisk(null)
        }
      }
    )
  }

  private _registerHttpProxy() {
    const appCommonStore = useAppCommonStore()

    watch(
      () => appCommonStore.settings.httpProxy,
      (httpProxy) => {
        if (httpProxy.strategy === 'force') {
          this._httpClient.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
        } else if (httpProxy.strategy === 'disable') {
          this._httpClient.defaults.proxy = false
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
    return this._settingUtils.set(
      OpggRenderer.id,
      'savedPreferences',
      toRaw(store.savedPreferences)
    )
  }

  private async _migratePreferences() {
    const item = localStorage.getItem('opgg-flash-position')

    if (item !== null) {
      try {
        const flashPosition = JSON.parse(item) as 'auto' | 'd' | 'f'

        if (flashPosition !== 'auto' && flashPosition !== 'd' && flashPosition !== 'f') {
          return
        }

        await this.updatePreferences({
          flashPosition
        })

        this._logger.info('opgg', 'Migrated flash position from local storage', { flashPosition })
      } catch (error) {
        this._logger.error('opgg', 'Failed to migrate flash position from local storage', {
          error
        })
      } finally {
        localStorage.removeItem('opgg-flash-position')
      }
    }
  }

  private _watchAramBalance() {
    this._setupInAppScope.addSetupFn(() => {
      const store = useOpggStore()

      useIntervalFn(
        async () => {
          try {
            const { data } = await this.api.getAramBalance()

            store.aramBalance = data.data.reduce(
              (acc, item) => {
                acc[item.champion_id] = item
                return acc
              },
              {} as Record<number, OpggAramBalanceItem>
            )

            this._logger.info(OpggRenderer.id, 'Updated ARAM balance', `${data.data.length} items`)
          } catch {}
        },
        30 * 60 * 1000,
        { immediateCallback: true, immediate: true }
      )
    })
  }
}
