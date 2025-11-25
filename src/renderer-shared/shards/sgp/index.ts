import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { SgpHttpApiAxiosHelper } from '@shared/http-api-axios-helper/sgp'
import axios from 'axios'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useSgpStore } from './store'

const MAIN_SHARD_NAMESPACE = 'sgp-main'

@Shard(SgpRenderer.id)
export class SgpRenderer implements IAkariShardInitDispose {
  static id = 'sgp-renderer'

  public readonly _http = axios.create({
    baseURL: 'akari://sgp',
    adapter: 'fetch',
    paramsSerializer: { indexes: null }
  })
  public readonly api: SgpHttpApiAxiosHelper

  constructor(@Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer) {
    this.api = new SgpHttpApiAxiosHelper(this._http)
  }

  async onInit() {
    const store = useSgpStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'data', store.data)

    // @ts-ignore
    window.sgpApi = this.api
  }
}
