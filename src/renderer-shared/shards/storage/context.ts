import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'

export const STORAGE_MAIN_NAMESPACE = 'storage-main'
export const STORAGE_RENDERER_NAMESPACE = 'storage-renderer'

export interface StorageRendererContext {
  piniaMobxUtils: PiniaMobxUtilsRenderer
}
