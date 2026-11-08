import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { Qq101HttpApiAxiosHelper } from '@shared/http-api-axios-helper/qq101'
import type { AxiosRetry } from 'axios-retry'
import { z } from 'zod'

import { ChampionDataMain } from '../champion-data'
import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { type AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { NetworkMain } from '../network'
import { SettingFactoryMain } from '../setting-factory'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import {
  DRAFT_ADVISOR_MAIN_NAMESPACE,
  DRAFT_ADVISOR_MAX_CANDIDATE_LIMIT,
  DRAFT_ADVISOR_MIN_CANDIDATE_LIMIT,
  type DraftAdvisorMainContext
} from './context'
import { DraftAdvisorIpcHandlers } from './ipc-handlers'
import { DraftAdvisorMatchupLoader } from './matchup-data-loader'
import { DraftAdvisorRecommendationController } from './recommendation-controller'
import { DraftAdvisorSettings, DraftAdvisorState } from './state'

const axiosRetry = require('axios-retry').default as AxiosRetry

@Shard(DraftAdvisorMain.id)
export class DraftAdvisorMain implements IAkariShardInitDispose {
  static id = DRAFT_ADVISOR_MAIN_NAMESPACE

  public readonly settings = new DraftAdvisorSettings()
  public readonly state = new DraftAdvisorState()

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService<DraftAdvisorSettings>
  private readonly _context: DraftAdvisorMainContext
  private readonly _loader: DraftAdvisorMatchupLoader
  private readonly _recommendationController: DraftAdvisorRecommendationController
  private readonly _ipcHandlers: DraftAdvisorIpcHandlers

  constructor(
    private readonly _network: NetworkMain,
    private readonly _ipc: AkariIpcMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _championData: ChampionDataMain,
    loggerFactory: LoggerFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain,
    settingFactory: SettingFactoryMain
  ) {
    this._logger = loggerFactory.create(DraftAdvisorMain.id)
    this._settingService = settingFactory.register(
      DraftAdvisorMain.id,
      {
        enabled: { default: this.settings.enabled, schema: z.boolean() },
        candidateLimit: {
          default: this.settings.candidateLimit,
          schema: z
            .number()
            .int()
            .min(DRAFT_ADVISOR_MIN_CANDIDATE_LIMIT)
            .max(DRAFT_ADVISOR_MAX_CANDIDATE_LIMIT)
        },
        includeBaseWinRate: { default: this.settings.includeBaseWinRate, schema: z.boolean() },
        riskLevel: { default: this.settings.riskLevel, schema: z.enum(['low', 'medium', 'high']) }
      },
      this.settings
    )

    const qq101HttpClient = this._createQq101HttpClient()
    const qq101Api = new Qq101HttpApiAxiosHelper(qq101HttpClient)

    this._context = {
      namespace: DraftAdvisorMain.id,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      settings: this.settings,
      state: this.state,
      settingService: this._settingService,
      championData: this._championData
    }

    this._loader = new DraftAdvisorMatchupLoader(this._logger, this._championData, qq101Api)
    this._recommendationController = new DraftAdvisorRecommendationController(
      this._context,
      this._leagueClient,
      this._loader
    )
    this._ipcHandlers = new DraftAdvisorIpcHandlers(this._context, this._ipc)
  }

  async onInit() {
    await this._settingService.applyToState()

    this._mobxUtils.propSync(DraftAdvisorMain.id, 'settings', this.settings, [
      'enabled',
      'candidateLimit',
      'includeBaseWinRate',
      'riskLevel'
    ])
    this._mobxUtils.propSync(DraftAdvisorMain.id, 'state', this.state, ['snapshot'])

    this._recommendationController.start()
    this._ipcHandlers.register()
  }

  async onDispose() {
    this._recommendationController.dispose()
    this._ipcHandlers.dispose()
  }

  private _createQq101HttpClient() {
    // 与 champion-data 的 QQ101 请求头保持一致, 该端点依赖 Referer 才会返回数据。
    const client = this._network.createAxiosClient({
      timeout: 8_000,
      headers: {
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://101.qq.com/',
        'User-Agent': 'LeagueAkari'
      }
    })

    axiosRetry(client, {
      retries: 1,
      shouldResetTimeout: true,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: axiosRetry.isNetworkOrIdempotentRequestError
    })

    return client
  }
}
