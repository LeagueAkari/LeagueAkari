import { TimeoutTask } from '@main/utils/timer'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { LolFandomWikiApi } from '@shared/data-sources/fandom'
import { GtimgApi } from '@shared/data-sources/gtimg'

import { AppCommonMain } from '../app-common'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { ExtraAssetsStateFandom, ExtraAssetsStateGtimg } from './state'

/**
 * 一些额外资源的拉取, 通常不属于 Akari 的一部分, 不影响核心逻辑, 可有可无
 */
@Shard(ExtraAssetsMain.id)
export class ExtraAssetsMain implements IAkariShardInitDispose {
  static id = 'extra-assets-main'

  private readonly _logger: AkariLogger

  public readonly gtimg = new ExtraAssetsStateGtimg()
  public readonly fandom = new ExtraAssetsStateFandom()

  private _gtimgApi = new GtimgApi()
  private _fandomApi = new LolFandomWikiApi()

  constructor(
    private readonly _appCommon: AppCommonMain,
    readonly _loggerFactory: LoggerFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain
  ) {
    this._logger = _loggerFactory.create(ExtraAssetsMain.id)
  }

  static GTIMG_HERO_LIST_UPDATE_INTERVAL = 3 * 60 * 60 * 1000 // 3 hour
  static GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL = 3 * 60 * 60 * 1000 // 3 hour
  static FANDOM_BALANCE_UPDATE_INTERVAL = 4 * 60 * 60 * 1000 // 4 hour

  private _gtimgTask = new TimeoutTask(this._updateGtimgHeroList.bind(this))
  private _gtimgKiwiAugmentsTask = new TimeoutTask(this._updateGtimgKiwiAugments.bind(this))
  private _fandomTask = new TimeoutTask(this._updateFandomBalance.bind(this))

  private async _updateGtimgHeroList() {
    try {
      this._logger.info('Gtimg: updating "hero_list"')
      const heroList = await this._gtimgApi.getHeroList()
      this.gtimg.setHeroList(heroList)
    } catch (error) {
      this._logger.warn(`Gtimg: failed to update hero list, will retry`, error)
    } finally {
      this._gtimgTask.start({ delay: ExtraAssetsMain.GTIMG_HERO_LIST_UPDATE_INTERVAL })
    }
  }

  private async _updateGtimgKiwiAugments() {
    try {
      this._logger.info('Gtimg: updating "kiwi_augments"')
      const kiwiAugments = await this._gtimgApi.getKiwiAugments()
      this.gtimg.setKiwiAugments(kiwiAugments)
    } catch (error) {
      this._logger.warn('Gtimg: failed to update kiwi augments', error)
    } finally {
      this._gtimgKiwiAugmentsTask.start({
        delay: ExtraAssetsMain.GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL
      })
    }
  }

  private async _updateFandomBalance() {
    try {
      this._logger.info('Fandom: updating balance data')
      const balance = await this._fandomApi.getBalance()
      this.fandom.setBalance(balance)
    } catch (error) {
      this._logger.warn('Fandom: failed to update balance data', error)
    } finally {
      this._fandomTask.start({ delay: ExtraAssetsMain.FANDOM_BALANCE_UPDATE_INTERVAL })
    }
  }

  private _registerHttpProxy() {
    this._mobxUtils.reaction(
      () => this._appCommon.settings.httpProxy,
      (httpProxy) => {
        if (httpProxy.strategy === 'force') {
          this._gtimgApi.http.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
          this._fandomApi.http.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
        } else if (httpProxy.strategy === 'disable') {
          this._gtimgApi.http.defaults.proxy = false
          this._fandomApi.http.defaults.proxy = false
        }
      },
      { fireImmediately: true }
    )
  }

  async onInit() {
    this._mobxUtils.propSync(ExtraAssetsMain.id, 'gtimg', this.gtimg, ['heroList', 'kiwiAugments'])
    this._mobxUtils.propSync(ExtraAssetsMain.id, 'fandom', this.fandom, ['balance'])

    this._updateGtimgHeroList()
    this._updateGtimgKiwiAugments()
    this._updateFandomBalance()
    this._registerHttpProxy()
  }
}
