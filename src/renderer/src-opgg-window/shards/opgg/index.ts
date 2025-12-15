import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { Dep, Shard } from '@shared/akari-shard'
import { USER_AGENT } from '@shared/constants/common'
import { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import axios from 'axios'
import { watch } from 'vue'

import { useOpggStore } from './store'

@Shard(OpggRenderer.id)
export class OpggRenderer {
  static id = 'opgg-renderer'

  private _http = axios.create({
    headers: {
      'User-Agent': USER_AGENT
    }
  })

  public readonly api = new OpggHttpApiAxiosHelper(this._http)

  constructor(
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(LeagueClientRenderer) private readonly _lc: LeagueClientRenderer
  ) {}

  async onInit() {
    const store = useOpggStore()

    await this._setting.savedPropVue(OpggRenderer.id, store.frontendSettings, 'autoApplyItems')
    await this._setting.savedPropVue(OpggRenderer.id, store.frontendSettings, 'autoApplyRunes')
    await this._setting.savedPropVue(OpggRenderer.id, store.frontendSettings, 'autoApplySpells')

    this._handleRestoreItemSet()
  }

  private _handleRestoreItemSet() {
    const lcs = useLeagueClientStore()

    watch(
      () => lcs.gameflow.phase === 'EndOfGame',
      (isEndOfGame) => {
        if (isEndOfGame) {
          this._lc.writeItemSetsToDisk(null)
        }
      }
    )
  }
}
