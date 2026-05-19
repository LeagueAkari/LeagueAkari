import type { MatchParticipant } from '../../../match-history/participants'
import type { AnyTimelineFrame } from '../types/helpers'
import type { SingleObjectivesAnalysis } from '../types/single'

export function computeSingleObjectives(
  frames: AnyTimelineFrame[],
  participant: MatchParticipant
): SingleObjectivesAnalysis {
  let firstDragonTeam: number | null = null
  let dragons = 0
  let soloDragons = 0
  let firstDragonTime: number | null = null
  let voidgrubs = 0
  let firstVoidgrubTime: number | null = null
  let heralds = 0
  let firstHeraldTime: number | null = null
  let barons = 0
  let firstBaronTime: number | null = null

  for (const frame of frames) {
    if (!frame.events) continue
    for (const event of frame.events) {
      if (event.type !== 'ELITE_MONSTER_KILL') continue

      const killerTeam =
        event.killerTeamId ?? (event.killerId >= 1 && event.killerId <= 5 ? 100 : 200)
      const isOurTeam = killerTeam === participant.teamId
      const timeSec = event.timestamp / 1000

      switch (event.monsterType) {
        case 'DRAGON':
          if (firstDragonTeam === null) {
            firstDragonTeam = killerTeam
          }
          if (isOurTeam) {
            dragons++
            const assists = event.assistingParticipantIds ?? []
            if (event.killerId === participant.participantId && assists.length === 0) {
              soloDragons++
            }
            if (firstDragonTime === null) firstDragonTime = timeSec
          }
          break
        case 'HORDE':
          if (isOurTeam) {
            voidgrubs++
            if (firstVoidgrubTime === null) firstVoidgrubTime = timeSec
          }
          break
        case 'RIFTHERALD':
          if (isOurTeam) {
            heralds++
            if (firstHeraldTime === null) firstHeraldTime = timeSec
          }
          break
        case 'BARON_NASHOR':
          if (isOurTeam) {
            barons++
            if (firstBaronTime === null) firstBaronTime = timeSec
          }
          break
      }
    }
  }

  return {
    gotFirstDragon: firstDragonTeam !== null ? firstDragonTeam === participant.teamId : null,
    dragons,
    soloDragons,
    firstDragonTime,
    voidgrubs,
    firstVoidgrubTime,
    heralds,
    firstHeraldTime,
    barons,
    firstBaronTime
  }
}
