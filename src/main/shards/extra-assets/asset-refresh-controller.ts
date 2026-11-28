import { TimeoutTask } from '@main/utils/timer'

import {
  type ExtraAssetsMainContext,
  GTIMG_HERO_LIST_UPDATE_INTERVAL,
  GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL,
  OPGG_ARAM_BALANCE_UPDATE_INTERVAL
} from './context'

export class ExtraAssetsRefreshController {
  private _gtimgTask = new TimeoutTask(this.refreshGtimgHeroList.bind(this))
  private _gtimgKiwiAugmentsTask = new TimeoutTask(this._updateGtimgKiwiAugments.bind(this))
  private _opggAramBalanceTask = new TimeoutTask(this._updateOpggAramBalance.bind(this))

  constructor(private readonly context: ExtraAssetsMainContext) {}

  start() {
    void this.refreshGtimgHeroList()
    void this._updateGtimgKiwiAugments()
    void this._updateOpggAramBalance()
  }

  /**
   * 拉取 / 强制刷新 gtimg 英雄列表（含大乱斗周免标记 `isARAMweekfree`），
   * 供定时任务与渲染进程的手动刷新入口共用，成功时返回最新的英雄列表。
   */
  async refreshGtimgHeroList() {
    const { gtimg, gtimgApi, logger } = this.context

    try {
      logger.info('Gtimg: updating "hero_list"')
      const heroList = await gtimgApi.getHeroList()
      gtimg.setHeroList(heroList)
      return heroList
    } catch (error) {
      logger.warn(`Gtimg: failed to update hero list, will retry`, error)
      return null
    } finally {
      this._gtimgTask.start({ delay: GTIMG_HERO_LIST_UPDATE_INTERVAL })
    }
  }

  /**
   * 拉取官方大乱斗免费英雄名单（对应「每周免费英雄」页面），
   * 供渲染进程在页面加载时自动同步，成功时返回英雄 id 列表。
   */
  async refreshAramFreeChampions(): Promise<number[] | null> {
    const { logger, weekFreeApi } = this.context

    try {
      logger.info('LOL QQ: updating ARAM free champion list')
      const ids = await weekFreeApi.getAramFreeChampionIds()

      if (!ids.length) {
        logger.warn('LOL QQ: ARAM free champion list is empty')
        return null
      }

      logger.info(`LOL QQ: updated ARAM free champion list (${ids.length} items)`)
      return ids
    } catch (error) {
      logger.warn('LOL QQ: failed to update ARAM free champion list', error)
      return null
    }
  }

  /**
   * 拉取当期召唤师峡谷每周免费英雄名单（同一「每周免费英雄」数据源的 freeHero 字段），
   * 供渲染进程在页面加载时自动同步，成功时返回英雄 id 列表。
   */
  async refreshRiftFreeChampions(): Promise<number[] | null> {
    const { logger, weekFreeApi } = this.context

    try {
      logger.info('LOL QQ: updating Rift free champion list')
      const ids = await weekFreeApi.getRiftFreeChampionIds()

      if (!ids.length) {
        logger.warn('LOL QQ: Rift free champion list is empty')
        return null
      }

      logger.info(`LOL QQ: updated Rift free champion list (${ids.length} items)`)
      return ids
    } catch (error) {
      logger.warn('LOL QQ: failed to update Rift free champion list', error)
      return null
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
}
