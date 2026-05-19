import { SUMMONER_SPELL_FLASH_ID } from '@shared/constants/summoner-spells'

import type { AggregatedSpellsAnalysis } from '../types/aggregated'
import type { PreparedGame } from '../types/helpers'

export function computeAggregatedSpells(games: PreparedGame[]): AggregatedSpellsAnalysis {
  let flashOnD = 0
  let flashOnF = 0
  for (const g of games) {
    if (g.participant.spells[0] === SUMMONER_SPELL_FLASH_ID) flashOnD++
    if (g.participant.spells[1] === SUMMONER_SPELL_FLASH_ID) flashOnF++
  }
  return { flashOnD, flashOnF }
}
