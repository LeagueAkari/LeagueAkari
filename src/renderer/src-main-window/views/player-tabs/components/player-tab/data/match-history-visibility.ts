import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { isPveQueue } from '@shared/types/league-client/match-history'

export type MatchHistoryVisibilityOptions = {
  showPractice: boolean
  showIrregularGames: boolean
}

export function isIrregularGameForPlayer(g: LcuOrSgpGameSummary, puuid: string): boolean {
  const basicInfo = toBasicInfo(g)

  if (isPveQueue(basicInfo.queueId)) {
    return true
  }

  if (basicInfo.gameType !== 'MATCHED_GAME') {
    return true
  }

  const participant = toParticipants(g, basicInfo).find((p) => p.puuid === puuid)

  if (!participant) {
    return true
  }

  return participant.winResult === 'remake' || participant.winResult === 'abort'
}

export function shouldHideMatchHistoryGame(
  g: LcuOrSgpGameSummary,
  puuid: string,
  options: MatchHistoryVisibilityOptions
): boolean {
  const basicInfo = toBasicInfo(g)

  if (!options.showPractice && basicInfo.gameMode === 'PRACTICETOOL') {
    return true
  }

  if (!options.showIrregularGames && isIrregularGameForPlayer(g, puuid)) {
    return true
  }

  return false
}
