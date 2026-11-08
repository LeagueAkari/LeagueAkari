import type { GtimgGuideCatalogs } from '@shared/data-adapter/gtimg/guide-resources'
import {
  GtimgClassicHero,
  GtimgHeroListJs,
  GtimgKiwiAugments,
  Hero
} from '@shared/data-sources/gtimg'
import type { OpggChampionBalance } from '@shared/types/champion-data/opgg'
import { defineStore } from 'pinia'
import { computed, shallowReactive } from 'vue'

export const useExtraAssetsStore = defineStore('shard:extra-assets-renderer', () => {
  const opgg = shallowReactive({
    aramBalance: null as OpggChampionBalance[] | null
  })

  const opggAramBalanceMap = computed<Record<number, OpggChampionBalance>>(() =>
    Object.fromEntries((opgg.aramBalance ?? []).map((balance) => [balance.championId, balance]))
  )

  const gtimg = shallowReactive({
    enabled: true,
    guideCatalogs: { items: {}, perks: {}, spells: {} } as GtimgGuideCatalogs,
    heroList: null as GtimgHeroListJs | null,
    classicHeroes: null as GtimgClassicHero[] | null,
    kiwiAugments: null as GtimgKiwiAugments[] | null
  })

  const guideCatalogs = computed<GtimgGuideCatalogs>(() =>
    gtimg.enabled ? gtimg.guideCatalogs : { items: {}, perks: {}, spells: {} }
  )

  const kiwiAugmentsMap = computed(() => {
    if (!gtimg.enabled || !gtimg.kiwiAugments) return {}

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
    if (!gtimg.enabled || !gtimg.heroList) return {}

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
    Object.fromEntries(
      (gtimg.enabled ? (gtimg.classicHeroes ?? []) : []).map((hero) => [hero.heroId, hero])
    )
  )

  return {
    gtimg,
    opgg,

    // computed
    guideCatalogs,
    heroListMap,
    classicHeroesMap,
    opggAramBalanceMap,
    kiwiAugmentsMap
  }
})
