import { BalanceType } from '@shared/data-sources/fandom'
import { GtimgHeroListJs, GtimgKiwiAugments, Hero } from '@shared/data-sources/gtimg'
import { defineStore } from 'pinia'
import { computed, shallowReactive } from 'vue'

export const useExtraAssetsStore = defineStore('shard:extra-assets-renderer', () => {
  const gtimg = shallowReactive({
    heroList: null as GtimgHeroListJs | null,
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

  const fandom = shallowReactive({
    balance: null as Record<string, BalanceType> | null
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

  return {
    gtimg,
    fandom,

    // computed
    heroListMap,
    kiwiAugmentsMap
  }
})
