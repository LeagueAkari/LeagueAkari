import type { AkariProtocolRenderer } from '@renderer-shared/shards/akari-protocol'
import { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import { Qq101HttpApiAxiosHelper } from '@shared/http-api-axios-helper/qq101'
import axios from 'axios'

export function createChampionDataApis(protocol: AkariProtocolRenderer) {
  const opggHttp = axios.create({ baseURL: 'akari://opgg', adapter: 'fetch' })
  protocol.installProxyRequestCancellation(opggHttp)
  const qq101Http = axios.create({ baseURL: 'akari://qq101', adapter: 'fetch' })
  protocol.installProxyRequestCancellation(qq101Http)

  return {
    opgg: new OpggHttpApiAxiosHelper(opggHttp),
    qq101: new Qq101HttpApiAxiosHelper(qq101Http)
  }
}
