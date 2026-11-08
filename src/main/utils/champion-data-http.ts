import type { NetworkMain } from '@main/shards/network'
import { isAbortError } from '@shared/utils/queue-keeper'
import type { CreateAxiosDefaults } from 'axios'
import type { AxiosRetry } from 'axios-retry'

const axiosRetry = require('axios-retry').default as AxiosRetry

export function createChampionDataHttpClient(network: NetworkMain, defaults: CreateAxiosDefaults) {
  const http = network.createAxiosClient({ timeout: 8_000, ...defaults })

  axiosRetry(http, {
    retries: 1,
    shouldResetTimeout: true,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) =>
      !isAbortError(error) && axiosRetry.isNetworkOrIdempotentRequestError(error)
  })

  return http
}
