import { useNumberFormatter } from '@renderer-shared/composables/useNumebrFormatter'
import { Participant } from '@shared/types/league-client/match-history'
import { SgpParticipantLol } from '@shared/types/sgp/match-history'
import { useTranslation } from 'i18next-vue'
import { type VNodeChild, computed, toValue } from 'vue'

import { useMatchCard } from '../context'
import { formatSeconds } from './time'

export type RenderGroupOptions = {
  key:
    | keyof SgpParticipantLol
    | keyof Participant['stats']
    | keyof SgpParticipantLol['challenges']
    | (string & {})

  /** 是否忽略这个字段 */
  hide?: boolean

  /** 各自渲染方式：数字、文本、自定义 */
  render?:
    | 'float'
    | 'integer'
    | 'text'
    | 'compat'
    | 'boolean'
    | 'game-time'
    | 'percentage'
    | 'auto'
    | ((value: any) => VNodeChild)
}

export type RenderGroup = {
  group: string
  items: RenderGroupOptions[]
}

export const RENDER_GROUPS: RenderGroup[] = [
  {
    group: 'combat-stats',
    items: [
      { key: 'kills', render: 'integer' }, // lcu + sgp
      { key: 'deaths', render: 'integer' }, // lcu + sgp
      { key: 'assists', render: 'integer' }, // lcu + sgp
      { key: 'doubleKills', render: 'integer' }, // lcu + sgp
      { key: 'tripleKills', render: 'integer' }, // lcu + sgp
      { key: 'quadraKills', render: 'integer' }, // lcu + sgp
      { key: 'pentaKills', render: 'integer' }, // lcu + sgp
      { key: 'unrealKills', render: 'integer' }, // lcu + sgp
      { key: 'killingSprees', render: 'integer' }, // lcu + sgp
      { key: 'largestKillingSpree', render: 'integer' }, // lcu + sgp
      { key: 'largestMultiKill', render: 'integer' }, // lcu + sgp
      { key: 'longestTimeSpentLiving', render: 'integer' }, // lcu + sgp
      { key: 'largestCriticalStrike', render: 'integer' } // lcu + sgp
    ]
  },
  {
    group: 'akari',
    items: [
      { key: 'akariScore', render: 'float' } // ethereal
    ]
  },
  {
    group: 'damage',
    items: [
      // Damage to Champions
      { key: 'totalDamageDealtToChampions', render: 'compat' }, // lcu + sgp
      { key: 'physicalDamageDealtToChampions', render: 'compat' }, // lcu + sgp
      { key: 'magicDamageDealtToChampions', render: 'compat' }, // lcu + sgp
      { key: 'trueDamageDealtToChampions', render: 'compat' }, // lcu + sgp
      // Total Damage Dealt
      { key: 'totalDamageDealt', render: 'compat' }, // lcu + sgp
      { key: 'physicalDamageDealt', render: 'compat' }, // lcu + sgp
      { key: 'magicDamageDealt', render: 'compat' }, // lcu + sgp
      { key: 'trueDamageDealt', render: 'compat' }, // lcu + sgp
      // Damage to Structures
      { key: 'damageDealtToObjectives', render: 'compat' }, // lcu + sgp
      { key: 'damageDealtToTurrets', render: 'compat' }, // lcu + sgp
      { key: 'damageDealtToBuildings', render: 'compat' }, // sgp only
      { key: 'damageDealtToEpicMonsters', render: 'compat' }, // sgp only
      // Damage Taken
      { key: 'totalDamageTaken', render: 'compat' }, // lcu + sgp
      { key: 'physicalDamageTaken', render: 'compat' }, // lcu + sgp
      { key: 'magicDamageTaken', render: 'compat' }, // sgp only
      { key: 'magicalDamageTaken', render: 'compat' }, // lcu only
      { key: 'trueDamageTaken', render: 'compat' }, // lcu + sgp
      { key: 'damageSelfMitigated', render: 'compat' }, // lcu + sgp
      // Damage Related (Support/Shield)
      { key: 'totalDamageShieldedOnTeammates', render: 'compat' } // sgp only
    ]
  },
  {
    group: 'cc',
    items: [
      { key: 'timeCCingOthers', render: 'integer' }, // lcu + sgp
      { key: 'totalTimeCCDealt', render: 'integer' }, // sgp only
      { key: 'totalTimeCrowdControlDealt', render: 'integer' }, // lcu only (renamed from totalTimeCCDealt)
      { key: 'enemyChampionImmobilizations', render: 'integer' }, // sgp challenges
      { key: 'immobilizeAndKillWithAlly', render: 'integer' }, // sgp challenges
      { key: 'knockEnemyIntoTeamAndKill', render: 'integer' }, // sgp challenges
      { key: 'survivedThreeImmobilizesInFight', render: 'integer' }, // sgp challenges
      { key: 'highestCrowdControlScore', render: 'integer' } // sgp challenges
    ]
  },
  {
    group: 'vision',
    items: [
      { key: 'visionScore', render: 'integer' }, // lcu + sgp
      { key: 'wardsPlaced', render: 'integer' }, // lcu + sgp
      { key: 'wardsKilled', render: 'integer' }, // lcu + sgp
      { key: 'sightWardsBoughtInGame', render: 'integer' }, // lcu + sgp
      { key: 'visionWardsBoughtInGame', render: 'integer' }, // lcu + sgp
      { key: 'detectorWardsPlaced', render: 'integer' }, // sgp only
      { key: 'visionScorePerMinute', render: 'integer' }, // sgp challenges
      { key: 'wardTakedowns', render: 'integer' }, // sgp challenges
      { key: 'wardTakedownsBefore20M', render: 'integer' }, // sgp challenges
      { key: 'wardsGuarded', render: 'integer' }, // sgp challenges
      { key: 'twoWardsOneSweeperCount', render: 'integer' }, // sgp challenges
      { key: 'controlWardsPlaced', render: 'integer' }, // sgp challenges
      { key: 'stealthWardsPlaced', render: 'integer' }, // sgp challenges
      { key: 'visionScoreAdvantageLaneOpponent', render: 'float' } // sgp challenges
    ]
  },
  {
    group: 'buildings',
    items: [
      // Turrets
      { key: 'turretKills', render: 'integer' }, // lcu + sgp
      { key: 'turretTakedowns', render: 'integer' }, // sgp only
      { key: 'soloTurretsLategame', render: 'integer' }, // sgp challenges
      { key: 'turretsLost', render: 'integer' }, // sgp only
      { key: 'firstTowerKill', render: 'boolean' }, // lcu + sgp
      { key: 'firstTowerAssist', render: 'boolean' }, // lcu + sgp
      { key: 'firstTurretKilled', render: 'integer' }, // sgp challenges
      { key: 'firstTurretKilledTime', render: 'game-time' }, // sgp challenges
      { key: 'turretPlatesTaken', render: 'integer' }, // sgp challenges
      { key: 'kTurretsDestroyedBeforePlatesFall', render: 'integer' }, // sgp challenges
      { key: 'outerTurretExecutesBefore10Minutes', render: 'integer' }, // sgp challenges
      { key: 'quickFirstTurret', render: 'integer' }, // sgp challenges
      { key: 'takedownOnFirstTurret', render: 'integer' }, // sgp challenges
      { key: 'turretsTakenWithRiftHerald', render: 'integer' }, // sgp challenges
      { key: 'multiTurretRiftHeraldCount', render: 'integer' }, // sgp challenges
      // Inhibitors
      { key: 'inhibitorKills', render: 'integer' }, // lcu + sgp
      { key: 'inhibitorTakedowns', render: 'integer' }, // sgp only
      { key: 'inhibitorsLost', render: 'integer' }, // sgp only
      { key: 'firstInhibitorKill', render: 'boolean' }, // lcu only
      { key: 'firstInhibitorAssist', render: 'boolean' }, // lcu only
      { key: 'lostAnInhibitor', render: 'integer' }, // sgp challenges
      // Nexus
      { key: 'nexusKills', render: 'integer' }, // sgp only
      { key: 'nexusLost', render: 'integer' }, // sgp only
      { key: 'nexusTakedowns', render: 'integer' }, // sgp only
      { key: 'hadOpenNexus', render: 'boolean' }, // sgp challenges
      { key: 'outnumberedNexusKill', render: 'integer' }, // sgp challenges
      // Objectives
      { key: 'objectivesStolen', render: 'integer' }, // sgp only
      { key: 'objectivesStolenAssists', render: 'integer' } // sgp only
    ]
  },
  {
    group: 'economy',
    items: [
      { key: 'goldEarned', render: 'compat' }, // lcu + sgp
      { key: 'goldSpent', render: 'compat' }, // lcu + sgp
      { key: 'totalMinionsKilled', render: 'integer' }, // lcu + sgp
      { key: 'neutralMinionsKilled', render: 'integer' }, // lcu + sgp
      { key: 'neutralMinionsKilledEnemyJungle', render: 'integer' }, // lcu only
      { key: 'neutralMinionsKilledTeamJungle', render: 'integer' }, // lcu only
      { key: 'totalAllyJungleMinionsKilled', render: 'integer' }, // sgp only
      { key: 'totalEnemyJungleMinionsKilled', render: 'integer' }, // sgp only
      { key: 'consumablesPurchased', render: 'integer' }, // sgp only
      { key: 'itemsPurchased', render: 'integer' }, // sgp only
      { key: 'earlyLaningPhaseGoldExpAdvantage', render: 'integer' }, // sgp challenges
      { key: 'laningPhaseGoldExpAdvantage', render: 'integer' }, // sgp challenges
      { key: 'maxCsAdvantageOnLaneOpponent', render: 'integer' } // sgp challenges
    ]
  },
  {
    group: 'healing',
    items: [
      { key: 'totalHeal', render: 'compat' }, // lcu + sgp
      { key: 'totalUnitsHealed', render: 'integer' }, // lcu + sgp
      { key: 'totalHealsOnTeammates', render: 'compat' } // sgp only
    ]
  },
  {
    group: 'pings',
    items: [
      { key: 'allInPings', render: 'integer' }, // sgp only
      { key: 'assistMePings', render: 'integer' }, // sgp only
      { key: 'basicPings', render: 'integer' }, // sgp only
      { key: 'commandPings', render: 'integer' }, // sgp only
      { key: 'dangerPings', render: 'integer' }, // sgp only
      { key: 'enemyMissingPings', render: 'integer' }, // sgp only
      { key: 'enemyVisionPings', render: 'integer' }, // sgp only
      { key: 'getBackPings', render: 'integer' }, // sgp only
      { key: 'holdPings', render: 'integer' }, // sgp only
      { key: 'needVisionPings', render: 'integer' }, // sgp only
      { key: 'onMyWayPings', render: 'integer' }, // sgp only
      { key: 'pushPings', render: 'integer' }, // sgp only
      { key: 'retreatPings', render: 'integer' }, // sgp only
      { key: 'visionClearedPings', render: 'integer' } // sgp only
    ]
  },
  {
    group: 'combat-advanced',
    items: [
      { key: 'soloKills', render: 'integer' }, // sgp challenges
      { key: 'quickSoloKills', render: 'integer' }, // sgp challenges
      { key: 'takedowns', render: 'integer' }, // sgp challenges
      { key: 'outnumberedKills', render: 'integer' }, // sgp challenges
      { key: 'multikills', render: 'integer' }, // sgp challenges
      { key: 'multikillsAfterAggressiveFlash', render: 'integer' }, // sgp challenges
      { key: 'multiKillOneSpell', render: 'integer' }, // sgp challenges
      { key: 'killAfterHiddenWithAlly', render: 'integer' }, // sgp challenges
      { key: 'pickKillWithAlly', render: 'integer' }, // sgp challenges
      { key: 'killsWithHelpFromEpicMonster', render: 'integer' }, // sgp challenges
      { key: 'takedownsBeforeJungleMinionSpawn', render: 'integer' }, // sgp challenges
      { key: 'takedownsFirstXMinutes', render: 'integer' }, // sgp challenges
      { key: 'takedownsAfterGainingLevelAdvantage', render: 'integer' }, // sgp challenges
      { key: 'takedownsInAlcove', render: 'integer' }, // sgp challenges
      { key: 'takedownsInEnemyFountain', render: 'integer' }, // sgp challenges
      { key: 'killsOnOtherLanesEarlyJungleAsLaner', render: 'integer' }, // sgp challenges
      { key: 'getTakedownsInAllLanesEarlyJungleAsLaner', render: 'integer' }, // sgp challenges
      { key: 'killsOnRecentlyHealedByAramPack', render: 'integer' } // sgp challenges
    ]
  },
  {
    group: 'objectives',
    items: [
      // Epic Monsters
      { key: 'baronTakedowns', render: 'integer' }, // sgp challenges
      { key: 'baronBuffGoldAdvantageOverThreshold', render: 'integer' }, // sgp challenges
      { key: 'earliestBaron', render: 'game-time' }, // sgp challenges
      { key: 'earliestDragonTakedown', render: 'game-time' }, // sgp challenges
      { key: 'dragonTakedowns', render: 'integer' }, // sgp challenges
      { key: 'riftHeraldTakedowns', render: 'integer' }, // sgp challenges
      { key: 'teamBaronKills', render: 'integer' }, // sgp challenges
      { key: 'teamElderDragonKills', render: 'integer' }, // sgp challenges
      { key: 'teamRiftHeraldKills', render: 'integer' }, // sgp challenges
      { key: 'soloBaronKills', render: 'integer' }, // sgp challenges
      { key: 'elderDragonKillsWithOpposingSoul', render: 'integer' }, // sgp challenges
      { key: 'elderDragonMultikills', render: 'integer' }, // sgp challenges
      { key: 'perfectDragonSoulsTaken', render: 'integer' }, // sgp challenges
      { key: 'epicMonsterSteals', render: 'integer' }, // sgp challenges
      { key: 'epicMonsterStolenWithoutSmite', render: 'integer' }, // sgp challenges
      { key: 'epicMonsterKillsNearEnemyJungler', render: 'integer' }, // sgp challenges
      { key: 'epicMonsterKillsWithin30SecondsOfSpawn', render: 'integer' }, // sgp challenges
      { key: 'junglerTakedownsNearDamagedEpicMonster', render: 'integer' }, // sgp challenges
      { key: 'voidMonsterKill', render: 'integer' }, // sgp challenges
      // Jungle
      { key: 'alliedJungleMonsterKills', render: 'integer' }, // sgp challenges
      { key: 'enemyJungleMonsterKills', render: 'integer' }, // sgp challenges
      { key: 'scuttleCrabKills', render: 'integer' }, // sgp challenges
      { key: 'buffsStolen', render: 'integer' }, // sgp challenges
      { key: 'jungleCsBefore10Minutes', render: 'integer' }, // sgp challenges
      { key: 'initialBuffCount', render: 'integer' }, // sgp challenges
      { key: 'initialCrabCount', render: 'integer' }, // sgp challenges
      { key: 'moreEnemyJungleThanOpponent', render: 'integer' } // sgp challenges
    ]
  },
  {
    group: 'statistics',
    items: [
      { key: 'kda', render: 'float' }, // sgp challenges
      { key: 'killParticipation', render: 'percentage' }, // sgp challenges
      { key: 'damagePerMinute', render: 'compat' }, // sgp challenges
      { key: 'goldPerMinute', render: 'compat' }, // sgp challenges
      { key: 'damageTakenOnTeamPercentage', render: 'integer' }, // sgp challenges
      { key: 'teamDamagePercentage', render: 'integer' } // sgp challenges
    ]
  },
  {
    group: 'abilities',
    items: [
      { key: 'abilityUses', render: 'integer' }, // sgp challenges
      { key: 'spell1Casts', render: 'integer' }, // sgp only
      { key: 'spell2Casts', render: 'integer' }, // sgp only
      { key: 'spell3Casts', render: 'integer' }, // sgp only
      { key: 'spell4Casts', render: 'integer' }, // sgp only
      { key: 'summoner1Casts', render: 'integer' }, // sgp only
      { key: 'summoner2Casts', render: 'integer' } // sgp only
    ]
  },
  {
    group: 'survival-skills',
    items: [
      // Survival
      { key: 'deathsByEnemyChamps', render: 'integer' }, // sgp challenges
      { key: 'survivedSingleDigitHpCount', render: 'integer' }, // sgp challenges
      { key: 'tookLargeDamageSurvived', render: 'integer' }, // sgp challenges
      { key: 'killedChampTookFullTeamDamageSurvived', render: 'integer' }, // sgp challenges
      { key: 'saveAllyFromDeath', render: 'integer' }, // sgp challenges
      // Skills
      { key: 'skillshotsDodged', render: 'integer' }, // sgp challenges
      { key: 'skillshotsHit', render: 'integer' }, // sgp challenges
      { key: 'snowballsHit', render: 'integer' }, // sgp challenges
      { key: 'dodgeSkillShotsSmallWindow', render: 'integer' }, // sgp challenges
      { key: 'landSkillShotsEarlyGame', render: 'integer' }, // sgp challenges
      { key: 'blastConeOppositeOpponentCount', render: 'integer' }, // sgp challenges
      { key: 'quickCleanse', render: 'integer' }, // sgp challenges
      { key: 'dancedWithRiftHerald', render: 'integer' }, // sgp challenges
      { key: 'fistBumpParticipation', render: 'integer' } // sgp challenges
    ]
  },
  {
    group: 'teamfight',
    items: [
      { key: 'flawlessAces', render: 'integer' }, // sgp challenges
      { key: 'doubleAces', render: 'integer' }, // sgp challenges
      { key: 'acesBefore15Minutes', render: 'integer' }, // sgp challenges
      { key: 'fullTeamTakedown', render: 'integer' }, // sgp challenges
      { key: 'shortestTimeToAceFromFirstTakedown', render: 'integer' }, // sgp challenges
      { key: '12AssistStreakCount', render: 'integer' }, // sgp challenges
      { key: 'teleportTakedowns', render: 'integer' } // sgp challenges
    ]
  },
  {
    group: 'game-state',
    items: [
      { key: 'gameEndedInEarlySurrender', render: 'boolean' },
      { key: 'gameEndedInSurrender', render: 'boolean' },
      { key: 'causedEarlySurrender', render: 'boolean', hide: true }, // 疑似已经弃用
      { key: 'earlySurrenderAccomplice', render: 'boolean', hide: true }, // 疑似已经弃用
      { key: 'teamEarlySurrendered', render: 'boolean' }
    ]
  },
  {
    group: 'misc',
    items: [
      { key: 'champLevel', render: 'integer' }, // lcu + sgp
      { key: 'champExperience', render: 'compat' }, // sgp only
      { key: 'timePlayed', render: 'integer' }, // sgp only
      { key: 'totalTimeSpentDead', render: 'integer' }, // sgp only
      { key: 'firstBloodKill', render: 'boolean' }, // lcu + sgp
      { key: 'firstBloodAssist', render: 'boolean' }, // lcu + sgp
      { key: 'baronKills', render: 'integer' }, // lcu + sgp
      { key: 'dragonKills', render: 'integer' }, // sgp only
      { key: 'killsNearEnemyTurret', render: 'integer' }, // sgp challenges
      { key: 'killsUnderOwnTurret', render: 'integer' }, // sgp challenges
      { key: 'unseenRecalls', render: 'integer' }, // sgp challenges
      { key: 'effectiveHealAndShielding', render: 'compat' }, // sgp challenges
      { key: 'bountyGold', render: 'integer' }, // sgp challenges
      { key: 'laneMinionsFirst10Minutes', render: 'integer' }, // sgp challenges
      { key: 'twentyMinionsIn3SecondsCount', render: 'integer' }, // sgp challenges
      { key: 'legendaryCount', render: 'integer' }, // sgp challenges
      { key: 'perfectGame', render: 'integer' }, // sgp challenges
      { key: 'maxKillDeficit', render: 'integer' }, // sgp challenges
      { key: 'maxLevelLeadLaneOpponent', render: 'integer' }, // sgp challenges
      { key: 'completeSupportQuestInTime', render: 'integer' }, // sgp challenges
      { key: 'mejaisFullStackInTime', render: 'integer' }, // sgp challenges
      { key: 'HealFromMapSources', render: 'compat' }, // sgp challenges
      { key: 'gameLength', render: 'game-time' }, // sgp challenges
      { key: 'hadAfkTeammate', render: 'boolean' }, // sgp challenges
      { key: 'highestChampionDamage', render: 'boolean' }, // sgp challenges
      { key: 'playedChampSelectPosition', render: 'integer', hide: true } // sgp challenges (metadata)
    ]
  },
  {
    group: 'ignored',
    items: [
      // @ts-ignore
      { key: 'identity', hide: true }, // 虚拟字段，用于分组
      // Metadata / Identifiers
      { key: 'championId', hide: true },
      { key: 'championName', hide: true },
      { key: 'championTransform', hide: true },
      { key: 'participantId', hide: true },
      { key: 'teamId', hide: true },
      { key: 'puuid', hide: true },
      { key: 'summonerId', hide: true },
      { key: 'summonerName', hide: true },
      { key: 'summonerLevel', hide: true },
      { key: 'profileIcon', hide: true },
      { key: 'riotIdGameName', hide: true },
      { key: 'riotIdTagline', hide: true },
      { key: 'lane', hide: true },
      { key: 'role', hide: true },
      { key: 'teamPosition', hide: true },
      { key: 'individualPosition', hide: true },
      { key: 'placement', hide: true },
      { key: 'subteamPlacement', hide: true },
      { key: 'playerSubteamId', hide: true },
      // Items
      { key: 'item0', hide: true },
      { key: 'item1', hide: true },
      { key: 'item2', hide: true },
      { key: 'item3', hide: true },
      { key: 'item4', hide: true },
      { key: 'item5', hide: true },
      { key: 'item6', hide: true },
      // Augments
      { key: 'playerAugment1', hide: true },
      { key: 'playerAugment2', hide: true },
      { key: 'playerAugment3', hide: true },
      { key: 'playerAugment4', hide: true },
      { key: 'playerAugment5', hide: true },
      { key: 'playerAugment6', hide: true },
      // Runes
      { key: 'perks', hide: true }, // sgp only
      { key: 'perk0', hide: true },
      { key: 'perk0Var1', hide: true },
      { key: 'perk0Var2', hide: true },
      { key: 'perk0Var3', hide: true },
      { key: 'perk1', hide: true },
      { key: 'perk1Var1', hide: true },
      { key: 'perk1Var2', hide: true },
      { key: 'perk1Var3', hide: true },
      { key: 'perk2', hide: true },
      { key: 'perk2Var1', hide: true },
      { key: 'perk2Var2', hide: true },
      { key: 'perk2Var3', hide: true },
      { key: 'perk3', hide: true },
      { key: 'perk3Var1', hide: true },
      { key: 'perk3Var2', hide: true },
      { key: 'perk3Var3', hide: true },
      { key: 'perk4', hide: true },
      { key: 'perk4Var1', hide: true },
      { key: 'perk4Var2', hide: true },
      { key: 'perk4Var3', hide: true },
      { key: 'perk5', hide: true },
      { key: 'perk5Var1', hide: true },
      { key: 'perk5Var2', hide: true },
      { key: 'perk5Var3', hide: true },
      { key: 'perkPrimaryStyle', hide: true },
      { key: 'perkSubStyle', hide: true },
      // Score Fields
      { key: 'PlayerScore0', hide: true },
      { key: 'PlayerScore1', hide: true },
      { key: 'PlayerScore2', hide: true },
      { key: 'PlayerScore3', hide: true },
      { key: 'PlayerScore4', hide: true },
      { key: 'PlayerScore5', hide: true },
      { key: 'PlayerScore6', hide: true },
      { key: 'PlayerScore7', hide: true },
      { key: 'PlayerScore8', hide: true },
      { key: 'PlayerScore9', hide: true },
      { key: 'PlayerScore10', hide: true },
      { key: 'PlayerScore11', hide: true },
      { key: 'playerScore0', hide: true },
      { key: 'playerScore1', hide: true },
      { key: 'playerScore2', hide: true },
      { key: 'playerScore3', hide: true },
      { key: 'playerScore4', hide: true },
      { key: 'playerScore5', hide: true },
      { key: 'playerScore6', hide: true },
      { key: 'playerScore7', hide: true },
      { key: 'playerScore8', hide: true },
      { key: 'playerScore9', hide: true },
      { key: 'combatPlayerScore', hide: true },
      { key: 'objectivePlayerScore', hide: true },
      { key: 'totalPlayerScore', hide: true },
      { key: 'totalScoreRank', hide: true },
      // Game State
      { key: 'win', hide: true },
      { key: 'eligibleForProgression', hide: true },
      // Special Game Modes
      { key: 'InfernalScalePickup', hide: true },
      { key: 'SWARM_DefeatAatrox', hide: true },
      { key: 'SWARM_DefeatBriar', hide: true },
      { key: 'SWARM_DefeatMiniBosses', hide: true },
      { key: 'SWARM_EvolveWeapon', hide: true },
      { key: 'SWARM_Have3Passives', hide: true },
      { key: 'SWARM_KillEnemy', hide: true },
      { key: 'SWARM_PickupGold', hide: true },
      { key: 'SWARM_ReachLevel50', hide: true },
      { key: 'SWARM_Survive15Min', hide: true },
      { key: 'SWARM_WinWith5EvolvedWeapons', hide: true },
      { key: 'poroExplosions', hide: true },
      // Summoner Spell IDs
      { key: 'spell1Id', hide: true },
      { key: 'spell2Id', hide: true },
      { key: 'legendaryItemUsed', hide: true } // sgp challenges (array)
    ]
  }
]

export const MAPPED_RENDER_GROUP_OPTIONS = RENDER_GROUPS.reduce(
  (acc, group) => {
    group.items.forEach((item: RenderGroupOptions) => {
      acc[item.key] = {
        key: item.key,
        render: item.render,
        hide: item.hide,
        group: group.group
      }
    })
    return acc
  },
  {} as Record<string, RenderGroupOptions & { group: string }>
)

/**
 * 这个部分需要额外提供原始数据，以便渲染完整版本
 */
export function useRawDetails() {
  const { summary } = useMatchCard()

  return computed(() => {
    const { source, data } = toValue(summary)

    if (source === 'sgp') {
      const isCherryMode = data.json.gameMode === 'CHERRY'

      return data.json.participants
        .toSorted((a, b) => {
          if (isCherryMode) {
            return a.subteamPlacement - b.subteamPlacement
          }

          return a.teamId - b.teamId
        })
        .map((p) => {
          const { challenges, missions, ...rest } = p

          return {
            ...rest,
            ...challenges,
            championId: p.championId,
            identity: {
              puuid: p.puuid,
              gameName: p.riotIdGameName,
              tagLine: p.riotIdTagline,
              teamIdentifier: isCherryMode ? `CHERRY-${p.playerSubteamId}` : `TEAM-${p.teamId}`
            }
          }
        })
    }

    const isCherryMode = data.gameMode === 'CHERRY'

    return data.participants
      .map((p) => {
        const identity = data.participantIdentities.find((i) => i.participantId === p.participantId)
        if (!identity) return null

        return {
          ...p.stats,
          championId: p.championId,
          identity: {
            puuid: identity.player.puuid,
            gameName: identity.player.gameName,
            tagLine: identity.player.tagLine,
            teamIdentifier: isCherryMode ? `CHERRY-${p.teamId}` : `TEAM-${p.teamId}`
          }
        }
      })
      .filter((p) => p !== null)
  })
}

export function useValueRenderer() {
  const { t } = useTranslation()
  const { formatNumber } = useNumberFormatter()

  return {
    float: (value: number) => {
      if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
        return <span class="text-black/50 dark:text-white/50">N/A</span>
      }

      if (value === 0) {
        return <span class="text-black/50 dark:text-white/50">0</span>
      }

      return <span title={value.toFixed(2)}>{value.toFixed(2)}</span>
    },
    integer: (value: number) => {
      if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
        return <span class="text-black/50 dark:text-white/50">N/A</span>
      }

      if (value === 0) {
        return <span class="text-black/50 dark:text-white/50">0</span>
      }

      return <span title={value.toString()}>{Math.floor(value).toLocaleString()}</span>
    },
    text: (value: string | number) => {
      if (value === null || value === undefined || value === '') {
        return <span class="text-black/50 dark:text-white/50">N/A</span>
      }
      return value.toString()
    },
    compat: (value: number) => {
      if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
        return <span class="text-black/50 dark:text-white/50">N/A</span>
      }

      if (value === 0) {
        return <span class="text-black/50 dark:text-white/50">0</span>
      }

      return <span title={value.toString()}>{formatNumber(value)}</span>
    },
    'game-time': (value: number) => {
      if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
        return <span class="text-black/50 dark:text-white/50">N/A</span>
      }

      if (value === 0) {
        return <span class="text-black/50 dark:text-white/50">0</span>
      }

      return <span title={value.toString()}>{formatSeconds(value)}</span>
    },
    boolean: (value: boolean) => {
      if (
        value === null ||
        value === undefined ||
        (typeof value !== 'boolean' && typeof value !== 'number')
      ) {
        return <span class="text-black/50 dark:text-white/50">N/A</span>
      }
      return value ? t('MatchCard.statKeys.true') : t('MatchCard.statKeys.false')
    },
    percentage: (value: number) => {
      if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
        return <span class="text-black/50 dark:text-white/50">N/A</span>
      }
      return <span title={`${value * 100}%`}>{`${(value * 100).toFixed(2)}%`}</span>
    },
    auto: (value: any) => {
      if (value === null || value === undefined || isNaN(value)) {
        return <span class="text-black/50 dark:text-white/50">N/A</span>
      }

      if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          return <span title={value.toString()}>{value}</span>
        } else {
          return <span title={value.toFixed(2)}>{value.toFixed(2)}</span>
        }
      }

      if (typeof value === 'string') {
        return <span title={value}>{value}</span>
      }

      return <span class="text-black/50 dark:text-white/50">N/A?</span>
    }
  }
}
