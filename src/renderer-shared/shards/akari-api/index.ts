import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import {
  type AkariApiConfigResource,
  type AkariApiConfigResourceMap,
  type AkariApiLanguage,
  type AkariLastResortRelease,
  type AkariNotice,
  type AkariRelease,
  DEFAULT_AKARI_API_LANGUAGE,
  resolveAkariStaticUrl
} from '@shared/shards/akari-api'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import {
  AKARI_API_MAIN_NAMESPACE,
  AKARI_API_RENDERER_NAMESPACE,
  type AkariApiRendererContext
} from './context'
import { syncAkariApiState } from './state-sync'
import { useAkariApiStore } from './store'

export { useAkariApiStore } from './store'

@Shard(AkariApiRenderer.id)
export class AkariApiRenderer implements IAkariShardInitDispose {
  static readonly id = AKARI_API_RENDERER_NAMESPACE

  private readonly _context: AkariApiRendererContext

  constructor(
    @Dep(AkariIpcRenderer) ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer
  ) {
    this._context = { ipc, piniaMobxUtils }
  }

  async onInit() {
    await syncAkariApiState(this._context)
  }

  getLatestNotice(language: AkariApiLanguage = DEFAULT_AKARI_API_LANGUAGE) {
    return this._context.ipc.call<AkariNotice>(
      AKARI_API_MAIN_NAMESPACE,
      'getLatestNotice',
      language
    )
  }

  getConfig<Resource extends AkariApiConfigResource>(resource: Resource) {
    return this._context.ipc.call<AkariApiConfigResourceMap[Resource]>(
      AKARI_API_MAIN_NAMESPACE,
      'getConfig',
      resource
    )
  }

  getLatestRelease(language: AkariApiLanguage = DEFAULT_AKARI_API_LANGUAGE) {
    return this._context.ipc.call<AkariRelease>(
      AKARI_API_MAIN_NAMESPACE,
      'getLatestRelease',
      language
    )
  }

  getRelease(version: string, language: AkariApiLanguage = DEFAULT_AKARI_API_LANGUAGE) {
    return this._context.ipc.call<AkariRelease>(
      AKARI_API_MAIN_NAMESPACE,
      'getRelease',
      version,
      language
    )
  }

  getLastResortLatestRelease() {
    return this._context.ipc.call<AkariLastResortRelease>(
      AKARI_API_MAIN_NAMESPACE,
      'getLastResortLatestRelease'
    )
  }

  postStatisticsRecord(version: string) {
    return this._context.ipc.call<boolean>(
      AKARI_API_MAIN_NAMESPACE,
      'postStatisticsRecord',
      version
    )
  }

  resolveStaticUrl(path: string) {
    return resolveAkariStaticUrl(useAkariApiStore().baseUrls.static, path)
  }
}
