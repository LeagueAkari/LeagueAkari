import {
  type AkariApiConfigResource,
  type AkariApiLanguage,
  DEFAULT_AKARI_API_LANGUAGE
} from '@shared/shards/akari-api'

import type { AkariApiMainContext } from './context'

export class AkariApiIpcHandlers {
  constructor(private readonly _context: AkariApiMainContext) {}

  register() {
    const { api, ipc, namespace } = this._context

    ipc.onCall(
      namespace,
      'getLatestNotice',
      async (_event, language: AkariApiLanguage = DEFAULT_AKARI_API_LANGUAGE) => {
        return (await api.getLatestNotice(language)).data
      }
    )

    ipc.onCall(namespace, 'getConfig', async (_event, resource: AkariApiConfigResource) => {
      return (await api.getConfig(resource)).data
    })

    ipc.onCall(
      namespace,
      'getLatestRelease',
      async (_event, language: AkariApiLanguage = DEFAULT_AKARI_API_LANGUAGE) => {
        return (await api.getLatestRelease(language)).data
      }
    )

    ipc.onCall(
      namespace,
      'getRelease',
      async (_event, version: string, language: AkariApiLanguage = DEFAULT_AKARI_API_LANGUAGE) => {
        return (await api.getRelease(version, language)).data
      }
    )

    ipc.onCall(namespace, 'getLastResortLatestRelease', async () => {
      return (await api.getLastResortLatestRelease()).data
    })

    ipc.onCall(namespace, 'postStatisticsRecord', async (_event, version: string) => {
      await api.postStatisticsRecord(version)
      return true
    })
  }
}
