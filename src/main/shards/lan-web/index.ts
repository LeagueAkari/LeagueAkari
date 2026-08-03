import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { LAN_WEB_MAIN_NAMESPACE } from '@shared/shards/lan-web'
import { z } from 'zod'

import { AppCommonMain } from '../app-common'
import { LeagueClientMain } from '../league-client'
import { LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { OngoingGameMain } from '../ongoing-game'
import { RiotClientMain } from '../riot-client'
import { SettingFactoryMain } from '../setting-factory'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import { SgpMain } from '../sgp'
import type { LanWebMainContext } from './context'
import { LanWebHttpServerController } from './http-server-controller'
import { isValidLanPort } from './network'
import { LanWebSettings, LanWebState } from './state'

@Shard(LanWebMain.id)
export class LanWebMain implements IAkariShardInitDispose {
  static id = LAN_WEB_MAIN_NAMESPACE

  readonly settings = new LanWebSettings()
  readonly state = new LanWebState()

  private readonly _settingService: SetterSettingService<LanWebSettings>
  private readonly _context: LanWebMainContext
  private readonly _server: LanWebHttpServerController

  constructor(
    loggerFactory: LoggerFactoryMain,
    settingFactory: SettingFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain,
    appCommon: AppCommonMain,
    leagueClient: LeagueClientMain,
    riotClient: RiotClientMain,
    sgp: SgpMain,
    ongoingGame: OngoingGameMain
  ) {
    const logger = loggerFactory.create(LanWebMain.id)
    this._settingService = settingFactory.register(
      LanWebMain.id,
      {
        enabled: { default: this.settings.enabled, schema: z.boolean() },
        port: {
          default: this.settings.port,
          schema: z.number(),
          transform: ({ value, oldValue }) => (isValidLanPort(value) ? value : oldValue)
        }
      },
      this.settings
    )
    this._context = {
      namespace: LanWebMain.id,
      logger,
      settings: this.settings,
      state: this.state,
      settingService: this._settingService,
      appCommon,
      leagueClient,
      riotClient,
      sgp,
      ongoingGame
    }
    this._server = new LanWebHttpServerController(this._context)
  }

  async onInit() {
    await this._settingService.applyToState()
    this._mobxUtils.propSync(LanWebMain.id, 'settings', this.settings, ['enabled', 'port'])
    this._mobxUtils.propSync(LanWebMain.id, 'state', this.state, [
      'status',
      'listeningPort',
      'accessUrls',
      'errorMessage'
    ])
    this._mobxUtils.reaction(
      () => ({ enabled: this.settings.enabled, port: this.settings.port }),
      ({ enabled, port }, previous) => {
        void this._applyServiceSettings(enabled, port, previous?.port)
      },
      { fireImmediately: true }
    )
  }

  async onDispose() {
    await this._server.stop()
  }

  private async _applyServiceSettings(enabled: boolean, port: number, previousPort?: number) {
    try {
      if (!enabled) {
        await this._server.stop()
      } else if (previousPort !== undefined && previousPort !== port) {
        await this._server.restart(port)
      } else {
        await this._server.start(port)
      }
    } catch {
      // Runtime state and the project logger already contain the actionable error.
    }
  }
}
