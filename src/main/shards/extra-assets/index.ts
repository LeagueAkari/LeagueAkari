import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { LolFandomWikiApi } from '@shared/data-sources/fandom'
import { GtimgApi } from '@shared/data-sources/gtimg'

import { AppCommonMain } from '../app-common'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { ExtraAssetsRefreshController } from './asset-refresh-controller'
import {
  EXTRA_ASSETS_MAIN_NAMESPACE,
  type ExtraAssetsMainContext,
  FANDOM_BALANCE_UPDATE_INTERVAL,
  GTIMG_HERO_LIST_UPDATE_INTERVAL,
  GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL
} from './context'
import { ExtraAssetsStateFandom, ExtraAssetsStateGtimg } from './state'

/**
 * 一些额外资源的拉取, 通常不属于 Akari 的一部分, 不影响核心逻辑, 可有可无
 */
@Shard(ExtraAssetsMain.id)
export class ExtraAssetsMain implements IAkariShardInitDispose {
  static id = EXTRA_ASSETS_MAIN_NAMESPACE

  static GTIMG_HERO_LIST_UPDATE_INTERVAL = GTIMG_HERO_LIST_UPDATE_INTERVAL // 3 hour
  static GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL = GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL // 3 hour
  static FANDOM_BALANCE_UPDATE_INTERVAL = FANDOM_BALANCE_UPDATE_INTERVAL // 4 hour

  private readonly _logger: AkariLogger
  private readonly _context: ExtraAssetsMainContext
  private readonly _refreshController: ExtraAssetsRefreshController

  public readonly gtimg = new ExtraAssetsStateGtimg()
  public readonly fandom = new ExtraAssetsStateFandom()

  private _gtimgApi = new GtimgApi()
  private _fandomApi = new LolFandomWikiApi()

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
      fandom: this.fandom,
      gtimgApi: this._gtimgApi,
      fandomApi: this._fandomApi
    }
    this._refreshController = new ExtraAssetsRefreshController(this._context)
  }

  async onInit() {
    this._mobxUtils.propSync(ExtraAssetsMain.id, 'gtimg', this.gtimg, ['heroList', 'kiwiAugments'])
    this._mobxUtils.propSync(ExtraAssetsMain.id, 'fandom', this.fandom, ['balance'])

    this._refreshController.start()
  }
}
