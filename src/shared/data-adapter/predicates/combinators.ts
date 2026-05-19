import { MatchBasicInfo, toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { MatchParticipant, toParticipants } from '@shared/data-adapter/match-history/participants'
import { TeamsAdapterResult, toTeams } from '@shared/data-adapter/match-history/teams'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { isPveQueue } from '@shared/types/league-client/match-history'

export type Predicate<T> = (value: T) => boolean

export type GameScope = {
  summary: LcuOrSgpGameSummary
  basicInfo: MatchBasicInfo
  participants: MatchParticipant[]
  teams: TeamsAdapterResult
}

export type ParticipantScope = {
  context: GameScope
  participant: MatchParticipant
}

export type ParticipantsScope = {
  context: GameScope
  participants: MatchParticipant[]
}

export type ParticipantNumberMeasureMode =
  | 'value'
  | 'teamShare'
  | 'teamMaxShare'
  | 'gameShare'
  | 'gameMaxShare'

export const and = <T>(...predicates: Predicate<T>[]) => {
  return (value: T) => predicates.every((predicate) => predicate(value))
}

export const or = <T>(...predicates: Predicate<T>[]) => {
  if (predicates.length === 0) return () => true // 特例，为了 UI 层面直观。但是注意，这不符合数学逻辑

  return (value: T) => predicates.some((predicate) => predicate(value))
}

/**
 * 适用于通过描述树结构构建的 and
 */
export const singleArgAnd = <T>(predicates: Predicate<T>[]) => {
  return (value: T) => predicates.every((predicate) => predicate(value))
}

/**
 * 同 singleArgAnd，不过是 or 的版本
 */
export const singleArgOr = <T>(predicates: Predicate<T>[]) => {
  return (value: T) => predicates.some((predicate) => predicate(value))
}

export const not = <T>(predicate: Predicate<T>) => {
  return (value: T) => !predicate(value)
}

export const game = (predicate: Predicate<GameScope>) => {
  return (data: LcuOrSgpGameSummary) => {
    const basicInfo = toBasicInfo(data)
    const participants = toParticipants(data, basicInfo)
    const teams = toTeams(data, basicInfo, participants)

    return predicate({ summary: data, basicInfo, participants, teams })
  }
}

export const player = (puuid: string, predicate: Predicate<ParticipantScope>) => {
  return (data: GameScope | ParticipantsScope) => {
    if (puuid === null) return true

    const participant = data.participants.find((p) => p.puuid === puuid)

    if (!participant) return false

    return predicate({ context: 'context' in data ? data.context : data, participant })
  }
}

export const anyone = (predicate: Predicate<ParticipantScope>) => {
  return (data: ParticipantsScope | GameScope) => {
    return data.participants.some((p) =>
      predicate({ participant: p, context: 'context' in data ? data.context : data })
    )
  }
}

export const everyone = (predicate: Predicate<ParticipantScope>) => {
  return (data: ParticipantsScope | GameScope) => {
    return data.participants.every((p) =>
      predicate({ participant: p, context: 'context' in data ? data.context : data })
    )
  }
}

export const isQueue = (queueId: number) => {
  return (data: GameScope) => {
    return data.basicInfo.queueId === queueId
  }
}

export const isGameMode = (gameMode: string) => {
  return (data: GameScope) => {
    return data.basicInfo.gameMode === gameMode
  }
}

export const all = (predicate: Predicate<ParticipantsScope>) => {
  return (data: GameScope) => {
    return predicate({ participants: data.participants, context: data })
  }
}

export const allies = (puuid: string | null, predicate: Predicate<ParticipantsScope>) => {
  return (data: GameScope) => {
    if (puuid === null) return true

    const participant = data.participants.find((p) => p.puuid === puuid)

    if (!participant) return false

    return predicate({
      participants: data.participants.filter(
        (p) => p.teamIdentifier === participant.teamIdentifier
      ),
      context: data
    })
  }
}

export const enemies = (puuid: string | null, predicate: Predicate<ParticipantsScope>) => {
  return (data: GameScope) => {
    if (puuid === null) return true

    const participant = data.participants.find((p) => p.puuid === puuid)

    if (!participant) return false

    return predicate({
      participants: data.participants.filter(
        (p) => p.teamIdentifier !== participant.teamIdentifier
      ),
      context: data
    })
  }
}

export const hasPlayer = (puuid: string) => {
  return (data: GameScope | ParticipantsScope) => {
    if (puuid === null) return true

    return data.participants.some((p) => p.puuid === puuid)
  }
}

export const hasAugment = (augmentId: number | null, order: number = -1) => {
  return (data: ParticipantScope) => {
    if (augmentId === null) return true

    if (order !== -1) {
      return data.participant.augments[order] === augmentId
    }

    return data.participant.augments.includes(augmentId)
  }
}

export const hasPerk = (perkId: number, order: number = -1) => {
  return (data: ParticipantScope) => {
    const perks = data.participant.perks.styles.flatMap((style) =>
      style.selections.map((selection) => selection.perk)
    )

    if (order !== -1) {
      return perks[order] === perkId
    }

    return perks.includes(perkId)
  }
}

export const hasPerkStyle = (styleId: number, order: number = -1) => {
  return (data: ParticipantScope) => {
    const perkStyles = data.participant.perks.styles.map((style) => style.style)

    if (order !== -1) {
      return perkStyles[order] === styleId
    }

    return perkStyles.includes(styleId)
  }
}

export const hasSpell = (spellId: number, order: number = -1) => {
  return (data: ParticipantScope) => {
    if (order !== -1) {
      return data.participant.spells[order] === spellId
    }

    return data.participant.spells.includes(spellId)
  }
}

export const isPosition = (position: string | null) => {
  return (data: ParticipantScope) => {
    return data.participant.position === position
  }
}

export const hasItem = (itemId: number, order: number = -1) => {
  return (data: ParticipantScope) => {
    if (data.participant.roleBoundItem === itemId) return true

    if (order !== -1) {
      return data.participant.items[order] === itemId
    }

    return data.participant.items.includes(itemId)
  }
}

export const isChampion = (championId: number) => {
  return (data: ParticipantScope) => {
    return data.participant.championId === championId
  }
}

export const durationBetween = (minSeconds = 0, maxSeconds = Infinity) => {
  return (data: GameScope) => {
    return data.basicInfo.gameDuration >= minSeconds && data.basicInfo.gameDuration <= maxSeconds
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

export const gameCreationInTimeRange = (range: string | null) => {
  return (data: GameScope) => {
    if (!range || range === 'all') return true

    const now = Date.now()
    let startAt: number

    switch (range) {
      case 'last3Hours':
        startAt = now - 3 * 60 * 60 * 1000
        break
      case 'last12Hours':
        startAt = now - 12 * 60 * 60 * 1000
        break
      case 'last24Hours':
        startAt = now - DAY_MS
        break
      case 'last3Days':
        startAt = now - 3 * DAY_MS
        break
      case 'last7Days':
        startAt = now - 7 * DAY_MS
        break
      case 'last30Days':
        startAt = now - 30 * DAY_MS
        break
      default:
        return true
    }

    return data.basicInfo.gameCreation >= startAt && data.basicInfo.gameCreation <= now
  }
}

export const kdaBetween = (minKda = 0, maxKda = Infinity) => {
  return (data: ParticipantScope) => {
    return data.participant.kda >= minKda && data.participant.kda <= maxKda
  }
}

export const isWin = () => {
  return (data: ParticipantScope | ParticipantsScope) => {
    if ('participant' in data) {
      return data.participant.winResult === 'win'
    }

    if (data.participants.length === 0) return false

    return data.participants[0].winResult === 'win'
  }
}

export const isLoss = (isSurrender = false) => {
  return (data: ParticipantScope | ParticipantsScope) => {
    if ('participant' in data) {
      return data.participant.winResult === 'loss' && data.participant.isSurrender === isSurrender
    }

    return (
      data.participants.at(0)?.winResult === 'loss' &&
      data.participants.at(0)?.isSurrender === isSurrender
    )
  }
}

export const isRemake = () => {
  return (data: ParticipantScope | ParticipantsScope | GameScope) => {
    if ('participant' in data) {
      return data.participant.winResult === 'remake'
    }

    return data.participants.at(0)?.winResult === 'remake'
  }
}

export const isAbort = () => {
  return (data: ParticipantScope | ParticipantsScope | GameScope) => {
    if ('participant' in data) {
      return data.participant.winResult === 'abort'
    }

    return data.participants.at(0)?.winResult === 'abort'
  }
}

export const isMatchedGame = () => {
  return (data: GameScope) => {
    return data.basicInfo.gameType === 'MATCHED_GAME'
  }
}

export const isPveGame = () => {
  return (data: GameScope) => {
    return isPveQueue(data.basicInfo.queueId)
  }
}

export const isMap = (mapId: number) => {
  return (data: GameScope) => {
    return data.basicInfo.mapId === mapId
  }
}

const participantNumberBetween = (
  selector: (participant: MatchParticipant) => number | null,
  nullValueMatches = false
) => {
  return (
    modeOrMin: ParticipantNumberMeasureMode | number = 0,
    minOrMax?: number,
    maybeMax?: number
  ) => {
    return (data: ParticipantScope) => {
      const value = selector(data.participant)

      if (value === null) return nullValueMatches

      if (typeof modeOrMin !== 'string') {
        return value >= modeOrMin && value <= (minOrMax ?? Infinity)
      }

      const min = minOrMax ?? 0
      const max = maybeMax ?? Infinity

      if (modeOrMin === 'value') {
        return value >= min && value <= max
      }

      const relatedParticipants = modeOrMin.startsWith('team')
        ? data.context.participants.filter(
            (p) => p.teamIdentifier === data.participant.teamIdentifier
          )
        : data.context.participants
      const relatedValues = relatedParticipants.map(selector).filter((v): v is number => v !== null)

      const baseline =
        modeOrMin === 'teamShare' || modeOrMin === 'gameShare'
          ? relatedValues.reduce((acc, current) => acc + current, 0)
          : relatedValues.length
            ? Math.max(...relatedValues)
            : 0

      const percent = baseline === 0 ? 0 : (value / baseline) * 100

      return percent >= min && percent <= max
    }
  }
}

const participantPercentBetween = (selector: (participant: MatchParticipant) => number | null) => {
  return (minPercent = 0, maxPercent = Infinity) => {
    return (data: ParticipantScope) => {
      const value = selector(data.participant)

      if (value === null) return false

      return value >= minPercent / 100 && value <= maxPercent / 100
    }
  }
}

export const levelBetween = participantNumberBetween((p) => p.level)
export const killsBetween = participantNumberBetween((p) => p.kills)
export const deathsBetween = participantNumberBetween((p) => p.deaths)
export const assistsBetween = participantNumberBetween((p) => p.assists)
export const csBetween = participantNumberBetween((p) => p.cs)
export const killParticipationBetween = participantPercentBetween((p) => p.killParticipation)
export const goldBetween = participantNumberBetween((p) => p.goldEarned)
export const damageDealtToChampionsBetween = participantNumberBetween(
  (p) => p.totalDamageDealtToChampions
)
export const physicalDamageDealtToChampionsBetween = participantNumberBetween(
  (p) => p.physicalDamageDealtToChampions
)
export const magicDamageDealtToChampionsBetween = participantNumberBetween(
  (p) => p.magicDamageDealtToChampions
)
export const trueDamageDealtToChampionsBetween = participantNumberBetween(
  (p) => p.trueDamageDealtToChampions
)
export const damageTakenBetween = participantNumberBetween((p) => p.totalDamageTaken)
export const physicalDamageTakenBetween = participantNumberBetween((p) => p.physicalDamageTaken)
export const magicDamageTakenBetween = participantNumberBetween((p) => p.magicDamageTaken)
export const trueDamageTakenBetween = participantNumberBetween((p) => p.trueDamageTaken)
export const goldSpentBetween = participantNumberBetween((p) => p.goldSpent)
export const damageToTowersBetween = participantNumberBetween((p) => p.totalDamageToTowers)
export const healBetween = participantNumberBetween((p) => p.totalHeal)
export const visionScoreBetween = participantNumberBetween((p) => p.visionScore)
export const timeCCingOthersBetween = participantNumberBetween((p) => p.timeCCingOthers)
export const dgrBetween = participantPercentBetween((p) => p.damageGoldEfficiency)
export const soloKillsBetween = participantNumberBetween((p) => p.soloKills)
export const doubleKillsBetween = participantNumberBetween((p) => p.doubleKills)
export const tripleKillsBetween = participantNumberBetween((p) => p.tripleKills)
export const quadraKillsBetween = participantNumberBetween((p) => p.quadraKills)
export const pentaKillsBetween = participantNumberBetween((p) => p.pentaKills)
