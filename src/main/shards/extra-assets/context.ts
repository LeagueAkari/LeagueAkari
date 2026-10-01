import type { GtimgApi } from '@shared/data-sources/gtimg'

import type { FeatureGatingMain } from '../feature-gating'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { ExtraAssetsStateGtimg } from './state'

export const EXTRA_ASSETS_MAIN_NAMESPACE = 'extra-assets-main'
export const GTIMG_HERO_LIST_UPDATE_INTERVAL = 3 * 60 * 60 * 1000
export const GTIMG_KIWI_AUGMENTS_UPDATE_INTERVAL = 3 * 60 * 60 * 1000

export interface ExtraAssetsMainContext {
  featureGating: FeatureGatingMain
  namespace: string
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  gtimg: ExtraAssetsStateGtimg
  gtimgApi: GtimgApi
}
