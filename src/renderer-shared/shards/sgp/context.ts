import type { SgpHttpApiAxiosHelper } from '@shared/http-api-axios-helper/sgp'
import type { AxiosInstance } from 'axios'

import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'

export const SGP_MAIN_NAMESPACE = 'sgp-main'
export const SGP_RENDERER_NAMESPACE = 'sgp-renderer'

export interface SgpRendererContext {
  api: SgpHttpApiAxiosHelper
  httpClient: AxiosInstance
  piniaMobxUtils: PiniaMobxUtilsRenderer
}
