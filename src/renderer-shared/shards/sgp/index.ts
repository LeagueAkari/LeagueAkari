import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type { SgpHttpApiAxiosHelper } from '@shared/http-api-axios-helper/sgp'
import type { AxiosInstance } from 'axios'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SGP_RENDERER_NAMESPACE, type SgpRendererContext } from './context'
import { exposeSgpApiForDebugging } from './dev-exposure'
import { createSgpApi } from './http-api'
import { syncSgpState } from './state-sync'

@Shard(SgpRenderer.id)
export class SgpRenderer implements IAkariShardInitDispose {
  static id = SGP_RENDERER_NAMESPACE

  public readonly httpClient: AxiosInstance
  public readonly api: SgpHttpApiAxiosHelper
  private readonly _context: SgpRendererContext

  constructor(@Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer) {
    const { httpClient, api } = createSgpApi()

    this.httpClient = httpClient
    this.api = api
    this._context = {
      api,
      httpClient,
      piniaMobxUtils
    }
  }

  async onInit() {
    await syncSgpState(this._context)
    exposeSgpApiForDebugging(this._context)
  }
}
