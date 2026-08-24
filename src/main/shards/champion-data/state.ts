import type {
  ChampionDataFallbackReason,
  ChampionDataPreferences,
  ChampionDataSourceAvailability,
  ChampionDataSourceId
} from '@shared/data-adapter/champion-data'
import { makeAutoObservable, observableRef } from 'mobx'

export class ChampionDataSettings {
  preferredSource: ChampionDataSourceId = 'opgg'
  preferences: ChampionDataPreferences = {
    mode: 'ranked',
    position: 'top',
    region: 'global',
    tier: 'all'
  }

  setPreferredSource(source: ChampionDataSourceId) {
    this.preferredSource = source
  }

  setPreferences(preferences: ChampionDataPreferences) {
    this.preferences = preferences
  }

  constructor() {
    makeAutoObservable(this, {
      preferences: observableRef
    })
  }
}

export class ChampionDataState {
  availability: ChampionDataSourceAvailability = {
    preferredSource: 'opgg',
    sources: {
      opgg: { enabled: true },
      qq101: { enabled: false }
    }
  }
  lastEffectiveSource: ChampionDataSourceId | null = null
  lastFallbackReason: ChampionDataFallbackReason | null = null

  setAvailability(availability: ChampionDataSourceAvailability) {
    this.availability = availability
  }

  setLastResolution(
    effectiveSource: ChampionDataSourceId | null,
    fallbackReason: ChampionDataFallbackReason | null
  ) {
    this.lastEffectiveSource = effectiveSource
    this.lastFallbackReason = fallbackReason
  }

  constructor() {
    makeAutoObservable(this, {
      availability: observableRef
    })
  }
}
