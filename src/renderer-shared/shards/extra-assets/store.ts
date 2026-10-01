import {
  GtimgClassicHero,
  GtimgHeroListJs,
  GtimgKiwiAugments,
  Hero
} from '@shared/data-sources/gtimg'
import { defineStore } from 'pinia'
import { computed, shallowReactive } from 'vue'

export const useExtraAssetsStore = defineStore('shard:extra-assets-renderer', () => {
  const gtimg = shallowReactive({
    heroList: null as GtimgHeroListJs | null,
    classicHeroes: null as GtimgClassicHero[] | null,
    kiwiAugments: null as GtimgKiwiAugments[] | null
  })

  const kiwiAugmentsMap = computed(() => {
    if (!gtimg.kiwiAugments) return {}

    try {
      return gtimg.kiwiAugments.reduce(
        (acc, augment) => {
          acc[augment.augmentID] = augment
          return acc
        },
        {} as Record<number, GtimgKiwiAugments>
      )
    } catch {
      return {}
    }
  })

  const heroListMap = computed(() => {
    if (!gtimg.heroList) return {}

    try {
      return gtimg.heroList.hero.reduce(
        (acc, hero) => {
          acc[Number(hero.heroId)] = hero
          return acc
        },
        {} as Record<string, Hero>
      )
    } catch {
      return {}
    }
  })

  const classicHeroesMap = computed(() =>
    Object.fromEntries((gtimg.classicHeroes ?? []).map((hero) => [hero.heroId, hero]))
  )

  return {
    gtimg,

    // computed
    heroListMap,
    classicHeroesMap,
    kiwiAugmentsMap
  }
})
