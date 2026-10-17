import { createChampionDataSourcePreferences } from '@shared/shards/champion-data/source-preferences'
import type {
  OpggChampionDataPreferences,
  Qq101ChampionDataPreferences
} from '@shared/types/champion-data'
import type { OpggFlashPosition } from '@shared/types/champion-data/opgg'
import type { OpggChampionBalance } from '@shared/types/champion-data/opgg'
import { makeAutoObservable, observableRef } from 'mobx'

export class OpggChampionDataState {
  enabled = false
  aramBalance: OpggChampionBalance[] | null = null

  constructor() {
    makeAutoObservable(this, {
      aramBalance: observableRef
    })
  }

  setAramBalance(aramBalance: OpggChampionBalance[] | null) {
    this.aramBalance = aramBalance
  }
}

export class ChampionDataSettings {
  sourcePreferences = createChampionDataSourcePreferences()
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
      sourcePreferences: observableRef,
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
