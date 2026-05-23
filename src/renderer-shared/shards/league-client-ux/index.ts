import { Dep, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  LEAGUE_CLIENT_UX_MAIN_NAMESPACE,
  LEAGUE_CLIENT_UX_RENDERER_NAMESPACE,
  type LeagueClientUxRendererContext
} from './context'
import { syncLeagueClientUxState } from './state-sync'

@Shard(LeagueClientUxRenderer.id)
export class LeagueClientUxRenderer {
  static id = LEAGUE_CLIENT_UX_RENDERER_NAMESPACE

  private readonly _context: LeagueClientUxRendererContext

  constructor(
    @Dep(AkariIpcRenderer) ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) settingUtils: SettingUtilsRenderer
  ) {
    this._context = {
      ipc,
      piniaMobxUtils,
      settingUtils
    }
  }

  setUseWmi(enabled: boolean) {
    return this._context.settingUtils.set(LEAGUE_CLIENT_UX_MAIN_NAMESPACE, 'useWmi', enabled)
  }

  rebuildWmi() {
    return this._context.ipc.call(LEAGUE_CLIENT_UX_MAIN_NAMESPACE, 'rebuildWmi')
  }

  async onInit() {
    await syncLeagueClientUxState(this._context)
  }
}
