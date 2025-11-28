import {
  ChampSelectSession,
  GridChamp,
  OngoingChampionSwap
} from '@shared/types/league-client/champ-select'
import { ChatPerson, Conversation } from '@shared/types/league-client/chat'
import {
  Augment,
  ChampionSimple,
  GameMap,
  GameModeMutator,
  Item,
  Perk,
  Queue,
  Style,
  SummonerSpell
} from '@shared/types/league-client/game-data'
import { GameflowPhase, GameflowSession } from '@shared/types/league-client/gameflow'
import { Ballot } from '@shared/types/league-client/honorV2'
import { Lobby, ReceivedInvitation } from '@shared/types/league-client/lobby'
import { LoginQueueState } from '@shared/types/league-client/login'
import { GetSearch, ReadyCheck } from '@shared/types/league-client/matchmaking'
import { SummonerInfo, SummonerProfile } from '@shared/types/league-client/summoner'
import { defineStore } from 'pinia'
import { computed, shallowReactive, shallowRef } from 'vue'

// copied
export type LcConnectionStateType = 'connecting' | 'connected' | 'disconnected'

// copied
export interface UxCommandLine {
  port: number
  pid: number
  authToken: string
  certificate: string
  region: string
  rsoPlatformId: string
  riotClientPort: number
  riotClientAuthToken: string
}

// copied
type InitializationProgress = {
  currentId: string | null
  finished: string[]
  all: string[]
}

export const useLeagueClientStore = defineStore('shard:league-client-renderer', () => {
  const connectionState = shallowRef<LcConnectionStateType>('disconnected')
  const auth = shallowRef<UxCommandLine | null>(null)
  const connectingClient = shallowRef<UxCommandLine | null>(null)

  const isConnected = computed(() => connectionState.value === 'connected')
  const isConnecting = computed(() => connectionState.value === 'connecting')
  const isDisconnected = computed(() => connectionState.value === 'disconnected')

  const isInConnectionLoop = computed(() => {
    return connectingClient.value && connectionState.value !== 'connected'
  })

  const settings = shallowReactive({
    autoConnect: false
  })

  const gameData = shallowReactive({
    // utils
    championName: (id: number) => {
      return gameData.champions[id]?.name || id.toString()
    },
    queueName: (id: number) => {
      return gameData.queues[id]?.name || id.toString()
    },
    mapName: (id: number) => {
      return gameData.maps[id]?.name || id.toString()
    },

    champions: {} as Record<number, ChampionSimple>,
    augments: {} as Record<number, Augment>,
    perks: {} as Record<number, Perk>,
    perkstyles: {
      schemaVersion: 0,
      styles: {}
    } as {
      schemaVersion: number
      styles: Record<number, Style>
    },
    queues: {} as Record<number, Queue>,
    items: {} as Record<number, Item>,
    summonerSpells: {} as Record<number, SummonerSpell>,
    gameModeMutators: {} as Record<number, GameModeMutator>,
    maps: {} as Record<number, GameMap>
  })

  const champSelect = shallowReactive({
    session: null as ChampSelectSession | null,
    currentChampion: null as number | null,
    currentPickableChampionIds: new Set() as Set<number>,
    currentBannableChampionIds: new Set() as Set<number>,
    disabledChampionIds: new Set() as Set<number>,
    ongoingChampionSwap: null as OngoingChampionSwap | null,
    gridChampions: {} as Record<number, GridChamp>
  })

  const chat = shallowReactive({
    me: null as ChatPerson | null,
    conversations: shallowReactive({
      championSelect: null as Conversation | null,
      postGame: null as Conversation | null,
      customGame: null as Conversation | null
    }),
    participants: shallowReactive({
      championSelect: null as Conversation | null,
      postGame: null as Conversation | null,
      customGame: null as Conversation | null
    })
  })

  const gameflow = shallowReactive({
    phase: null as GameflowPhase | null,
    session: null as GameflowSession | null
  })

  const honor = shallowReactive({
    ballot: null as Ballot | null
  })

  const lobby = shallowReactive({
    lobby: null as Lobby | null,
    receivedInvitations: [] as ReceivedInvitation[]
  })

  const summoner = shallowReactive({
    me: null as SummonerInfo | null,
    profile: null as SummonerProfile | null
  })

  const login = shallowReactive({
    loginQueueState: null as LoginQueueState | null
  })

  const matchmaking = shallowReactive({
    readyCheck: null as ReadyCheck | null,
    search: null as GetSearch | null
  })

  const initialization = shallowReactive({
    progress: null as InitializationProgress | null
  })

  const lobbyTeamBuilder = shallowReactive({
    champSelect: {
      subsetChampionList: [] as number[]
    }
  })

  return {
    gameData,
    champSelect,
    chat,
    gameflow,
    honor,
    lobby,
    summoner,
    login,
    matchmaking,
    lobbyTeamBuilder,

    initialization,
    settings,

    connectionState,
    isConnected, // for convenience
    isConnecting, // for convenience
    isDisconnected, // for convenience
    isInConnectionLoop, // for convenience
    auth,
    connectingClient
  }
})
