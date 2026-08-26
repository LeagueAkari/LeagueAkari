import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios'

import type { ExternalHttpSession } from './context'

type AxiosFetch = NonNullable<NonNullable<CreateAxiosDefaults['env']>['fetch']>

export function createExternalHttpAxiosClient(
  electronSession: ExternalHttpSession,
  waitUntilConfigured: () => Promise<void>,
  defaults: CreateAxiosDefaults = {}
): AxiosInstance {
  const electronFetch: AxiosFetch = async (input, init) => {
    await waitUntilConfigured()
    return electronSession.fetch(input instanceof URL ? input.toString() : input, init)
  }

  return axios.create({
    ...defaults,
    adapter: 'fetch',
    env: {
      ...defaults.env,
      fetch: electronFetch
    }
  })
}
