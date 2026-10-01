import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { GtimgApi } from '@shared/data-sources/gtimg'

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
import { ExtraAssetsStateGtimg } from './state'

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

  public readonly gtimg = new ExtraAssetsStateGtimg()

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
  }

  async onInit() {
    this._mobxUtils.propSync(ExtraAssetsMain.id, 'gtimg', this.gtimg, [
      'heroList',
      'kiwiAugments',
      'classicHeroes'
    ])

    this._refreshController.start()
  }

  async onDispose() {
    this._refreshController.dispose()
  }
}
