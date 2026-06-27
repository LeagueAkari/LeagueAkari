import { ChampionRunesConfig, SummonerSpellsConfig } from '@shared/shards/auto-champ-config'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

interface ChampionRunesV2Preset {
  [key: number]: Record<string, ChampionRunesConfig | null>
}

interface SummonerSpellsPreset {
  // 英雄 - 唯一 ID
  [key: number]: Record<string, SummonerSpellsConfig | null>
}

export const useAutoChampConfigStore = defineStore('shard:auto-champ-config-renderer', () => {
  const settings = shallowReactive({
    enabled: false,

    /**
     * 对应 LCU 数据 schemaVersion: 2
     */
    runesV2: {} as ChampionRunesV2Preset,

    summonerSpells: {} as SummonerSpellsPreset
  })

  return {
    settings
  }
})
