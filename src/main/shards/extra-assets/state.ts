import { GtimgClassicHero, GtimgHeroListJs, GtimgKiwiAugments } from '@shared/data-sources/gtimg'
import { makeAutoObservable, observableRef } from 'mobx'

export class ExtraAssetsStateGtimg {
  heroList: GtimgHeroListJs | null = null
  kiwiAugments: GtimgKiwiAugments[] | null = null
  classicHeroes: GtimgClassicHero[] | null = null

  setClassicHeroes(heroes: GtimgClassicHero[] | null) {
    this.classicHeroes = heroes
  }

  setHeroList(heroList: GtimgHeroListJs | null) {
    this.heroList = heroList
  }

  setKiwiAugments(kiwiAugments: GtimgKiwiAugments[] | null) {
    this.kiwiAugments = kiwiAugments
  }

  constructor() {
    makeAutoObservable(this, {
      heroList: observableRef,
      classicHeroes: observableRef,
      kiwiAugments: observableRef
    })
  }
}
