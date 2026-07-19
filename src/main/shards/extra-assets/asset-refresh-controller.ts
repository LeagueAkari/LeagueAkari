import { TimeoutTask } from '@main/utils/timer'

import {
  type ExtraAssetsMainContext,
  GTIMG_HERO_LIST_UPDATE_INTERVAL,
  GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL,
  OPGG_ARAM_BALANCE_UPDATE_INTERVAL
} from './context'

export class ExtraAssetsRefreshController {
  private _gtimgTask = new TimeoutTask(this._updateGtimgHeroList.bind(this))
  private _gtimgKiwiAugmentsTask = new TimeoutTask(this._updateGtimgKiwiAugments.bind(this))
  private _opggAramBalanceTask = new TimeoutTask(this._updateOpggAramBalance.bind(this))

  constructor(private readonly context: ExtraAssetsMainContext) {}

  start() {
    this._registerHttpProxy()
    void this._updateGtimgHeroList()
    void this._updateGtimgKiwiAugments()
    void this._updateOpggAramBalance()
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

  private async _updateOpggAramBalance() {
    const { logger, opgg, opggApi } = this.context

    try {
      logger.info('OP.GG: updating ARAM balance data')
      const { data } = await opggApi.getAramBalance()
      opgg.setAramBalance(data.data)
      logger.info(`OP.GG: updated ARAM balance data (${data.data.length} items)`)
    } catch (error) {
      logger.warn('OP.GG: failed to update ARAM balance data', error)
    } finally {
      this._opggAramBalanceTask.start({ delay: OPGG_ARAM_BALANCE_UPDATE_INTERVAL })
    }
  }

  private _registerHttpProxy() {
    const { appCommon, gtimgApi, mobxUtils, opggHttpClient } = this.context

    mobxUtils.reaction(
      () => appCommon.settings.httpProxy,
      (httpProxy) => {
        if (httpProxy.strategy === 'force') {
          gtimgApi.http.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
          opggHttpClient.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
        } else if (httpProxy.strategy === 'disable') {
          gtimgApi.http.defaults.proxy = false
          opggHttpClient.defaults.proxy = false
        }
      },
      { fireImmediately: true }
    )
  }
}
