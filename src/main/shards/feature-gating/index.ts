import { is } from '@electron-toolkit/utils'
import { Shard, SharedGlobalShard } from '@shared/akari-shard'
import {
  type FeatureGateDevOverride,
  FeatureGateEvaluator,
  isFeatureGateConfigured,
  isFeatureGateEnabled,
  restoreFeatureGateDevOverrides
} from '@shared/shards/feature-gating'
import { getSgpServerId } from '@shared/utils/sgp'

import { AkariApiMain } from '../akari-api'
import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import { FeatureGateDevOverrideController } from './dev-override-controller'
import { FeatureGatingIpcHandlers } from './ipc-handlers'
import { FeatureGatingSettings, featureGateDevOverridesSchema } from './state'

@Shard(FeatureGatingMain.id)
export class FeatureGatingMain {
  static readonly id = 'feature-gating-main'

  public readonly settings = new FeatureGatingSettings()

  private readonly _evaluator = new FeatureGateEvaluator()
  private readonly _settingService: SetterSettingService<FeatureGatingSettings>
  private readonly _devOverrideController: FeatureGateDevOverrideController
  private readonly _ipcHandlers: FeatureGatingIpcHandlers

  constructor(
    private readonly _shared: SharedGlobalShard,
    private readonly _akariApi: AkariApiMain,
    private readonly _leagueClient: LeagueClientMain,
    _ipc: AkariIpcMain,
    private readonly _mobxUtils: MobxUtilsMain,
    _settingFactory: SettingFactoryMain
  ) {
    this._settingService = _settingFactory.register(
      FeatureGatingMain.id,
      {
        devOverrides: {
          default: this.settings.devOverrides,
          schema: featureGateDevOverridesSchema,
          restore: ({ value }) => restoreFeatureGateDevOverrides(value)
        }
      },
      this.settings
    )
    this._devOverrideController = new FeatureGateDevOverrideController(
      this.settings,
      this._settingService,
      is.dev
    )
    this._ipcHandlers = new FeatureGatingIpcHandlers(
      FeatureGatingMain.id,
      _ipc,
      this._devOverrideController
    )
  }

  async onInit() {
    if (is.dev) {
      await this._settingService.applyToState()
      this._mobxUtils.propSync(FeatureGatingMain.id, 'settings', this.settings, 'devOverrides')
    }

    this._ipcHandlers.register()
  }

  isEnabled(key: string, defaultValue: boolean) {
    return isFeatureGateEnabled(key, defaultValue, this._evaluate())
  }

  hasConfiguredGate(key: string) {
    return isFeatureGateConfigured(key, this._evaluate())
  }

  setDevOverride(key: string, value: FeatureGateDevOverride | null) {
    return this._devOverrideController.setDevOverride(key, value)
  }

  private _evaluate() {
    const auth = this._leagueClient.state.auth
    return this._evaluator.evaluate(
      this._akariApi.state.featureGates,
      {
        platform: this._shared.global.platform,
        version: this._shared.global.version,
        sgpServerId: auth ? getSgpServerId(auth.region, auth.rsoPlatformId) : ''
      },
      this._devOverrideController.activeOverrides
    )
  }
}
