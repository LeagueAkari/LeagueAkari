import { GtimgHeroListJs, GtimgKiwiAugments } from '@shared/data-sources/gtimg'
import type { OpggAramBalanceItem } from '@shared/types/opgg'
import { makeAutoObservable, observableRef } from 'mobx'

export class ExtraAssetsStateGtimg {
  heroList: GtimgHeroListJs | null
  kiwiAugments: GtimgKiwiAugments[] | null

  setHeroList(heroList: GtimgHeroListJs | null) {
    this.heroList = heroList
  }

  setKiwiAugments(kiwiAugments: GtimgKiwiAugments[] | null) {
    this.kiwiAugments = kiwiAugments
  }

  constructor() {
    makeAutoObservable(this, {
      heroList: observableRef,
      kiwiAugments: observableRef
    })
  }
}

export class ExtraAssetsStateOpgg {
  aramBalance: OpggAramBalanceItem[] | null

  setAramBalance(aramBalance: OpggAramBalanceItem[] | null) {
    this.aramBalance = aramBalance
  }

  constructor() {
    makeAutoObservable(this, {
      aramBalance: observableRef
    })
  }
}
