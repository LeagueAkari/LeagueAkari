import { TimeoutTask } from '@main/utils/timer'
import {
  parseGtimgClassicHeroes,
  parseGtimgHeroList,
  parseGtimgKiwiAugments
} from '@shared/data-adapter/gtimg'
import { parseGtimgGuideCatalog } from '@shared/data-adapter/gtimg/guide-resources'
import { EXTRA_ASSETS_GTIMG_FEATURE_GATE } from '@shared/shards/feature-gating/keys'

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

  constructor(private readonly _context: ExtraAssetsMainContext) {}

  start() {
    this._disposeHeroListGateWatcher = this._context.mobxUtils.reaction(
      () => {
        const gate = this._context.featureGating.getEvaluation(
          EXTRA_ASSETS_GTIMG_FEATURE_GATE,
          true
        )
        return !gate.configured || gate.enabled
      },
      (enabled) => {
        this._stopGtimgHeroList()
        this._stopGtimgKiwiAugments()
        this._context.gtimg.setEnabled(enabled)
        if (enabled) {
          this._gtimgHeroListAbortController = new AbortController()
          this._gtimgKiwiAugmentsAbortController = new AbortController()
          void this._updateGtimgHeroList()
          void this._updateGtimgKiwiAugments()
        }
      },
      { fireImmediately: true }
    )
  }

  dispose() {
    this._disposeHeroListGateWatcher?.()
    this._disposeHeroListGateWatcher = null
    this._context.gtimg.setEnabled(false)
    this._stopGtimgHeroList()
    this._stopGtimgKiwiAugments()
  }

  private _stopGtimgHeroList() {
    this._gtimgHeroListAbortController?.abort()
    this._gtimgHeroListAbortController = null
    this._gtimgHeroListTask.cancel()
    this._context.gtimg.setHeroList(null)
    this._context.gtimg.setClassicHeroes(null)
    for (const kind of ['items', 'perks', 'spells'] as const) {
      this._context.gtimg.setGuideCatalog({ kind, entries: {} })
    }
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
        ...(['items', 'perks', 'spells'] as const).map(async (kind) => {
          try {
            const response = await gtimgApi.getGuideCatalog(kind, signal)
            const catalog = parseGtimgGuideCatalog(kind, response.data).data
            if (!signal.aborted) {
              gtimg.setGuideCatalog(catalog)
            }
          } catch (error) {
            if (!signal.aborted) {
              logger.warn(`Gtimg: failed to update ${kind}`, error)
            }
          }
        }),
        gtimgApi
          .getHeroList(signal)
          .then((heroes) => {
            if (!signal.aborted) {
              gtimg.setHeroList(parseGtimgHeroList(heroes).data)
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
              gtimg.setClassicHeroes(parseGtimgClassicHeroes(heroes).data)
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
        gtimg.setKiwiAugments(parseGtimgKiwiAugments(kiwiAugments).data)
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
