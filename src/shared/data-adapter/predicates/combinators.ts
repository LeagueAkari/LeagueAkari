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

export const kdaBetween = (minKda = 0, maxKda = Infinity) => {
  return (data: ParticipantScope) => {
    return data.participant.kda >= minKda && data.participant.kda <= maxKda
  }
}

export const killsBetween = (minKills = 0, maxKills = Infinity) => {
  return (data: ParticipantScope) => {
    return data.participant.kills >= minKills && data.participant.kills <= maxKills
  }
}

export const deathsBetween = (minDeaths = 0, maxDeaths = Infinity) => {
  return (data: ParticipantScope) => {
    return data.participant.deaths >= minDeaths && data.participant.deaths <= maxDeaths
  }
}

export const assistsBetween = (minAssists = 0, maxAssists = Infinity) => {
  return (data: ParticipantScope) => {
    return data.participant.assists >= minAssists && data.participant.assists <= maxAssists
  }
}

export const goldBetween = (minGold = 0, maxGold = Infinity) => {
  return (data: ParticipantScope) => {
    return data.participant.goldEarned >= minGold && data.participant.goldEarned <= maxGold
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

/**
 * Damage Gold Efficiency
 * @param minDgr 最小转换率 (%)，如 50%，注意不是 0.50
 * @param maxDgr 最大转换率 (%)，如 500%，注意不是 5.00
 * @returns
 */
export const dgrBetween = (minDgr = 0, maxDgr = Infinity) => {
  return (data: ParticipantScope) => {
    return (
      data.participant.damageGoldEfficiency >= minDgr / 100 &&
      data.participant.damageGoldEfficiency <= maxDgr / 100
    )
  }
}

export const csBetween = (minCs = 0, maxCs = Infinity) => {
  return (data: ParticipantScope) => {
    return data.participant.cs >= minCs && data.participant.cs <= maxCs
  }
}

/**
 * 仅用于 SGP 数据源，LCU 数据源无此字段
 */
export const soloKillsBetween = (minSoloKills = 0, maxSoloKills = Infinity) => {
  return (data: ParticipantScope) => {
    if (data.participant.soloKills === null) return false

    return data.participant.soloKills >= minSoloKills && data.participant.soloKills <= maxSoloKills
  }
}
