import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { GtimgApi } from '@shared/data-sources/gtimg'
import { LolQqWeekFreeApi } from '@shared/data-sources/lol-qq-weekfree'
import { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'

import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { NetworkMain } from '../network'
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

  constructor(
    private readonly _network: NetworkMain,
    private readonly _ipc: AkariIpcMain,
    _loggerFactory: LoggerFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain
  ) {
    this._logger = _loggerFactory.create(ExtraAssetsMain.id)
    this._context = {
      namespace: ExtraAssetsMain.id,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      gtimg: this.gtimg,
      opgg: this.opgg,
      gtimgApi: new GtimgApi(
        this._network.createAxiosClient({
          baseURL: GtimgApi.BASE_URL,
          headers: { 'User-Agent': GtimgApi.USER_AGENT }
        })
      ),
      opggApi: new OpggHttpApiAxiosHelper(this._network.createAxiosClient()),
      weekFreeApi: new LolQqWeekFreeApi(
        this._network.createAxiosClient({
          headers: { 'User-Agent': LolQqWeekFreeApi.USER_AGENT }
        })
      )
    }
    this._refreshController = new ExtraAssetsRefreshController(this._context)
  }

  async onInit() {
    this._mobxUtils.propSync(ExtraAssetsMain.id, 'gtimg', this.gtimg, ['heroList', 'kiwiAugments'])
    this._mobxUtils.propSync(ExtraAssetsMain.id, 'opgg', this.opgg, ['aramBalance'])

    // 渲染进程可主动触发一次英雄列表（含大乱斗周免）刷新
    this._ipc.onCall(ExtraAssetsMain.id, 'refreshGtimgHeroList', () =>
      this._refreshController.refreshGtimgHeroList()
    )

    // 渲染进程可主动触发一次官方大乱斗免费英雄名单刷新
    this._ipc.onCall(ExtraAssetsMain.id, 'refreshAramFreeChampions', () =>
      this._refreshController.refreshAramFreeChampions()
    )

    // 渲染进程可主动触发一次召唤师峡谷每周免费英雄名单刷新
    this._ipc.onCall(ExtraAssetsMain.id, 'refreshRiftFreeChampions', () =>
      this._refreshController.refreshRiftFreeChampions()
    )

    this._refreshController.start()
  }
}
