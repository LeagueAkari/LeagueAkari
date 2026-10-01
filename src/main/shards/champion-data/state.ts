import { createOpggSnapshot } from '@shared/shards/champion-data'
import type {
  OpggChampionDataPreferences,
  Qq101ChampionDataPreferences
} from '@shared/types/champion-data'
import type { OpggFlashPosition } from '@shared/types/champion-data/opgg'
import type { OpggAramBalanceItem } from '@shared/types/opgg'
import { makeAutoObservable, observableRef } from 'mobx'

export class OpggChampionDataState {
  enabled = false
  snapshot = createOpggSnapshot()
  isApplying = false
  aramBalance: OpggAramBalanceItem[] | null = null

  constructor() {
    makeAutoObservable(this, {
      snapshot: observableRef,
      aramBalance: observableRef
    })
  }

  setAramBalance(aramBalance: OpggAramBalanceItem[] | null) {
    this.aramBalance = aramBalance
  }
}

export class ChampionDataSettings {
  opggFlashPosition: OpggFlashPosition = 'auto'
  opggPreferences: OpggChampionDataPreferences = {
    mode: 'ranked',
    position: 'top',
    region: 'global',
    tier: 'all'
  }
  qq101Preferences: Qq101ChampionDataPreferences = {
    mode: 'ranked',
    position: 'all',
    patch: null,
    tier: 255
  }

  constructor() {
    makeAutoObservable(this, {
      opggPreferences: observableRef,
      qq101Preferences: observableRef
    })
  }

  setOpggPreferences(preferences: OpggChampionDataPreferences) {
    this.opggPreferences = preferences
  }

  setQq101Preferences(preferences: Qq101ChampionDataPreferences) {
    this.qq101Preferences = preferences
  }
}
