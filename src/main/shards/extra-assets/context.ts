import type { GtimgApi } from '@shared/data-sources/gtimg'
import type { LolQqWeekFreeApi } from '@shared/data-sources/lol-qq-weekfree'
import type { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'

import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { ExtraAssetsStateGtimg, ExtraAssetsStateOpgg } from './state'

export const EXTRA_ASSETS_MAIN_NAMESPACE = 'extra-assets-main'
export const GTIMG_HERO_LIST_UPDATE_INTERVAL = 3 * 60 * 60 * 1000
export const GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL = 3 * 60 * 60 * 1000
export const OPGG_ARAM_BALANCE_UPDATE_INTERVAL = 30 * 60 * 1000

export interface ExtraAssetsMainContext {
  namespace: string
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  gtimg: ExtraAssetsStateGtimg
  opgg: ExtraAssetsStateOpgg
  gtimgApi: GtimgApi
  opggApi: OpggHttpApiAxiosHelper
  weekFreeApi: LolQqWeekFreeApi
}
