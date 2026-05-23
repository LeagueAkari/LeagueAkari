import type { AutoChampionConfigMainContext } from './context'
import type { AutoChampionConfigMain } from './index'
import type { ChampionRunesConfig, SummonerSpellsConfig } from './state'

export class AutoChampConfigIpcHandlers {
  constructor(
    private readonly context: AutoChampionConfigMainContext,
    private readonly autoChampionConfig: AutoChampionConfigMain
  ) {}

  register() {
    const { ipc, namespace } = this.context

    ipc.onCall(
      namespace,
      'updateRunes',
      async (_, championId: number, key: string, runes: ChampionRunesConfig | null) => {
        await this.autoChampionConfig.updateRunes(championId, key, runes)
      }
    )

    ipc.onCall(
      namespace,
      'updateSummonerSpells',
      async (_, championId: number, key: string, spells: SummonerSpellsConfig | null) => {
        await this.autoChampionConfig.updateSummonerSpells(championId, key, spells)
      }
    )
  }
}
