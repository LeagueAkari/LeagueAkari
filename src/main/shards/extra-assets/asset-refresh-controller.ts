import { TimeoutTask } from '@main/utils/timer'
import {
  EXTRA_ASSETS_GTIMG_HERO_LIST_FEATURE_GATE,
  EXTRA_ASSETS_GTIMG_KIWI_AUGMENTS_FEATURE_GATE
} from '@shared/shards/feature-gating/keys'

import {
  type ExtraAssetsMainContext,
  GTIMG_HERO_LIST_UPDATE_INTERVAL,
  GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL
} from './context'

export class ExtraAssetsRefreshController {
  private _gtimgHeroListTask = new TimeoutTask(this._updateGtimgHeroList.bind(this))
  private _gtimgKiwiAugmentsTask = new TimeoutTask(this._updateGtimgKiwiAugments.bind(this))

  private _gtimgHeroListAbortController: AbortController | null = null
  private _gtimgKiwiAugmentsAbortController: AbortController | null = null
  private _disposeHeroListGateWatcher: (() => void) | null = null
  private _disposeKiwiAugmentsGateWatcher: (() => void) | null = null

  constructor(private readonly _context: ExtraAssetsMainContext) {}

  start() {
    this._disposeHeroListGateWatcher = this._context.mobxUtils.reaction(
      () => this._context.featureGating.isEnabled(EXTRA_ASSETS_GTIMG_HERO_LIST_FEATURE_GATE, true),
      (enabled) => {
        this._stopGtimgHeroList()

        if (enabled) {
          this._gtimgHeroListAbortController = new AbortController()
          void this._updateGtimgHeroList()
        }
      },
      { fireImmediately: true }
    )

    this._disposeKiwiAugmentsGateWatcher = this._context.mobxUtils.reaction(
      () =>
        this._context.featureGating.isEnabled(EXTRA_ASSETS_GTIMG_KIWI_AUGMENTS_FEATURE_GATE, true),
      (enabled) => {
        this._stopGtimgKiwiAugments()

        if (enabled) {
          this._gtimgKiwiAugmentsAbortController = new AbortController()
          void this._updateGtimgKiwiAugments()
        }
      },
      { fireImmediately: true }
    )
  }

  dispose() {
    this._disposeHeroListGateWatcher?.()
    this._disposeKiwiAugmentsGateWatcher?.()
    this._disposeHeroListGateWatcher = null
    this._disposeKiwiAugmentsGateWatcher = null

    this._stopGtimgHeroList()
    this._stopGtimgKiwiAugments()
  }

  private _stopGtimgHeroList() {
    this._gtimgHeroListAbortController?.abort()
    this._gtimgHeroListAbortController = null
    this._gtimgHeroListTask.cancel()
    this._context.gtimg.setHeroList(null)
    this._context.gtimg.setClassicHeroes(null)
  }

  private _stopGtimgKiwiAugments() {
    this._gtimgKiwiAugmentsAbortController?.abort()
    this._gtimgKiwiAugmentsAbortController = null
    this._gtimgKiwiAugmentsTask.cancel()
    this._context.gtimg.setKiwiAugments(null)
  }

  private async _updateGtimgHeroList() {
    const signal = this._gtimgHeroListAbortController?.signal

    if (!signal || signal.aborted) {
      return
    }

    const { gtimg, gtimgApi, logger } = this._context

    try {
      logger.info('Gtimg: updating "hero_list"')
      await Promise.allSettled([
        gtimgApi
          .getHeroList(signal)
          .then((heroes) => {
            if (!signal.aborted) {
              gtimg.setHeroList(heroes)
            }
          })
          .catch((error) => {
            if (!signal.aborted) {
              logger.warn('Gtimg: failed to update hero list', error)
            }
          }),
        gtimgApi
          .getClassicHeroes(signal)
          .then((heroes) => {
            if (!signal.aborted) {
              gtimg.setClassicHeroes(heroes)
            }
          })
          .catch((error) => {
            if (!signal.aborted) {
              logger.warn('Gtimg: failed to update classic hero list', error)
            }
          })
      ])
    } catch (error) {
      if (signal.aborted) {
        return
      }

      logger.warn(`Gtimg: failed to update hero list, will retry`, error)
    } finally {
      if (!signal.aborted) {
        this._gtimgHeroListTask.start({ delay: GTIMG_HERO_LIST_UPDATE_INTERVAL })
      }
    }
  }

  private async _updateGtimgKiwiAugments() {
    const signal = this._gtimgKiwiAugmentsAbortController?.signal

    if (!signal || signal.aborted) {
      return
    }

    const { gtimg, gtimgApi, logger } = this._context

    try {
      logger.info('Gtimg: updating "kiwi_augments"')
      const kiwiAugments = await gtimgApi.getKiwiAugments(signal)

      if (!signal.aborted) {
        gtimg.setKiwiAugments(kiwiAugments)
      }
    } catch (error) {
      if (signal.aborted) {
        return
      }

      logger.warn('Gtimg: failed to update kiwi augments', error)
    } finally {
      if (!signal.aborted) {
        this._gtimgKiwiAugmentsTask.start({ delay: GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL })
      }
    }
  }
}
