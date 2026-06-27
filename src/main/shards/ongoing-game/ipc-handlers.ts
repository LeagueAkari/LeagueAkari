import { MatchHistoryQueryParams } from '@shared/http-api-axios-helper/sgp/match-history-query'
import { DraftOptions } from '@shared/shards/ongoing-game'
import { toJS } from 'mobx'

import type { OngoingGameAdditionalInfoController } from './additional-info-controller'
import { ONGOING_GAME_MAIN_NAMESPACE, type OngoingGameMainContext } from './context'
import type { OngoingGameMatchHistoryLoader } from './match-history-loader'
import type { OngoingGamePlayerDataLoader } from './player-data-loader'

export class OngoingGameIpcHandlers {
  constructor(
    private readonly _context: OngoingGameMainContext,
    private readonly _matchHistory: OngoingGameMatchHistoryLoader,
    private readonly _playerData: OngoingGamePlayerDataLoader,
    private readonly _additionalInfo: OngoingGameAdditionalInfoController
  ) {}

  register() {
    const { ipc, state } = this._context

    ipc.onCall(ONGOING_GAME_MAIN_NAMESPACE, 'getAll', () => {
      const matchHistory = toJS(state.matchHistory)
      const summoner = toJS(state.summoner)
      const rankedStats = toJS(state.rankedStats)
      const savedInfo = toJS(state.savedInfo)
      const championMastery = toJS(state.championMastery)
      const gameDetails = toJS(state.gameDetails)
      const additionalGames = toJS(state.additionalGame)

      return {
        matchHistory,
        summoner,
        rankedStats,
        savedInfo,
        championMastery,
        gameDetails,
        additionalGames
      }
    })

    ipc.onCall(
      ONGOING_GAME_MAIN_NAMESPACE,
      'setMatchHistoryTagParams',
      (_, params: Pick<MatchHistoryQueryParams, 'tag' | 'tagsQueryType'>) => {
        state.setMatchHistoryTagParams(params)
      }
    )

    ipc.onCall(ONGOING_GAME_MAIN_NAMESPACE, 'setDraft', (_, draft: DraftOptions) => {
      state.setDraft(draft)
    })

    ipc.onCall(ONGOING_GAME_MAIN_NAMESPACE, 'clearDraft', () => {
      state.setDraft(null)
    })

    ipc.onCall(ONGOING_GAME_MAIN_NAMESPACE, 'reload', () => {
      this._clearAndReloadAll()
    })

    ipc.onCall(ONGOING_GAME_MAIN_NAMESPACE, 'reloadPlayer', (_, puuid: string) => {
      this._reloadPlayer(puuid)
    })
  }

  private _clearAndReloadAll() {
    const { ipc, settings, state } = this._context

    state.clear({ keepTagParams: true, keepAdditionalInfo: true })
    ipc.sendEvent(ONGOING_GAME_MAIN_NAMESPACE, 'clear')

    const puuids = Object.values(state.teams).flat()

    this._playerData.updateSummoners(puuids, true)
    this._playerData.updateRankedStats(puuids, true)
    this._playerData.updateSavedInfo(puuids, true)
    this._playerData.updateChampionMasteries(puuids, true)
    this._matchHistory.updateMatchHistories(
      puuids,
      {
        startIndex: 0,
        count: settings.matchHistoryLoadCount,
        ...state.matchHistoryTagParams
      },
      state.apiShouldUse,
      true
    )
    this._additionalInfo.update()
  }

  private _reloadPlayer(puuid: string) {
    const { queueKeeper, settings, state } = this._context

    queueKeeper.cancelByTags(puuid)

    this._matchHistory.loadMatchHistory(puuid, {
      params: {
        startIndex: 0,
        count: settings.matchHistoryLoadCount,
        ...state.matchHistoryTagParams
      },
      force: true,
      apiSource: state.apiShouldUse
    })
    this._playerData.reloadPlayer(puuid)
  }
}
