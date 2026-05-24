import type { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'

export type MatchPreviewPayload = {
  summary: LcuOrSgpGameSummary | number
  details?: LcuOrSgpGameDetails
  puuid?: string
  source?: 'sgp' | 'lcu'
}

export type MatchPreviewState = {
  gameId: number
  source: 'sgp' | 'lcu'
  puuid?: string
  summary?: LcuOrSgpGameSummary
  details?: LcuOrSgpGameDetails
}

export const toMatchPreviewState = (
  payload: MatchPreviewPayload,
  fallbackSource: 'sgp' | 'lcu',
  fallbackPuuid?: string
): MatchPreviewState => {
  const puuid = payload.puuid ?? fallbackPuuid

  if (typeof payload.summary === 'number') {
    return {
      gameId: payload.summary,
      source: payload.source ?? fallbackSource,
      puuid
    }
  }

  const details =
    payload.details?.gameId === payload.summary.gameId &&
    payload.details.source === payload.summary.source
      ? payload.details
      : undefined

  return {
    gameId: payload.summary.gameId,
    source: payload.summary.source,
    puuid,
    summary: payload.summary,
    details
  }
}
