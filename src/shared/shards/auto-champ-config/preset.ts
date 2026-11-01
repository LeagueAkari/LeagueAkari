import type { ChampionRunesConfig } from '.'

export const GAME_MODE_TYPE_MAP: Record<string, string> = {
  CLASSIC: 'normal',
  ARAM: 'aram',
  URF: 'urf',
  NEXUSBLITZ: 'nexusblitz',
  ULTBOOK: 'ultbook'
}

export function resolveChampionPresetKey(
  runes: Record<string, ChampionRunesConfig | null> | undefined,
  gameMode: string,
  queueType: string,
  position: string
) {
  if (gameMode === 'CLASSIC') {
    if (queueType.startsWith('RANKED_')) {
      const positionKey = `ranked-${position}`
      return runes?.[positionKey] ? positionKey : 'ranked-default'
    }

    return 'normal'
  }

  return GAME_MODE_TYPE_MAP[gameMode] ?? null
}
