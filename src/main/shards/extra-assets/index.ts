import { createChampionDataHttpClient } from '@main/utils/champion-data-http'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { GtimgApi } from '@shared/data-sources/gtimg'
import { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import { OPGG_ARAM_BALANCE_SYNC_NAMESPACE } from '@shared/shards/extra-assets'

import { FeatureGatingMain } from '../feature-gating'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { NetworkMain } from '../network'
import { ExtraAssetsRefreshController } from './asset-refresh-controller'
import {
  EXTRA_ASSETS_MAIN_NAMESPACE,
  type ExtraAssetsMainContext,
  GTIMG_HERO_LIST_UPDATE_INTERVAL,
  GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL
} from './context'
import { OpggAramBalanceLoader } from './opgg/aram-balance-loader'
import { ExtraAssetsStateGtimg, ExtraAssetsStateOpgg } from './state'

/**
 * 一些额外资源的拉取, 通常不属于 Akari 的一部分, 不影响核心逻辑, 可有可无
 */
@Shard(ExtraAssetsMain.id)
export class ExtraAssetsMain implements IAkariShardInitDispose {
  static id = EXTRA_ASSETS_MAIN_NAMESPACE

  static GTIMG_HERO_LIST_UPDATE_INTERVAL = GTIMG_HERO_LIST_UPDATE_INTERVAL // 3 hour
  static GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL = GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL // 3 hour

  private readonly _logger: AkariLogger
  private readonly _context: ExtraAssetsMainContext
  private readonly _refreshController: ExtraAssetsRefreshController
  private readonly _aramBalanceLoader: OpggAramBalanceLoader

  public readonly gtimg = new ExtraAssetsStateGtimg()
  public readonly opgg = new ExtraAssetsStateOpgg()

  constructor(
    private readonly _network: NetworkMain,
    _loggerFactory: LoggerFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _featureGating: FeatureGatingMain
  ) {
    this._logger = _loggerFactory.create(ExtraAssetsMain.id)
    this._context = {
      namespace: ExtraAssetsMain.id,
      featureGating: this._featureGating,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      gtimg: this.gtimg,
      gtimgApi: new GtimgApi(
        this._network.createAxiosClient({
          baseURL: GtimgApi.BASE_URL,
          headers: { 'User-Agent': GtimgApi.USER_AGENT }
        })
      )
    }
    this._refreshController = new ExtraAssetsRefreshController(this._context)

    const opggHttp = createChampionDataHttpClient(this._network, {
      baseURL: OpggHttpApiAxiosHelper.BASE_URL
    })
    this._aramBalanceLoader = new OpggAramBalanceLoader(
      this.opgg,
      this._logger,
      new OpggHttpApiAxiosHelper(opggHttp)
    )
  }

  async onInit() {
    this._mobxUtils.propSync(ExtraAssetsMain.id, 'gtimg', this.gtimg, [
      'enabled',
      'heroList',
      'kiwiAugments',
      'classicHeroes',
      'guideCatalogs'
    ])

    this._mobxUtils.propSync(OPGG_ARAM_BALANCE_SYNC_NAMESPACE, 'resources', this.opgg, [
      'aramBalance'
    ])

    this._refreshController.start()
    this._aramBalanceLoader.start()
  }

  async onDispose() {
    this._refreshController.dispose()
    this._aramBalanceLoader.dispose()
  }
}
