import { LEAGUE_CLIENT_UX_MAIN_NAMESPACE, type LeagueClientUxRendererContext } from './context'
import { useLeagueClientUxStore } from './store'

export async function syncLeagueClientUxState(context: LeagueClientUxRendererContext) {
  const store = useLeagueClientUxStore()

  await context.piniaMobxUtils.sync(LEAGUE_CLIENT_UX_MAIN_NAMESPACE, 'state', store)
  await context.piniaMobxUtils.sync(LEAGUE_CLIENT_UX_MAIN_NAMESPACE, 'settings', store.settings)
}
