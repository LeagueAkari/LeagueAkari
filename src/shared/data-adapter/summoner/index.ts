import { SummonerInfo } from '@shared/types/league-client/summoner'
import { SgpSummonerLol } from '@shared/types/sgp/summoner'

import { SgpOrLcuSummoner } from '../wrapper'

export function toLcuSummoner(
  sgpSummoner: SgpSummonerLol,
  gameName: string = '',
  tagLine: string = ''
): SummonerInfo {
  return {
    accountId: sgpSummoner.accountId,
    displayName: sgpSummoner.name,
    gameName: gameName,
    internalName: sgpSummoner.internalName,
    nameChangeFlag: sgpSummoner.nameChangeFlag,
    percentCompleteForNextLevel: Math.round(
      (sgpSummoner.expPoints / sgpSummoner.expToNextLevel) * 100
    ),
    privacy: sgpSummoner.privacy as 'PUBLIC' | 'PRIVATE' | string, // 强制转换以匹配类型
    profileIconId: sgpSummoner.profileIconId,
    puuid: sgpSummoner.puuid,

    // 默认留空
    rerollPoints: {
      currentPoints: 0,
      maxRolls: 0,
      pointsToReroll: 0,
      numberOfRolls: 0,
      pointsCostToRoll: 0
    },
    tagLine: tagLine,
    summonerId: sgpSummoner.id,
    summonerLevel: sgpSummoner.level,
    unnamed: sgpSummoner.unnamed,
    xpSinceLastLevel: sgpSummoner.expPoints,
    xpUntilNextLevel: sgpSummoner.expToNextLevel - sgpSummoner.expPoints
  }
}

// 国服特供
type PrivacyConstant = 'PUBLIC' | 'PRIVATE' | (string & {})

export type Summoner = {
  gameName: string
  tagLine: string
  puuid: string
  summonerId: number
  level: number
  privacy: PrivacyConstant
  profileIconId: number
  expPoints: number
  expToNextLevel: number
}

export function toSummoner(
  summoner: SgpOrLcuSummoner,
  sgpCompletion = { gameName: '', tagLine: '' }
): Summoner {
  if (summoner.source === 'sgp') {
    const { gameName, tagLine } = sgpCompletion

    return {
      gameName,
      tagLine,
      puuid: summoner.data.puuid,
      summonerId: summoner.data.id,
      level: summoner.data.level,
      privacy: summoner.data.privacy,
      profileIconId: summoner.data.profileIconId,
      expPoints: summoner.data.expPoints,
      expToNextLevel: summoner.data.expToNextLevel
    }
  }

  return {
    gameName: summoner.data.gameName,
    tagLine: summoner.data.tagLine,
    puuid: summoner.data.puuid,
    summonerId: summoner.data.summonerId,
    level: summoner.data.summonerLevel,
    privacy: summoner.data.privacy,
    profileIconId: summoner.data.profileIconId,
    expPoints: summoner.data.xpSinceLastLevel,
    expToNextLevel: summoner.data.xpUntilNextLevel + summoner.data.xpSinceLastLevel
  }
}
