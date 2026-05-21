import { ChampSelectSession } from '@shared/types/league-client/champ-select'
import { z } from 'zod'

import {
  ChampSelectVisibilityConfigLike,
  collectVisibleChampSelectMembers
} from './champ-select-members'

export const ChampSelectHandoffSnapshotSchema = z.object({
  gameId: z.number().positive(),
  teams: z.record(z.string(), z.array(z.string())),
  players: z.record(
    z.string(),
    z.object({
      championId: z.number(),
      position: z.string(),
      spell1Id: z.number(),
      spell2Id: z.number()
    })
  )
})

export type ChampSelectHandoffSnapshot = z.infer<typeof ChampSelectHandoffSnapshotSchema>

export function buildChampSelectHandoffSnapshot(
  session: ChampSelectSession,
  config: ChampSelectVisibilityConfigLike
): ChampSelectHandoffSnapshot | null {
  if (!config.spotlight.deobfuscation || !session.gameId) {
    return null
  }

  const snapshot: ChampSelectHandoffSnapshot = {
    gameId: session.gameId,
    teams: {},
    players: {}
  }

  for (const member of collectVisibleChampSelectMembers(session, config)) {
    snapshot.teams[member.teamIdentifier] ??= []
    snapshot.teams[member.teamIdentifier].push(member.puuid)
    snapshot.players[member.puuid] = {
      championId: member.championId,
      position: member.position,
      spell1Id: member.spell1Id,
      spell2Id: member.spell2Id
    }
  }

  if (!Object.keys(snapshot.players).length) {
    return null
  }

  return snapshot
}

export function isChampSelectHandoffSnapshot(value: unknown): value is ChampSelectHandoffSnapshot {
  return ChampSelectHandoffSnapshotSchema.safeParse(value).success
}
