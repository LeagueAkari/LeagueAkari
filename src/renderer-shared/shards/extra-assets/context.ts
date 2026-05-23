import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'

export const EXTRA_ASSETS_MAIN_NAMESPACE = 'extra-assets-main'
export const EXTRA_ASSETS_RENDERER_NAMESPACE = 'extra-assets-renderer'

export interface ExtraAssetsRendererContext {
  piniaMobxUtils: PiniaMobxUtilsRenderer
}
