import _ from 'lodash'
import { type ComputedRef, computed, onScopeDispose, watch } from 'vue'

import {
  type CurrentGameInput,
  type Recommendation,
  type RecommendedLoadout,
  loadoutStatus,
  recommended,
  toSummonerSpellsConfig
} from '../source-contract'
import { useChampionDataStore } from '../store'
import type { Qq101PagesController } from './pages-controller'
import type { Qq101HeroQuery, Qq101Section } from './types'

const positions: Partial<Record<string, string>> = {
  top: 'TOP',
  jungle: 'JUNGLE',
  middle: 'MIDDLE',
  bottom: 'BOTTOM',
  utility: 'SUPPORT'
}

function sectionRecommendation<T, R>(
  section: Qq101Section<T>,
  select: (data: T) => R | undefined
): Recommendation<R> {
  if (section.status === 'ready') {
    return recommended(select(section.data))
  }

  if (section.status === 'error') {
    return { status: 'loadError', error: section.message }
  }

  return { status: section.status === 'empty' ? 'empty' : 'loading' }
}

export function useQq101CurrentGame(
  input: ComputedRef<CurrentGameInput | null>,
  pages: Qq101PagesController
) {
  const store = useChampionDataStore()
  const enabled = computed(
    () => store.qq101.enabled && store.settings.sourcePreferences.enabled.qq101
  )

  const request = computed(() => {
    const game = input.value
    if (!game || !enabled.value) {
      return null
    }

    let query: Qq101HeroQuery
    if (game.gameMode === 'KIWI') {
      query = { mode: 'aram_mayhem' }
    } else if (game.gameMode === 'CLASSIC') {
      query = {
        mode: 'ranked',
        patch: '',
        tier: store.settings.automation.qq101.tier,
        position: positions[game.assignedPosition] ?? null
      }
    } else {
      return null
    }

    return {
      championId: game.championId,
      query,
      reason: query.mode === 'ranked' && !query.position ? ('missingPosition' as const) : null
    }
  })

  onScopeDispose(() => pages.removeCurrentGamePage())

  watch(
    request,
    (next) => {
      if (next) {
        void pages.syncCurrentGamePage(next.championId, next.query, next.reason)
      } else {
        pages.removeCurrentGamePage()
      }
    },
    { immediate: true }
  )

  return (): RecommendedLoadout => {
    if (!enabled.value) {
      return loadoutStatus('sourceUnavailable')
    }

    if (!input.value) {
      return loadoutStatus('empty')
    }

    const desired = request.value
    if (!desired || desired.query.mode === 'aram_mayhem') {
      return loadoutStatus('unsupportedMode')
    }

    if (desired.reason) {
      return loadoutStatus(desired.reason)
    }

    const page = pages.currentGamePage
    if (
      !page ||
      page.championId !== desired.championId ||
      !_.isEqual(page.currentGame?.requestedQuery, desired.query)
    ) {
      return loadoutStatus('loading')
    }

    if (page.modeChange.status === 'error') {
      return loadoutStatus('loadError', page.modeChange.message)
    }

    if (page.view?.mode !== 'ranked') {
      return loadoutStatus('loading')
    }

    const sections = page.view.sections

    return {
      queryKey: JSON.stringify(desired),
      runes: sectionRecommendation(sections.runes, () => pages.getRecommendedRunes()),
      summonerSpells: sectionRecommendation(sections.summonerSpells, (data) =>
        data.recommendations
          .map((row) => toSummonerSpellsConfig(row.summonerSpellIds))
          .find(Boolean)
      )
    }
  }
}
