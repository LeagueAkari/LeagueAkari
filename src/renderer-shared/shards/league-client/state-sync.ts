import { type LeagueClientRendererContext, MAIN_SHARD_NAMESPACE } from './context'
import { useLeagueClientStore } from './store'

export async function syncLeagueClientState(context: LeagueClientRendererContext) {
  const store = useLeagueClientStore()

  const {
    gameData = true,
    honor = true,
    champSelect = true,
    chat = true,
    matchmaking = true,
    gameflow = true,
    lobby = true,
    login = true,
    summoner = true,
    lobbyTeamBuilder = true
  } = context.config?.subscribeState || {}

  await context.piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'state', store)
  await context.piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)

  await context.piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'initialization', store.initialization)

  if (gameData) {
    await context.piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'gameData', store.gameData)
  }

  if (honor) {
    await context.piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'honor', store.honor)
  }

  if (champSelect) {
    await context.piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'champSelect', store.champSelect)
  }

  if (chat) {
    await context.piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'chat', store.chat)
  }

  if (matchmaking) {
    await context.piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'matchmaking', store.matchmaking)
  }

  if (gameflow) {
    await context.piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'gameflow', store.gameflow)
  }

  if (lobby) {
    await context.piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'lobby', store.lobby)
  }

  if (login) {
    await context.piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'login', store.login)
  }

  if (summoner) {
    await context.piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'summoner', store.summoner)
  }

  if (lobbyTeamBuilder) {
    await context.piniaMobxUtils.sync(
      MAIN_SHARD_NAMESPACE,
      'lobbyTeamBuilder',
      store.lobbyTeamBuilder
    )
  }
}
