import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { Dep, Shard } from '@shared/akari-shard'
import { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import axios from 'axios'

import {
  OPGG_RENDERER_NAMESPACE,
  type OpggPreferenceUpdate,
  type OpggRendererContext
} from './context'
import { OpggWatcher } from './opgg-watcher'
import { OpggPreferencesService } from './preferences-service'
import { syncOpggSettings } from './settings-sync'

@Shard(OpggRenderer.id)
export class OpggRenderer {
  static id = OPGG_RENDERER_NAMESPACE

  private _httpClient = axios.create()

  public readonly api = new OpggHttpApiAxiosHelper(this._httpClient)

  private readonly _context: OpggRendererContext
  private readonly _preferencesService: OpggPreferencesService
  private readonly _watcher: OpggWatcher

  constructor(
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer,
    @Dep(LeagueClientRenderer) private readonly _leagueClient: LeagueClientRenderer,
    @Dep(LoggerRenderer) private readonly _logger: LoggerRenderer
  ) {
    this._context = {
      namespace: OpggRenderer.id,
      setupInAppScope: this._setupInAppScope,
      settingUtils: this._settingUtils,
      leagueClient: this._leagueClient,
      logger: this._logger,
      httpClient: this._httpClient,
      api: this.api
    }
    this._preferencesService = new OpggPreferencesService(this._context)
    this._watcher = new OpggWatcher(this._context)
  }

  async onInit() {
    await syncOpggSettings(this._context)
    await this._preferencesService.migrate()
    await this._preferencesService.restore()
    this._watcher.start()
  }

  async updatePreferences(options: OpggPreferenceUpdate) {
    return this._preferencesService.update(options)
  }
}
