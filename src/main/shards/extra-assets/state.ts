import type {
  GtimgGuideCatalog,
  GtimgGuideCatalogs
} from '@shared/data-adapter/gtimg/guide-resources'
import { GtimgClassicHero, GtimgHeroListJs, GtimgKiwiAugments } from '@shared/data-sources/gtimg'
import { makeAutoObservable, observableRef } from 'mobx'

export class ExtraAssetsStateGtimg {
  enabled = true

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  heroList: GtimgHeroListJs | null = null
  kiwiAugments: GtimgKiwiAugments[] | null = null
  classicHeroes: GtimgClassicHero[] | null = null
  guideCatalogs: GtimgGuideCatalogs = { items: {}, perks: {}, spells: {} }

  setGuideCatalog(catalog: GtimgGuideCatalog) {
    this.guideCatalogs = { ...this.guideCatalogs, [catalog.kind]: catalog.entries }
  }

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
      guideCatalogs: observableRef,
      kiwiAugments: observableRef
    })
  }
}
