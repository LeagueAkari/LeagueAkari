import type { GtimgHeroListResponse } from '@shared/data-sources/gtimg/responses'
import type { GtimgHeroListJs } from '@shared/data-sources/gtimg/types'

export function parseGtimgHeroList(input: GtimgHeroListResponse): GtimgHeroListJs {
  return { ...input, hero: input.hero.map((hero) => ({ ...hero, heroId: Number(hero.heroId) })) }
}
