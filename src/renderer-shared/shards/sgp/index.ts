import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { SgpHttpApiAxiosHelper } from '@shared/http-api-axios-helper/sgp'
import axios from 'axios'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useSgpStore } from './store'

const MAIN_SHARD_NAMESPACE = 'sgp-main'

@Shard(SgpRenderer.id)
export class SgpRenderer implements IAkariShardInitDispose {
  static id = 'sgp-renderer'

  public readonly httpClient = axios.create({
    baseURL: 'akari://sgp',
    adapter: 'fetch',
    paramsSerializer: { indexes: null }
  })
  public readonly api: SgpHttpApiAxiosHelper

  constructor(
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer
  ) {
    this.api = new SgpHttpApiAxiosHelper(this.httpClient)
  }

  async onInit() {
    const store = useSgpStore()

    await this._piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'state', store)

    // @ts-ignore
    window.sgpApi = this.api
  }
}
