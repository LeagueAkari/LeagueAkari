import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { GtimgApi } from '@shared/data-sources/gtimg'
import { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import axios from 'axios'

import { AppCommonMain } from '../app-common'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { ExtraAssetsRefreshController } from './asset-refresh-controller'
import {
  EXTRA_ASSETS_MAIN_NAMESPACE,
  type ExtraAssetsMainContext,
  GTIMG_HERO_LIST_UPDATE_INTERVAL,
  GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL,
  OPGG_ARAM_BALANCE_UPDATE_INTERVAL
} from './context'
import { ExtraAssetsStateGtimg, ExtraAssetsStateOpgg } from './state'

/**
 * 一些额外资源的拉取, 通常不属于 Akari 的一部分, 不影响核心逻辑, 可有可无
 */
@Shard(ExtraAssetsMain.id)
export class ExtraAssetsMain implements IAkariShardInitDispose {
  static id = EXTRA_ASSETS_MAIN_NAMESPACE

  static GTIMG_HERO_LIST_UPDATE_INTERVAL = GTIMG_HERO_LIST_UPDATE_INTERVAL // 3 hour
  static GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL = GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL // 3 hour
  static OPGG_ARAM_BALANCE_UPDATE_INTERVAL = OPGG_ARAM_BALANCE_UPDATE_INTERVAL // 30 minutes

  private readonly _logger: AkariLogger
  private readonly _context: ExtraAssetsMainContext
  private readonly _refreshController: ExtraAssetsRefreshController

  public readonly gtimg = new ExtraAssetsStateGtimg()
  public readonly opgg = new ExtraAssetsStateOpgg()

  private readonly _gtimgApi = new GtimgApi()
  private readonly _opggHttpClient = axios.create()
  private readonly _opggApi = new OpggHttpApiAxiosHelper(this._opggHttpClient)

  constructor(
    private readonly _appCommon: AppCommonMain,
    _loggerFactory: LoggerFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain
  ) {
    this._logger = _loggerFactory.create(ExtraAssetsMain.id)
    this._context = {
      namespace: ExtraAssetsMain.id,
      appCommon: this._appCommon,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      gtimg: this.gtimg,
      opgg: this.opgg,
      gtimgApi: this._gtimgApi,
      opggApi: this._opggApi,
      opggHttpClient: this._opggHttpClient
    }
    this._refreshController = new ExtraAssetsRefreshController(this._context)
  }

  async onInit() {
    this._mobxUtils.propSync(ExtraAssetsMain.id, 'gtimg', this.gtimg, ['heroList', 'kiwiAugments'])
    this._mobxUtils.propSync(ExtraAssetsMain.id, 'opgg', this.opgg, ['aramBalance'])

    this._refreshController.start()
  }
}
