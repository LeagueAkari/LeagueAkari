import type { OpggChampionDataQuery } from '@shared/types/champion-data/opgg'
import _ from 'lodash'
import { type ComputedRef, computed, onScopeDispose, watch } from 'vue'

import {
  type CurrentGameInput,
  type RecommendedLoadout,
  loadoutStatus,
  recommended,
  toSummonerSpellsConfig
} from '../source-contract'
import { useChampionDataStore } from '../store'
import type { OpggChampionDataController } from './data-controller'

const modes: Partial<Record<string, OpggChampionDataQuery['mode']>> = {
  CLASSIC: 'ranked',
  ARAM: 'aram',
  KIWI: 'aram_mayhem',
  CHERRY: 'arena',
  NEXUSBLITZ: 'nexus_blitz',
  URF: 'urf',
  ARURF: 'urf'
}
const positions: Partial<Record<string, OpggChampionDataQuery['position']>> = {
  top: 'top',
  jungle: 'jungle',
  middle: 'mid',
  bottom: 'adc',
  utility: 'support'
}

export function useOpggCurrentGame(
  input: ComputedRef<CurrentGameInput | null>,
  pages: OpggChampionDataController
) {
  const store = useChampionDataStore()
  const enabled = computed(
    () => store.opgg.enabled && store.settings.sourcePreferences.enabled.opgg
  )

  const request = computed(() => {
    const game = input.value
    if (!game || !enabled.value) {
      return null
    }

    const mode = game.gameMode === 'CLASSIC' && game.queueId === 440 ? 'flex' : modes[game.gameMode]
    if (!mode) {
      return null
    }

    const position = positions[game.assignedPosition]
    const query: OpggChampionDataQuery = {
      championId: game.championId,
      mode,
      position: position ?? 'top',
      version: null,
      ...store.settings.automation.opgg
    }

    return {
      query,
      reason: game.gameMode === 'CLASSIC' && !position ? ('missingPosition' as const) : null
    }
  })

  onScopeDispose(() => pages.removeCurrentGamePage())

  watch(
    request,
    (next) => {
      if (next) {
        void pages.syncCurrentGamePage(next.query, next.reason)
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
    if (!desired || desired.query.mode === 'arena' || desired.query.mode === 'aram_mayhem') {
      return loadoutStatus('unsupportedMode')
    }

    if (desired.reason) {
      return loadoutStatus(desired.reason)
    }

    const page = pages.currentGamePage
    if (!page || !_.isEqual(page.currentGame?.requestedQuery, desired.query)) {
      return loadoutStatus('loading')
    }

    if (page.status === 'error') {
      return loadoutStatus('loadError', page.error ?? undefined)
    }

    if (page.status === 'loading') {
      return loadoutStatus('loading')
    }

    if (page.status === 'idle' || page.stale) {
      return loadoutStatus('idle')
    }

    const details = page.champion
    const spells =
      details && 'summonerSpells' in details
        ? details.summonerSpells.map((row) => toSummonerSpellsConfig(row.spellIds)).find(Boolean)
        : undefined

    return {
      queryKey: JSON.stringify(desired.query),
      runes: recommended(pages.getRecommendedRunes()),
      summonerSpells: recommended(spells)
    }
  }
}
