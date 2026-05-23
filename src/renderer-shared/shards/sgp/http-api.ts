import { SgpHttpApiAxiosHelper } from '@shared/http-api-axios-helper/sgp'
import axios from 'axios'

export function createSgpHttpClient() {
  return axios.create({
    baseURL: 'akari://sgp',
    adapter: 'fetch',
    paramsSerializer: { indexes: null }
  })
}

export function createSgpApi() {
  const httpClient = createSgpHttpClient()

  return {
    httpClient,
    api: new SgpHttpApiAxiosHelper(httpClient)
  }
}
