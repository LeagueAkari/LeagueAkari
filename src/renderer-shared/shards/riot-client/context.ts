import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'

export const RIOT_CLIENT_RENDERER_NAMESPACE = 'riot-client-renderer'

export interface RiotClientRendererContext {
  piniaMobxUtils: PiniaMobxUtilsRenderer
}
