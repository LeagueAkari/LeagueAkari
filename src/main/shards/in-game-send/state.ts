import {
  type InGameSendPresetOptions,
  type InGameSendPresetOptionsPatch,
  createDefaultInGameSendPresetOptions,
  normalizeInGameSendPresetOptions
} from '@shared/types/shards/in-game-send'
import { makeAutoObservable, observable } from 'mobx'

export class InGameSendSettings {
  cancelShortcut: string | null = null
  sendInterval: number = 65
  presetOptions: InGameSendPresetOptions = createDefaultInGameSendPresetOptions()

  setCancelShortcut(shortcut: string | null) {
    this.cancelShortcut = shortcut
  }

  setSendInterval(interval: number) {
    this.sendInterval = interval
  }

  setPresetOptions(options: InGameSendPresetOptionsPatch | null | undefined) {
    this.presetOptions = normalizeInGameSendPresetOptions(options)
  }

  constructor() {
    makeAutoObservable(this, {
      presetOptions: observable.ref
    })
  }
}

export class InGameSendState {
  /** 表现评分预设：选中的 puuid 列表 */
  ratingPuuids: string[] = []

  /** 打野偏好预设：选中的 puuid 列表 */
  junglePuuids: string[] = []

  /**
   * 组队状况预设：选中的预组队 index 列表 (1-based)
   * 对应 ongoing-game `mergedPremadeTeamMap` 的 value (前端字母 A/B/C... 是其 0-based 映射)
   */
  premadeIndices: number[] = []

  setRatingPuuids(puuids: string[]) {
    this.ratingPuuids = [...puuids]
  }

  setJunglePuuids(puuids: string[]) {
    this.junglePuuids = [...puuids]
  }

  setPremadeIndices(indices: number[]) {
    this.premadeIndices = [...indices]
  }

  clearPresetSelections() {
    this.ratingPuuids = []
    this.junglePuuids = []
    this.premadeIndices = []
  }

  constructor() {
    makeAutoObservable(this, {
      ratingPuuids: observable.ref,
      junglePuuids: observable.ref,
      premadeIndices: observable.ref
    })
  }
}
