import type { AkariProtocolRenderer } from '@renderer-shared/shards/akari-protocol'
import { Qq101HttpApiAxiosHelper } from '@shared/http-api-axios-helper/qq101'
import axios from 'axios'

export function createChampionDataApis(protocol: AkariProtocolRenderer) {
  const qq101Http = axios.create({ baseURL: 'akari://qq101', adapter: 'fetch' })
  protocol.installProxyRequestCancellation(qq101Http)
  return {
    qq101: new Qq101HttpApiAxiosHelper(qq101Http)
  }
}
