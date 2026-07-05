import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type { RiotClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/riot-client'
import type { AxiosInstance } from 'axios'

import { AkariProtocolRenderer } from '../akari-protocol'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { RIOT_CLIENT_RENDERER_NAMESPACE } from './context'
import { createRiotClientHttpApi } from './http-api'

@Shard(RiotClientRenderer.id)
export class RiotClientRenderer implements IAkariShardInitDispose {
  static id = RIOT_CLIENT_RENDERER_NAMESPACE

  public readonly httpClient: AxiosInstance
  public readonly api: RiotClientHttpApiAxiosHelper

  async onInit() {}

  constructor(
    @Dep(PiniaMobxUtilsRenderer) _piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(AkariProtocolRenderer) akariProtocol: AkariProtocolRenderer
  ) {
    const { httpClient, api } = createRiotClientHttpApi()

    akariProtocol.installProxyRequestCancellation(httpClient)

    this.httpClient = httpClient
    this.api = api
  }
}
