import { GtimgHeroListJs, GtimgKiwiAugments, Hero } from '@shared/data-sources/gtimg'
import type { OpggAramBalanceItem } from '@shared/types/opgg'
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

  const opgg = shallowReactive({
    aramBalance: null as OpggAramBalanceItem[] | null
  })

  const opggAramBalanceMap = computed(() => {
    if (!opgg.aramBalance) return {}

    return opgg.aramBalance.reduce(
      (acc, balance) => {
        acc[balance.champion_id] = balance
        return acc
      },
      {} as Record<number, OpggAramBalanceItem>
    )
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
    opgg,

    // computed
    heroListMap,
    kiwiAugmentsMap,
    opggAramBalanceMap
  }
})
