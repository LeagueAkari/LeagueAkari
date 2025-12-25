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

  private readonly _log: AkariLogger

  public readonly gtimg = new ExtraAssetsStateGtimg()
  public readonly fandom = new ExtraAssetsStateFandom()

  private _gtimgApi = new GtimgApi()
  private _fandomApi = new LolFandomWikiApi()

  constructor(
    private readonly _app: AppCommonMain,
    readonly _loggerFactory: LoggerFactoryMain,
    private readonly _mobx: MobxUtilsMain
  ) {
    this._log = _loggerFactory.create(ExtraAssetsMain.id)
  }

  static GTIMG_HERO_LIST_UPDATE_INTERVAL = 3 * 60 * 60 * 1000 // 3 hour
  static FANDOM_BALANCE_UPDATE_INTERVAL = 4 * 60 * 60 * 1000 // 4 hour

  private _gtimgTask = new TimeoutTask(this._updateGtimgHeroList.bind(this))
  private _fandomTask = new TimeoutTask(this._updateFandomBalance.bind(this))

  private async _updateGtimgHeroList() {
    try {
      this._log.info('Gtimg: updating "hero_list"')
      const heroList = await this._gtimgApi.getHeroList()
      this.gtimg.setHeroList(heroList)
    } catch (error) {
      this._log.warn(`Gtimg: failed to update hero list, will retry`, error)
    } finally {
      this._gtimgTask.start({ delay: ExtraAssetsMain.GTIMG_HERO_LIST_UPDATE_INTERVAL })
    }
  }

  private async _updateFandomBalance() {
    try {
      this._log.info('Fandom: updating balance data')
      const balance = await this._fandomApi.getBalance()
      this.fandom.setBalance(balance)
    } catch (error) {
      this._log.warn('Fandom: failed to update balance data', error)
    } finally {
      this._fandomTask.start({ delay: ExtraAssetsMain.FANDOM_BALANCE_UPDATE_INTERVAL })
    }
  }

  private _handleUpdateHttpProxy() {
    this._mobx.reaction(
      () => this._app.settings.httpProxy,
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
    this._mobx.propSync(ExtraAssetsMain.id, 'gtimg', this.gtimg, ['heroList'])
    this._mobx.propSync(ExtraAssetsMain.id, 'fandom', this.fandom, ['balance'])

    this._updateGtimgHeroList()
    this._updateFandomBalance()
    this._handleUpdateHttpProxy()
  }
}
