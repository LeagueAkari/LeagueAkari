import {
  createDefaultInGameSendJunglePresetOptions,
  createDefaultInGameSendPremadePresetOptions,
  createDefaultInGameSendRatingPresetOptions
} from '@shared/shards/in-game-send'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export const useInGameSendStore = defineStore('shard:in-game-send-renderer', () => {
  const settings = shallowReactive({
    cancelShortcut: null as string | null,
    sendInterval: 65,
    ratingPresetOptions: createDefaultInGameSendRatingPresetOptions(),
    junglePresetOptions: createDefaultInGameSendJunglePresetOptions(),
    premadePresetOptions: createDefaultInGameSendPremadePresetOptions()
  })

  /**
   * 预设发送的玩家选定状态，由主进程驱动，渲染端通过 propSync 接收。
   *
   * - rating/jungle 以 puuid 为 key 标识每位玩家的选中
   * - premade 以预组队 index (1-based, 对应字母 A/B/C...) 为 key
   *
   * 写入通过 `InGameSendRenderer.setRatingPuuids/setJunglePuuids/setPremadeIndices(...)`
   * 发回主进程。
   */
  const state = shallowReactive({
    ratingPuuids: [] as string[],
    junglePuuids: [] as string[],
    premadeIndices: [] as number[]
  })

  return {
    settings,
    state
  }
})
