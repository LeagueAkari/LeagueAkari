import {
  type InGameSendCustomTemplateItem,
  type InGameSendCustomTemplateLastError,
  type InGameSendFixedTextPresetItem,
  type InGameSendJunglePresetOptions,
  type InGameSendPremadePresetOptions,
  type InGameSendRatingPresetOptions,
  createDefaultInGameSendCustomTemplateItems,
  createDefaultInGameSendFixedTextPresetItems,
  createDefaultInGameSendJunglePresetOptions,
  createDefaultInGameSendPremadePresetOptions,
  createDefaultInGameSendRatingPresetOptions
} from '@shared/shards/in-game-send'
import { makeAutoObservable, observableRef } from 'mobx'

export class InGameSendSettings {
  cancelShortcut: string | null = null
  sendInterval: number = 65
  ratingPresetOptions: InGameSendRatingPresetOptions = createDefaultInGameSendRatingPresetOptions()
  junglePresetOptions: InGameSendJunglePresetOptions = createDefaultInGameSendJunglePresetOptions()
  premadePresetOptions: InGameSendPremadePresetOptions =
    createDefaultInGameSendPremadePresetOptions()
  fixedTextPresetItems: InGameSendFixedTextPresetItem[] =
    createDefaultInGameSendFixedTextPresetItems()
  customTemplateRiskNoticeShown = false
  customTemplateItems: InGameSendCustomTemplateItem[] = createDefaultInGameSendCustomTemplateItems()

  setCancelShortcut(shortcut: string | null) {
    this.cancelShortcut = shortcut
  }

  setSendInterval(interval: number) {
    this.sendInterval = interval
  }

  constructor() {
    makeAutoObservable(this, {
      ratingPresetOptions: observableRef,
      junglePresetOptions: observableRef,
      premadePresetOptions: observableRef,
      fixedTextPresetItems: observableRef,
      customTemplateItems: observableRef
    })
  }
}

export class InGameSendState {
  customTemplateLastErrors: Record<string, InGameSendCustomTemplateLastError> = {}

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

  setCustomTemplateLastError(id: string, error: InGameSendCustomTemplateLastError) {
    this.customTemplateLastErrors = {
      ...this.customTemplateLastErrors,
      [id]: error
    }
  }

  clearCustomTemplateLastError(id: string) {
    if (!(id in this.customTemplateLastErrors)) {
      return
    }

    const nextErrors = { ...this.customTemplateLastErrors }
    delete nextErrors[id]
    this.customTemplateLastErrors = nextErrors
  }

  constructor() {
    makeAutoObservable(this, {
      ratingPuuids: observableRef,
      junglePuuids: observableRef,
      premadeIndices: observableRef,
      customTemplateLastErrors: observableRef
    })
  }
}
