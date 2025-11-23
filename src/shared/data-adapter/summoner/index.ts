import { SummonerInfo } from '@shared/types/league-client/summoner'
import { SgpSummoner } from '@shared/types/sgp/summoner'

export function toLcuSummoner(
  sgpSummoner: SgpSummoner,
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
