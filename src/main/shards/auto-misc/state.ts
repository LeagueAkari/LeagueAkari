import { AutoMiscRankedStatus } from '@shared/types/shards/auto-misc'
import { makeAutoObservable } from 'mobx'

export class AutoMiscSettings {
  autoReplyEnabled = false
  autoReplyEnableOnAway = false
  autoReplyText = ''

  lockOfflineStatus = false

  autoSetStatusMessageEnabled = false
  statusMessage = ''

  autoSetRankedStatusEnabled = false
  rankedStatus: AutoMiscRankedStatus = {
    queue: 'RANKED_SOLO_5x5',
    tier: 'CHALLENGER',
    division: 'I'
  }

  constructor() {
    makeAutoObservable(this)
  }
}
