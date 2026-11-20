import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { z } from 'zod'

import { ChampionDataMain } from '../champion-data'
import { LeagueClientMain } from '../league-client'
import { LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import { WindowManagerMain } from '../window-manager'
import { HextechAugmentOverlayController } from './augment-overlay-controller'
import { HextechAugmentSettings, HextechAugmentState } from './state'

@Shard(HextechAugmentMain.id)
export class HextechAugmentMain implements IAkariShardInitDispose {
  static id = 'hextech-augment-main'
  readonly settings = new HextechAugmentSettings()
  readonly state = new HextechAugmentState()
  private readonly _settingService: SetterSettingService<HextechAugmentSettings>
  private readonly _controller: HextechAugmentOverlayController

  constructor(
    private readonly _mobxUtils: MobxUtilsMain,
    _settingFactory: SettingFactoryMain,
    _leagueClient: LeagueClientMain,
    _championData: ChampionDataMain,
    _windowManager: WindowManagerMain,
    _loggerFactory: LoggerFactoryMain
  ) {
    this._settingService = _settingFactory.register(
      HextechAugmentMain.id,
      { enabled: { default: this.settings.enabled, schema: z.boolean() } },
      this.settings
    )
    this._controller = new HextechAugmentOverlayController(
      _leagueClient,
      _championData,
      _windowManager.hextechAugmentWindow,
      this.settings,
      this.state,
      _loggerFactory.create(HextechAugmentMain.id)
    )
  }

  async onInit() {
    await this._settingService.applyToState()
    this._mobxUtils.propSync(HextechAugmentMain.id, 'settings', this.settings, ['enabled'])
    this._mobxUtils.propSync(HextechAugmentMain.id, 'state', this.state, ['snapshot', 'error'])
    this._controller.watch()
  }

  async onDispose() {
    this._controller.dispose()
  }
}
