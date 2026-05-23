import type { LolFandomWikiApi } from '@shared/data-sources/fandom'
import type { GtimgApi } from '@shared/data-sources/gtimg'

import type { AppCommonMain } from '../app-common'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { ExtraAssetsStateFandom, ExtraAssetsStateGtimg } from './state'

export const EXTRA_ASSETS_MAIN_NAMESPACE = 'extra-assets-main'
export const GTIMG_HERO_LIST_UPDATE_INTERVAL = 3 * 60 * 60 * 1000
export const GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL = 3 * 60 * 60 * 1000
export const FANDOM_BALANCE_UPDATE_INTERVAL = 4 * 60 * 60 * 1000

export interface ExtraAssetsMainContext {
  namespace: string
  appCommon: AppCommonMain
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  gtimg: ExtraAssetsStateGtimg
  fandom: ExtraAssetsStateFandom
  gtimgApi: GtimgApi
  fandomApi: LolFandomWikiApi
}
