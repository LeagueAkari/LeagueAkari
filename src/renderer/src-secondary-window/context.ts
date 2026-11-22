import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { type InjectionKey, inject, onScopeDispose, provide } from 'vue'

import { createOpggSource } from './opgg/source-context'
import { createQq101Source } from './qq101/source-context'
import { ChampionDataRenderer } from './shards/champion-data'
import type { ChampionDataRendererContext } from './shards/champion-data/context'
import {
  CurrentGameController,
  createCurrentGameState
} from './shards/champion-data/current-game-controller'
import type { createChampionDataApis } from './shards/champion-data/http-api'
import { LoadoutExecutor } from './shards/champion-data/loadout-executor'
import { useOpggCurrentGame } from './shards/champion-data/opgg/current-game'
import { useQq101CurrentGame } from './shards/champion-data/qq101/current-game'

export type ChampionDataContext = ReturnType<typeof createChampionDataContext>

const ChampionDataContextKey: InjectionKey<ChampionDataContext> = Symbol('ChampionDataContext')

export function createChampionDataContext(
  context: ChampionDataRendererContext,
  api: ReturnType<typeof createChampionDataApis>,
  client: LeagueClientRenderer
) {
  const game = createCurrentGameState()
  const commands = new LoadoutExecutor(client, () => {
    if (game.active) {
      game.manual = true
    }
  })

  const opgg = createOpggSource(context, api.opgg, commands, client)
  const qq101 = createQq101Source(context, api.qq101, commands)

  const currentGame = new CurrentGameController(
    context,
    game,
    {
      opgg: (input) => useOpggCurrentGame(input, opgg.controller),
      qq101: (input) => useQq101CurrentGame(input, qq101.controller.pages)
    },
    commands
  )

  currentGame.setup()

  onScopeDispose(() => commands.dispose())

  return { opgg, qq101, game, currentGame, commands }
}

export function provideChampionData() {
  const shard = useInstance(ChampionDataRenderer)
  const client = useInstance(LeagueClientRenderer)
  const context = createChampionDataContext(shard.context, shard.api, client)

  provide(ChampionDataContextKey, context)

  return context
}

export function useChampionData() {
  return inject(ChampionDataContextKey)!
}
