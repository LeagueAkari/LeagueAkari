export type WinResult = 'win' | 'lose' | 'remake' | 'abort'

export type WinResultInfo = {
  isSurrender: boolean
  result: WinResult
}

export function computeWinResult(
  endOfGameResult: string,
  participant: {
    gameEndedInEarlySurrender: boolean
    gameEndedInSurrender: boolean
    teamEarlySurrendered: boolean
    win: boolean
  }
): WinResultInfo {
  if (endOfGameResult === 'Abort_AntiCheatExit') {
    return { isSurrender: false, result: 'abort' }
  }

  if (participant.gameEndedInEarlySurrender) {
    return { isSurrender: true, result: 'remake' }
  }

  if (participant.teamEarlySurrendered) {
    return { isSurrender: true, result: 'lose' }
  }

  if (participant.win) {
    return { isSurrender: false, result: 'win' }
  } else {
    return { isSurrender: participant.gameEndedInSurrender, result: 'lose' }
  }
}
