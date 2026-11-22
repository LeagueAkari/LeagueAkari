import type { ChampionDataRendererContext } from '@secondary-window/shards/champion-data/context'
import { Qq101ChampionDataController } from '@secondary-window/shards/champion-data/qq101/data-controller'
import { Qq101ChampionDataLoader } from '@secondary-window/shards/champion-data/qq101/data-loader'
import type {
  Qq101ChampionDataOverview,
  Qq101DetailView,
  Qq101OverviewQuery,
  Qq101Page,
  Qq101Section
} from '@secondary-window/shards/champion-data/qq101/types'
import type { ChampionDataCommands } from '@secondary-window/shards/champion-data/source-contract'
import { useChampionDataStore } from '@secondary-window/shards/champion-data/store'
import type { Qq101AkariData } from '@shared/data-adapter/qq101/protocol'
import { Qq101DataSource } from '@shared/data-sources/qq101'
import type { Qq101HttpApiAxiosHelper, Qq101PairQuery } from '@shared/http-api-axios-helper/qq101'
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { shallowReactive } from 'vue'

export type Qq101SourceState = ReturnType<typeof createQq101SourceState>

export interface Qq101RendererContext extends ChampionDataRendererContext {
  state: Qq101SourceState
  settings: ReturnType<typeof useChampionDataStore>['settings']
  readonly canRequest: boolean
}

export function createQq101SourceState() {
  const pages = shallowReactive({ items: [] as Qq101Page[], activeId: 'rankings' })

  return shallowReactive({
    isLoading: false,
    patches: [] as string[],
    requestedPreferences: null as Qq101ChampionDataPreferences | null,
    loadedPreferences: null as Qq101OverviewQuery | null,
    overview: null as Qq101ChampionDataOverview | null,
    error: null as string | null,

    pages,

    get detailView(): Qq101DetailView | null {
      const page = pages.items.find((page) => page.id === pages.activeId)

      return page?.view ?? null
    },

    classicLanes: { status: 'idle' } as Qq101Section<Qq101AkariData<'lanes'>>,
    pairQuery: { championId: null, firstRole: 'all', secondRole: 'all' } as Qq101PairQuery,
    pairs: { status: 'idle' } as Qq101Section<Qq101AkariData<'pairs'>>
  })
}

export function createQq101Source(
  context: ChampionDataRendererContext,
  api: Qq101HttpApiAxiosHelper,
  commands: ChampionDataCommands
) {
  const store = useChampionDataStore()
  const state = createQq101SourceState()

  const controller = new Qq101ChampionDataController(
    {
      ...context,
      state,
      settings: store.settings,

      get canRequest() {
        return store.sourceStates.qq101.canRequest
      }
    },
    new Qq101ChampionDataLoader(context.logger, new Qq101DataSource(api)),
    commands
  )

  controller.setup()

  return { state, controller }
}
