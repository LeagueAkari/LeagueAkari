import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoChampConfigController } from './auto-config-controller'
import {
  AUTO_CHAMP_CONFIG_MAIN_NAMESPACE,
  type AutoChampionConfigMainContext,
  GAME_MODE_TYPE_MAP
} from './context'
import { AutoChampConfigIpcHandlers } from './ipc-handlers'
import { AutoChampConfigSettings, ChampionRunesConfig, SummonerSpellsConfig } from './state'

@Shard(AutoChampionConfigMain.id)
export class AutoChampionConfigMain implements IAkariShardInitDispose {
  static id = AUTO_CHAMP_CONFIG_MAIN_NAMESPACE

  static GAME_MODE_TYPE_MAP = GAME_MODE_TYPE_MAP

  public readonly settings = new AutoChampConfigSettings()

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService
  private readonly _context: AutoChampionConfigMainContext
  private readonly _ipcHandlers: AutoChampConfigIpcHandlers
  private readonly _controller: AutoChampConfigController

  constructor(
    _loggerFactory: LoggerFactoryMain,
    _settingFactory: SettingFactoryMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain
  ) {
    this._logger = _loggerFactory.create(AutoChampionConfigMain.id)
    this._settingService = _settingFactory.register(
      AutoChampionConfigMain.id,
      {
        enabled: { default: this.settings.enabled },
        runesV2: { default: this.settings.runesV2 },
        summonerSpells: { default: this.settings.summonerSpells }
      },
      this.settings
    )

    this._context = {
      namespace: AutoChampionConfigMain.id,
      ipc: this._ipc,
      leagueClient: this._leagueClient,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      settings: this.settings,
      settingService: this._settingService
    }
    this._ipcHandlers = new AutoChampConfigIpcHandlers(this._context, this)
    this._controller = new AutoChampConfigController(this._context)
  }

  async updateRunes(championId: number, key: string, runes: ChampionRunesConfig | null) {
    this.settings.updateRunes(championId, key, runes)
    await this._settingService.set('runesV2', this.settings.runesV2)
  }

  async updateSummonerSpells(championId: number, key: string, spells: SummonerSpellsConfig | null) {
    this.settings.updateSummonerSpells(championId, key, spells)
    await this._settingService.set('summonerSpells', this.settings.summonerSpells)
  }

  private async _setupState() {
    await this._settingService.applyToState()

    this._mobxUtils.propSync(AutoChampionConfigMain.id, 'settings', this.settings, [
      'enabled',
      'runesV2',
      'summonerSpells'
    ])
  }

  async onInit() {
    await this._setupState()
    this._ipcHandlers.register()
    this._controller.watch()
  }
}
