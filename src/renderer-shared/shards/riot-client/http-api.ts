import { RiotClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/riot-client'
import axios from 'axios'

export function createRiotClientHttpClient() {
  return axios.create({
    baseURL: 'akari://riot-client',
    adapter: 'fetch',
    paramsSerializer: { indexes: null }
  })
}

export function createRiotClientHttpApi() {
  const httpClient = createRiotClientHttpClient()

  return {
    httpClient,
    api: new RiotClientHttpApiAxiosHelper(httpClient)
  }
}
