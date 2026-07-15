import {
  type AkariServiceBaseUrls,
  DEFAULT_AKARI_SERVICE_BASE_URLS
} from '@shared/shards/akari-api'
import { makeAutoObservable, observable } from 'mobx'

export class AkariApiState {
  baseUrls: AkariServiceBaseUrls = { ...DEFAULT_AKARI_SERVICE_BASE_URLS }

  setBaseUrls(baseUrls: AkariServiceBaseUrls) {
    this.baseUrls = { ...baseUrls }
  }

  constructor() {
    makeAutoObservable(this, {
      baseUrls: observable.ref
    })
  }
}
