import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { LoggerRenderer } from '../logger'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useClientInstallationStore } from './store'

const MAIN_SHARD_NAMESPACE = 'client-installation-main'

@Shard(ClientInstallationRenderer.id)
export class ClientInstallationRenderer implements IAkariShardInitDispose {
  static id = 'client-installation-renderer'

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(LoggerRenderer) private readonly _logger: LoggerRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer
  ) {}

  async onInit() {
    const store = useClientInstallationStore()

    await this._piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'state', store)
  }

  launchTencentTcls() {
    this._logger.info(ClientInstallationRenderer.id, 'Launch TCLS client')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'launchTencentTcls')
  }

  launchWeGameLeagueOfLegends() {
    this._logger.info(ClientInstallationRenderer.id, 'Launch WeGame client')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'launchWeGameLeagueOfLegends')
  }

  launchWeGame() {
    this._logger.info(ClientInstallationRenderer.id, 'Launch WeGame client')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'launchWeGame')
  }

  launchDefaultRiotClient() {
    this._logger.info(ClientInstallationRenderer.id, 'Launch default RiotClient client')
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'launchDefaultRiotClient')
  }
}
