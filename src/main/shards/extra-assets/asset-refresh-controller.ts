import { TimeoutTask } from '@main/utils/timer'

import {
  type ExtraAssetsMainContext,
  FANDOM_BALANCE_UPDATE_INTERVAL,
  GTIMG_HERO_LIST_UPDATE_INTERVAL,
  GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL
} from './context'

export class ExtraAssetsRefreshController {
  private _gtimgTask = new TimeoutTask(this._updateGtimgHeroList.bind(this))
  private _gtimgKiwiAugmentsTask = new TimeoutTask(this._updateGtimgKiwiAugments.bind(this))
  private _fandomTask = new TimeoutTask(this._updateFandomBalance.bind(this))

  constructor(private readonly context: ExtraAssetsMainContext) {}

  start() {
    void this._updateGtimgHeroList()
    void this._updateGtimgKiwiAugments()
    void this._updateFandomBalance()
    this._registerHttpProxy()
  }

  private async _updateGtimgHeroList() {
    const { gtimg, gtimgApi, logger } = this.context

    try {
      logger.info('Gtimg: updating "hero_list"')
      const heroList = await gtimgApi.getHeroList()
      gtimg.setHeroList(heroList)
    } catch (error) {
      logger.warn(`Gtimg: failed to update hero list, will retry`, error)
    } finally {
      this._gtimgTask.start({ delay: GTIMG_HERO_LIST_UPDATE_INTERVAL })
    }
  }

  private async _updateGtimgKiwiAugments() {
    const { gtimg, gtimgApi, logger } = this.context

    try {
      logger.info('Gtimg: updating "kiwi_augments"')
      const kiwiAugments = await gtimgApi.getKiwiAugments()
      gtimg.setKiwiAugments(kiwiAugments)
    } catch (error) {
      logger.warn('Gtimg: failed to update kiwi augments', error)
    } finally {
      this._gtimgKiwiAugmentsTask.start({
        delay: GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL
      })
    }
  }

  private async _updateFandomBalance() {
    const { fandom, fandomApi, logger } = this.context

    try {
      logger.info('Fandom: updating balance data')
      const balance = await fandomApi.getBalance()
      fandom.setBalance(balance)
    } catch (error) {
      logger.warn('Fandom: failed to update balance data', error)
    } finally {
      this._fandomTask.start({ delay: FANDOM_BALANCE_UPDATE_INTERVAL })
    }
  }

  private _registerHttpProxy() {
    const { appCommon, fandomApi, gtimgApi, mobxUtils } = this.context

    mobxUtils.reaction(
      () => appCommon.settings.httpProxy,
      (httpProxy) => {
        if (httpProxy.strategy === 'force') {
          gtimgApi.http.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
          fandomApi.http.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
        } else if (httpProxy.strategy === 'disable') {
          gtimgApi.http.defaults.proxy = false
          fandomApi.http.defaults.proxy = false
        }
      },
      { fireImmediately: true }
    )
  }
}
