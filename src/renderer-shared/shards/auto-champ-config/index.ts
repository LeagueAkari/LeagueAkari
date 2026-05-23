import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { ChampionRunesConfig, SummonerSpellsConfig } from '@shared/types/shards/auto-champ-config'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  AUTO_CHAMP_CONFIG_MAIN_NAMESPACE,
  AUTO_CHAMP_CONFIG_RENDERER_NAMESPACE,
  type AutoChampConfigRendererContext
} from './context'
import { syncAutoChampConfigSettings } from './settings-sync'

@Shard(AutoChampConfigRenderer.id)
export class AutoChampConfigRenderer implements IAkariShardInitDispose {
  static id = AUTO_CHAMP_CONFIG_RENDERER_NAMESPACE

  private readonly _context: AutoChampConfigRendererContext

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

  async onInit() {
    await syncAutoChampConfigSettings(this._context)
  }

  updateRunes(championId: number, mode: string, runes: ChampionRunesConfig | null) {
    return this._context.ipc.call(
      AUTO_CHAMP_CONFIG_MAIN_NAMESPACE,
      'updateRunes',
      championId,
      mode,
      runes
    )
  }

  updatePositionRunes(
    championId: number,
    mode: string,
    position: string,
    runes: ChampionRunesConfig | null
  ) {
    return this._context.ipc.call(
      AUTO_CHAMP_CONFIG_MAIN_NAMESPACE,
      'updateRunes',
      championId,
      `${mode}-${position}`,
      runes
    )
  }

  updateSummonerSpells(championId: number, mode: string, spells: SummonerSpellsConfig | null) {
    return this._context.ipc.call(
      AUTO_CHAMP_CONFIG_MAIN_NAMESPACE,
      'updateSummonerSpells',
      championId,
      mode,
      spells
    )
  }

  updatePositionSummonerSpells(
    championId: number,
    mode: string,
    position: string,
    spells: SummonerSpellsConfig | null
  ) {
    return this._context.ipc.call(
      AUTO_CHAMP_CONFIG_MAIN_NAMESPACE,
      'updateSummonerSpells',
      championId,
      `${mode}-${position}`,
      spells
    )
  }

  setEnabled(enabled: boolean) {
    return this._context.settingUtils.set(AUTO_CHAMP_CONFIG_MAIN_NAMESPACE, 'enabled', enabled)
  }

  async onDispose() {}
}
