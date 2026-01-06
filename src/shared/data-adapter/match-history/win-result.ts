export type WinResult = 'win' | 'loss' | 'remake' | 'abort'

export type WinResultInfo = {
  isSurrender: boolean
  result: WinResult
}

export function computeWinResult(
  endOfGameResult: string | undefined,
  participant: {
    gameEndedInEarlySurrender: boolean
    gameEndedInSurrender: boolean
    teamEarlySurrendered: boolean
    win: boolean
  }
): WinResultInfo {
  // 目前已知有：Abort_AntiCheatExit, Abort_Unexpected
  if (endOfGameResult && endOfGameResult.startsWith('Abort_')) {
    return { isSurrender: false, result: 'abort' }
  }

  if (participant.gameEndedInEarlySurrender) {
    return { isSurrender: true, result: 'remake' }
  }

  if (participant.teamEarlySurrendered) {
    return { isSurrender: true, result: 'loss' }
  }

  if (participant.win) {
    return { isSurrender: false, result: 'win' }
  } else {
    return { isSurrender: participant.gameEndedInSurrender, result: 'loss' }
  }
}
