import type { PiniaMobxUtilsRenderer } from '@renderer-shared/shards/pinia-mobx-utils'

export const ONGOING_GAME_MAIN_NAMESPACE = 'ongoing-game-main'
export const ADDITIONAL_INFO_RENDERER_NAMESPACE = 'additional-info-renderer'

export interface AdditionalInfoRendererContext {
  piniaMobxUtils: PiniaMobxUtilsRenderer
}
