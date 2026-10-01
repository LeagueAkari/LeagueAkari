import type { OpggChampionDataPreferences } from '@shared/types/champion-data'
import type { OpggChampionDataSnapshot } from '@shared/types/champion-data/opgg'

export function createOpggSnapshot(
  preferences: OpggChampionDataPreferences = {
    mode: 'ranked',
    position: 'top',
    region: 'global',
    tier: 'all'
  }
): OpggChampionDataSnapshot {
  return {
    generation: 0,
    activePage: null,
    openedChampions: [],
    pages: {},
    overviewState: { status: 'idle', error: null, revision: 0, stale: true },
    followSelectionId: 0,
    query: { ...preferences, championId: null, version: null },
    version: null,
    versions: [],
    status: 'idle',
    error: null,
    overview: null,
    champion: null
  }
}
