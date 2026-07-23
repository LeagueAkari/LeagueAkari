import { createDefaultSavedPlayerTagPhrases } from '@shared/shards/saved-player'
import { makeAutoObservable, observable } from 'mobx'

export class SavedPlayerSettings {
  playerTagPhrases = createDefaultSavedPlayerTagPhrases()
  playerTagPhrasePanelExpanded = true

  constructor() {
    makeAutoObservable(this, {
      playerTagPhrases: observable.ref
    })
  }
}
