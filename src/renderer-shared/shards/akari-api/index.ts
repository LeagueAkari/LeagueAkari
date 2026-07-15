import { Dep, Shard } from '@shared/akari-shard'
import { AkariApiHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/api'
import { AkariStaticHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/static'
import axios from 'axios'

import { AkariProtocolRenderer } from '../akari-protocol'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { useAkariApiStore } from './store'

@Shard(AkariApiRenderer.id)
export class AkariApiRenderer {
  static readonly id = 'akari-api-renderer'
  static readonly mainId = 'akari-api-main'

  public readonly httpClient = axios.create({
    adapter: 'fetch',
    baseURL: 'akari://akari-api',
    paramsSerializer: { indexes: null }
  })
  public readonly staticHttpClient = axios.create({
    adapter: 'fetch',
    baseURL: 'akari://akari-static'
  })
  public readonly api = new AkariApiHttpApiAxiosHelper(this.httpClient)
  public readonly staticAssets = new AkariStaticHttpApiAxiosHelper(this.staticHttpClient)

  constructor(
    @Dep(AkariProtocolRenderer) akariProtocol: AkariProtocolRenderer,
    @Dep(PiniaMobxUtilsRenderer)
    private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer
  ) {
    akariProtocol.installProxyRequestCancellation(this.httpClient)
    akariProtocol.installProxyRequestCancellation(this.staticHttpClient)
  }

  async onInit() {
    const store = useAkariApiStore()
    await this._piniaMobxUtils.sync(AkariApiRenderer.mainId, 'state', store)
    await this._piniaMobxUtils.sync(AkariApiRenderer.mainId, 'settings', store.settings)
  }

  setUpdateLatestRelease(value: boolean) {
    return this._settingUtils.set(AkariApiRenderer.mainId, 'updateLatestRelease', value)
  }
}
