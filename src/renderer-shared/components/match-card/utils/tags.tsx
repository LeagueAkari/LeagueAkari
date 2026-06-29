import { noZero } from '@shared/data-adapter/utils'
import type { TFunction } from 'i18next'
import { useTranslation } from 'i18next-vue'
import { VNodeChild, computed } from 'vue'

import { useMatchCard } from '../context'

function times(label: string, count: number, t: TFunction) {
  if (count === 1) {
    return `${label}`
  }

  return t('matchCard.tags.times', { label, count: Math.round(count) })
}

export interface PlayerTag {
  label: string
  color: string
  textColor: string
  content?: string | (() => VNodeChild)
  priority?: number
}

interface TagContext {
  participant: NonNullable<ReturnType<typeof useMatchCard>['participant']['value']>
  team: NonNullable<ReturnType<typeof useMatchCard>['team']['value']>
  teams: ReturnType<typeof useMatchCard>['teams']['value']
  basicInfo: ReturnType<typeof useMatchCard>['basicInfo']['value']
}

function computeMultikillTags({ participant }: TagContext, t: TFunction): PlayerTag[] {
  const tags: PlayerTag[] = []
  const streakKills = {
    double: participant.doubleKills,
    triple: participant.tripleKills,
    quadra: participant.quadraKills,
    penta: participant.pentaKills
  }

  // 计算完整且完善的击杀连杀
  streakKills.quadra -= streakKills.penta
  streakKills.triple -= streakKills.quadra + streakKills.penta
  streakKills.double -= streakKills.triple + streakKills.quadra + streakKills.penta

  const theme = {
    bg: 'bg-rose-700 dark:bg-rose-800',
    text: 'text-white'
  }

  if (streakKills.penta) {
    tags.push({
      label: `${times(t('matchCard.tags.multiKill.penta'), streakKills.penta, t)}`,
      color: theme.bg,
      textColor: theme.text,
      priority: 20000
    })
  }

  if (streakKills.quadra) {
    tags.push({
      label: `${times(t('matchCard.tags.multiKill.quadra'), streakKills.quadra, t)}`,
      color: theme.bg,
      textColor: theme.text,
      priority: 1300
    })
  }

  if (streakKills.triple) {
    tags.push({
      label: `${times(t('matchCard.tags.multiKill.triple'), streakKills.triple, t)}`,
      color: theme.bg,
      textColor: theme.text,
      priority: 300 + streakKills.triple * 15
    })
  }

  if (streakKills.double) {
    tags.push({
      label: `${times(t('matchCard.tags.multiKill.double'), streakKills.double, t)}`,
      color: theme.bg,
      textColor: theme.text,
      priority: 100 + streakKills.double * 10
    })
  }

  return tags
}

function computeDamageTags({ participant, team, teams }: TagContext, t: TFunction): PlayerTag[] {
  if (!participant.totalDamageDealtToChampions) return []

  if (participant.totalDamageDealtToChampions === teams.allTeamStats.maxDamageDealtToChampions) {
    return [
      {
        label: t('matchCard.tags.damage.bestLabel'),
        color: 'bg-red-800 dark:bg-red-800',
        textColor: 'text-white',
        content: t('matchCard.tags.damage.bestContent', {
          value: participant.totalDamageDealtToChampions.toLocaleString(),
          rate: (
            (participant.totalDamageDealtToChampions / noZero(team.totalDamageDealtToChampions)) *
            100
          ).toFixed(2)
        }),
        priority: 1800
      }
    ]
  } else if (participant.totalDamageDealtToChampions === team.maxDamageDealtToChampions) {
    return [
      {
        label: t('matchCard.tags.damage.teamLabel'),
        color: 'bg-red-700 dark:bg-red-700',
        textColor: 'text-white',
        content: t('matchCard.tags.damage.teamContent', {
          value: participant.totalDamageDealtToChampions.toLocaleString(),
          rate: (
            (participant.totalDamageDealtToChampions / noZero(team.totalDamageDealtToChampions)) *
            100
          ).toFixed(2)
        }),
        priority: 1750
      }
    ]
  }

  return []
}

function computeTakenTags({ participant, team, teams }: TagContext, t: TFunction): PlayerTag[] {
  if (!participant.totalDamageTaken) return []

  if (participant.totalDamageTaken === teams.allTeamStats.maxDamageTaken) {
    return [
      {
        label: t('matchCard.tags.taken.bestLabel'),
        color: 'bg-slate-700 dark:bg-slate-700',
        textColor: 'text-white',
        content: t('matchCard.tags.taken.bestContent', {
          value: participant.totalDamageTaken.toLocaleString(),
          rate: ((participant.totalDamageTaken / noZero(team.totalDamageTaken)) * 100).toFixed(2)
        }),
        priority: 1400
      }
    ]
  } else if (participant.totalDamageTaken === team.maxDamageTaken) {
    return [
      {
        label: t('matchCard.tags.taken.teamLabel'),
        color: 'bg-slate-600 dark:bg-slate-600',
        textColor: 'text-white',
        content: t('matchCard.tags.taken.teamContent', {
          value: participant.totalDamageTaken.toLocaleString(),
          rate: ((participant.totalDamageTaken / noZero(team.totalDamageTaken)) * 100).toFixed(2)
        }),
        priority: 1350
      }
    ]
  }

  return []
}

function computeHealTags({ participant, team, teams }: TagContext, t: TFunction): PlayerTag[] {
  if (!participant.totalHeal) return []

  if (participant.totalHeal === teams.allTeamStats.maxHeal) {
    return [
      {
        label: t('matchCard.tags.heal.bestLabel'),
        color: 'bg-emerald-700 dark:bg-emerald-800',
        textColor: 'text-white',
        content: t('matchCard.tags.heal.bestContent', {
          value: participant.totalHeal.toLocaleString(),
          rate: ((participant.totalHeal / noZero(team.totalHeal)) * 100).toFixed(2)
        }),
        priority: 1600
      }
    ]
  } else if (participant.totalHeal === team.maxHeal) {
    return [
      {
        label: t('matchCard.tags.heal.teamLabel'),
        color: 'bg-emerald-600 dark:bg-emerald-700',
        textColor: 'text-white',
        content: t('matchCard.tags.heal.teamContent', {
          value: participant.totalHeal.toLocaleString(),
          rate: ((participant.totalHeal / noZero(team.totalHeal)) * 100).toFixed(2)
        }),
        priority: 1550
      }
    ]
  }
  return []
}

function computeTowerTags({ participant, team, teams }: TagContext, t: TFunction): PlayerTag[] {
  if (!participant.totalDamageToTowers) return []

  if (participant.totalDamageToTowers === teams.allTeamStats.maxDamageToTowers) {
    return [
      {
        label: t('matchCard.tags.tower.bestLabel'),
        color: 'bg-stone-700 dark:bg-stone-600',
        textColor: 'text-white',
        content: t('matchCard.tags.tower.bestContent', {
          value: participant.totalDamageToTowers.toLocaleString(),
          rate: (
            (participant.totalDamageToTowers / noZero(team.totalDamageToTowers)) *
            100
          ).toFixed(2)
        }),
        priority: 900
      }
    ]
  } else if (participant.totalDamageToTowers === team.maxDamageToTowers) {
    return [
      {
        label: t('matchCard.tags.tower.teamLabel'),
        color: 'bg-stone-600 dark:bg-stone-500',
        textColor: 'text-white',
        content: t('matchCard.tags.tower.teamContent', {
          value: participant.totalDamageToTowers.toLocaleString(),
          rate: (
            (participant.totalDamageToTowers / noZero(team.totalDamageToTowers)) *
            100
          ).toFixed(2)
        }),
        priority: 850
      }
    ]
  }
  return []
}

function computeShieldTags({ participant, team, teams }: TagContext, t: TFunction): PlayerTag[] {
  if (!participant.totalDamageShieldedOnTeammates) return []

  if (
    participant.totalDamageShieldedOnTeammates === teams.allTeamStats.maxDamageShieldedOnTeammates
  ) {
    return [
      {
        label: t('matchCard.tags.shield.bestLabel'),
        color: 'bg-sky-700 dark:bg-sky-800',
        textColor: 'text-white',
        content: t('matchCard.tags.shield.bestContent', {
          value: participant.totalDamageShieldedOnTeammates.toLocaleString(),
          rate: (
            (participant.totalDamageShieldedOnTeammates /
              noZero(team.totalDamageShieldedOnTeammates ?? 0)) *
            100
          ).toFixed(2)
        }),
        priority: 1500
      }
    ]
  } else if (participant.totalDamageShieldedOnTeammates === team.maxDamageShieldedOnTeammates) {
    return [
      {
        label: t('matchCard.tags.shield.teamLabel'),
        color: 'bg-sky-600 dark:bg-sky-700',
        textColor: 'text-white',
        content: t('matchCard.tags.shield.teamContent', {
          value: participant.totalDamageShieldedOnTeammates.toLocaleString(),
          rate: (
            (participant.totalDamageShieldedOnTeammates /
              noZero(team.totalDamageShieldedOnTeammates ?? 0)) *
            100
          ).toFixed(2)
        }),
        priority: 1450
      }
    ]
  }
  return []
}

function computeSoloTags({ participant }: TagContext, t: TFunction): PlayerTag[] {
  if (participant.soloKills && participant.soloKills >= 2) {
    return [
      {
        label: `${times(t('matchCard.tags.solo.label'), participant.soloKills, t)}`,
        color: 'bg-indigo-700 dark:bg-indigo-800',
        textColor: 'text-white',
        content: t('matchCard.tags.solo.content', {
          value: participant.soloKills.toLocaleString()
        }),
        priority: 1700
      }
    ]
  }
  return []
}

function computeGoldTags({ participant, team, teams }: TagContext, t: TFunction): PlayerTag[] {
  if (!participant.goldEarned) return []

  if (participant.goldEarned === teams.allTeamStats.maxGoldEarned) {
    return [
      {
        label: t('matchCard.tags.gold.bestLabel'),
        color: 'bg-amber-700 dark:bg-amber-800',
        textColor: 'text-white',
        content: t('matchCard.tags.gold.bestContent', {
          value: participant.goldEarned.toLocaleString(),
          rate: ((participant.goldEarned / noZero(team.totalGoldEarned)) * 100).toFixed(2)
        }),
        priority: 700
      }
    ]
  } else if (participant.goldEarned === team.maxGoldEarned) {
    return [
      {
        label: t('matchCard.tags.gold.teamLabel'),
        color: 'bg-amber-600 dark:bg-amber-700',
        textColor: 'text-white',
        content: t('matchCard.tags.gold.teamContent', {
          value: participant.goldEarned.toLocaleString(),
          rate: ((participant.goldEarned / noZero(team.totalGoldEarned)) * 100).toFixed(2)
        }),
        priority: 650
      }
    ]
  }
  return []
}

function computeCsTags({ participant, teams }: TagContext, t: TFunction): PlayerTag[] {
  if (participant.cs && participant.cs === teams.allTeamStats.maxCs) {
    return [
      {
        label: t('matchCard.tags.cs.bestLabel'),
        color: 'bg-orange-700 dark:bg-orange-800',
        textColor: 'text-white',
        content: t('matchCard.tags.cs.bestContent', {
          value: participant.cs.toLocaleString()
        }),
        priority: 600
      }
    ]
  }
  return []
}

function computeCsAdvantageTags({ participant }: TagContext, t: TFunction): PlayerTag[] {
  if (participant.maxCsAdvantageOnLaneOpponent && participant.maxCsAdvantageOnLaneOpponent >= 40) {
    return [
      {
        label: times(
          t('matchCard.tags.csAdvantage.label'),
          participant.maxCsAdvantageOnLaneOpponent,
          t
        ),
        color: 'bg-amber-600 dark:bg-amber-700',
        textColor: 'text-white',
        content: t('matchCard.tags.csAdvantage.content', {
          value: Math.round(participant.maxCsAdvantageOnLaneOpponent).toLocaleString()
        }),
        priority: 750 + participant.maxCsAdvantageOnLaneOpponent * 10
      }
    ]
  }
  return []
}

function computeKillsTags({ participant, team, teams }: TagContext, t: TFunction): PlayerTag[] {
  if (!participant.kills) return []

  if (participant.kills === teams.allTeamStats.maxKills) {
    return [
      {
        label: t('matchCard.tags.kills.bestLabel'),
        color: 'bg-violet-700 dark:bg-violet-800',
        textColor: 'text-white',
        content: t('matchCard.tags.kills.bestContent', {
          value: participant.kills.toLocaleString()
        }),
        priority: 1200
      }
    ]
  } else if (participant.kills === team.maxKills) {
    return [
      {
        label: t('matchCard.tags.kills.teamLabel'),
        color: 'bg-violet-600 dark:bg-violet-700',
        textColor: 'text-white',
        content: t('matchCard.tags.kills.teamContent', {
          value: participant.kills.toLocaleString()
        }),
        priority: 1150
      }
    ]
  }
  return []
}

function computeKpTags({ participant, team, teams }: TagContext, t: TFunction): PlayerTag[] {
  if (!participant.killParticipation) return []

  if (participant.killParticipation === teams.allTeamStats.maxKillParticipation) {
    return [
      {
        label: t('matchCard.tags.kp.bestLabel'),
        color: 'bg-cyan-700 dark:bg-cyan-800',
        textColor: 'text-white',
        content: t('matchCard.tags.kp.bestContent', {
          value: (participant.killParticipation * 100).toFixed(2)
        }),
        priority: 1100
      }
    ]
  } else if (participant.killParticipation === team.maxKillParticipation) {
    return [
      {
        label: t('matchCard.tags.kp.teamLabel'),
        color: 'bg-cyan-600 dark:bg-cyan-700',
        textColor: 'text-white',
        content: t('matchCard.tags.kp.teamContent', {
          value: (participant.killParticipation * 100).toFixed(2)
        }),
        priority: 1050
      }
    ]
  }
  return []
}

function computedKnockUpTags({ participant }: TagContext, t: TFunction): PlayerTag[] {
  if (!participant.knockEnemyIntoTeamAndKill) return []

  if (participant.knockEnemyIntoTeamAndKill >= 6) {
    return [
      {
        label: times(t('matchCard.tags.knockUp.label'), participant.knockEnemyIntoTeamAndKill, t),
        color: 'bg-purple-700 dark:bg-purple-800',
        textColor: 'text-white',
        content: t('matchCard.tags.knockUp.content', {
          value: participant.knockEnemyIntoTeamAndKill.toLocaleString()
        }),
        priority: 660
      }
    ]
  }
  return []
}

function computeCcTags({ participant, team, teams }: TagContext, t: TFunction): PlayerTag[] {
  if (!participant.timeCCingOthers) return []

  if (participant.timeCCingOthers === teams.allTeamStats.maxTimeCCingOthers) {
    return [
      {
        label: t('matchCard.tags.cc.bestLabel'),
        color: 'bg-fuchsia-700 dark:bg-fuchsia-800',
        textColor: 'text-white',
        content: t('matchCard.tags.cc.bestContent', {
          value: participant.timeCCingOthers.toLocaleString()
        }),
        priority: 1750
      }
    ]
  } else if (participant.timeCCingOthers === team.maxTimeCCingOthers) {
    return [
      {
        label: t('matchCard.tags.cc.teamLabel'),
        color: 'bg-fuchsia-600 dark:bg-fuchsia-700',
        textColor: 'text-white',
        content: t('matchCard.tags.cc.teamContent', {
          value: participant.timeCCingOthers.toLocaleString()
        }),
        priority: 1700
      }
    ]
  }

  return []
}

function computeDamageGoldEfficiencyTags(
  { participant, team, teams }: TagContext,
  t: TFunction
): PlayerTag[] {
  if (!participant.damageGoldEfficiency) return []

  const rate = (participant.damageGoldEfficiency * 100).toFixed(2)

  if (participant.damageGoldEfficiency === teams.allTeamStats.maxDamageGoldEfficiency) {
    return [
      {
        label: t('matchCard.tags.damageGoldEfficiency.bestLabel'),
        color: 'bg-lime-700 dark:bg-lime-800',
        textColor: 'text-white',
        content: t('matchCard.tags.damageGoldEfficiency.bestContent', { rate }),
        priority: 1800
      }
    ]
  }

  if (participant.damageGoldEfficiency === team.maxDamageGoldEfficiency) {
    return [
      {
        label: t('matchCard.tags.damageGoldEfficiency.teamLabel'),
        color: 'bg-lime-600 dark:bg-lime-700',
        textColor: 'text-white',
        content: t('matchCard.tags.damageGoldEfficiency.teamContent', { rate }),
        priority: 930
      }
    ]
  }

  return []
}

function computeTowerKillTags({ participant, basicInfo }: TagContext, t: TFunction): PlayerTag[] {
  const tags: PlayerTag[] = []
  const durationMinutes = basicInfo.gameDuration / 60

  if (basicInfo.mapId !== 11 && basicInfo.mapId !== 12) return []

  // 11 召唤师峡谷，12 嚎哭深渊
  const nearEnemyTurretThreshold = basicInfo.mapId === 11 ? 5 : 1.5
  const underOwnTurretThreshold = basicInfo.mapId === 11 ? 6 : 1.5

  if (
    participant.killsNearEnemyTurret &&
    participant.killsNearEnemyTurret >= durationMinutes / nearEnemyTurretThreshold
  ) {
    tags.push({
      label: times(t('matchCard.tags.towerKill.diveLabel'), participant.killsNearEnemyTurret, t),
      color: 'bg-rose-600 dark:bg-rose-700',
      textColor: 'text-white',
      content: t('matchCard.tags.towerKill.diveContent', {
        value: participant.killsNearEnemyTurret.toLocaleString()
      }),
      priority: 1660
    })
  }

  if (
    participant.killsUnderOwnTurret &&
    participant.killsUnderOwnTurret >= durationMinutes / underOwnTurretThreshold
  ) {
    tags.push({
      label: times(t('matchCard.tags.towerKill.underLabel'), participant.killsUnderOwnTurret, t),
      color: 'bg-stone-500 dark:bg-stone-600',
      textColor: 'text-white',
      content: t('matchCard.tags.towerKill.underContent', {
        value: participant.killsUnderOwnTurret.toLocaleString()
      }),
      priority: 1640
    })
  }

  return tags
}

export function usePlayerTags() {
  const { participant, teams, team, basicInfo } = useMatchCard()
  const { t } = useTranslation()

  return computed(() => {
    if (!participant.value || !team.value) return []

    const context: TagContext = {
      participant: participant.value,
      team: team.value,
      teams: teams.value,
      basicInfo: basicInfo.value
    }

    const tags: PlayerTag[] = [
      ...computeMultikillTags(context, t),
      ...computeTowerKillTags(context, t),
      ...computeDamageTags(context, t),
      ...computeTakenTags(context, t),
      ...computeHealTags(context, t),
      ...computeTowerTags(context, t),
      ...computeShieldTags(context, t),
      ...computeSoloTags(context, t),
      ...computeGoldTags(context, t),
      ...computeDamageGoldEfficiencyTags(context, t),
      ...computeCsTags(context, t),
      ...computeCsAdvantageTags(context, t),
      ...computeKillsTags(context, t),
      ...computeKpTags(context, t),
      ...computedKnockUpTags(context, t),
      ...computeCcTags(context, t)
    ]

    return tags.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  })
}
