import { RiotClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/riot-client'
import axios from 'axios'

export function createRiotClientHttpApi() {
  return new RiotClientHttpApiAxiosHelper(
    axios.create({
      baseURL: 'akari://riot-client',
      adapter: 'fetch',
      paramsSerializer: { indexes: null }
    })
  )
}
