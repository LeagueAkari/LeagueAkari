import { noZero } from '@shared/data-adapter/utils'
import { VNodeChild, computed } from 'vue'

import { useMatchCard } from '../context'

function times(thing: string, count: number) {
  if (count === 1) {
    return `${thing}`
  }

  return `${thing} × ${count}`
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
}

function computeMultikillTags({ participant }: TagContext): PlayerTag[] {
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
      label: `${times('五杀', streakKills.penta)}`,
      color: theme.bg,
      textColor: theme.text,
      priority: 2000
    })
  }

  if (streakKills.quadra) {
    tags.push({
      label: `${times('四杀', streakKills.quadra)}`,
      color: theme.bg,
      textColor: theme.text,
      priority: 1300
    })
  }

  if (streakKills.triple) {
    tags.push({
      label: `${times('三杀', streakKills.triple)}`,
      color: theme.bg,
      textColor: theme.text,
      priority: 300 + streakKills.triple * 15
    })
  }

  if (streakKills.double) {
    tags.push({
      label: `${times('双杀', streakKills.double)}`,
      color: theme.bg,
      textColor: theme.text,
      priority: 100 + streakKills.double * 10
    })
  }

  return tags
}

function computeDamageTags({ participant, team, teams }: TagContext): PlayerTag[] {
  if (!participant.totalDamageDealtToChampions) return []

  if (participant.totalDamageDealtToChampions === teams.allTeamStats.maxDamageDealtToChampions) {
    return [
      {
        label: '★ 伤害',
        color: 'bg-red-800 dark:bg-red-800',
        textColor: 'text-white',
        content: `全场最高伤害：${participant.totalDamageDealtToChampions.toLocaleString()}，占队伍伤害的 ${((participant.totalDamageDealtToChampions / noZero(team.totalDamageDealtToChampions)) * 100).toFixed(2)}%`,
        priority: 1800
      }
    ]
  } else if (participant.totalDamageDealtToChampions === team.maxDamageDealtToChampions) {
    return [
      {
        label: '伤害',
        color: 'bg-red-700 dark:bg-red-700',
        textColor: 'text-white',
        content: `队伍最高伤害：${participant.totalDamageDealtToChampions.toLocaleString()}，占队伍伤害的 ${((participant.totalDamageDealtToChampions / noZero(team.totalDamageDealtToChampions)) * 100).toFixed(2)}%`,
        priority: 1750
      }
    ]
  }

  return []
}

function computeTakenTags({ participant, team, teams }: TagContext): PlayerTag[] {
  if (!participant.totalDamageTaken) return []

  if (participant.totalDamageTaken === teams.allTeamStats.maxDamageTaken) {
    return [
      {
        label: '★ 承伤',
        color: 'bg-slate-700 dark:bg-slate-700',
        textColor: 'text-white',
        content: `全场最高承伤：${participant.totalDamageTaken.toLocaleString()}，占队伍承伤的 ${((participant.totalDamageTaken / noZero(team.totalDamageTaken)) * 100).toFixed(2)}%`,
        priority: 1400
      }
    ]
  } else if (participant.totalDamageTaken === team.maxDamageTaken) {
    return [
      {
        label: '承伤',
        color: 'bg-slate-600 dark:bg-slate-600',
        textColor: 'text-white',
        content: `队伍最高承伤：${participant.totalDamageTaken.toLocaleString()}，占队伍承伤的 ${((participant.totalDamageTaken / noZero(team.totalDamageTaken)) * 100).toFixed(2)}%`,
        priority: 1350
      }
    ]
  }

  return []
}

function computeHealTags({ participant, team, teams }: TagContext): PlayerTag[] {
  if (!participant.totalHeal) return []

  if (participant.totalHeal === teams.allTeamStats.maxHeal) {
    return [
      {
        label: '★ 治疗',
        color: 'bg-emerald-700 dark:bg-emerald-800',
        textColor: 'text-white',
        content: `全场最高治疗：${participant.totalHeal.toLocaleString()}，占队伍治疗的 ${((participant.totalHeal / noZero(team.totalHeal)) * 100).toFixed(2)}%`,
        priority: 1600
      }
    ]
  } else if (participant.totalHeal === team.maxHeal) {
    return [
      {
        label: '治疗',
        color: 'bg-emerald-600 dark:bg-emerald-700',
        textColor: 'text-white',
        content: `队伍最高治疗：${participant.totalHeal.toLocaleString()}，占队伍治疗的 ${((participant.totalHeal / noZero(team.totalHeal)) * 100).toFixed(2)}%`,
        priority: 1550
      }
    ]
  }
  return []
}

function computeTowerTags({ participant, team, teams }: TagContext): PlayerTag[] {
  if (!participant.totalDamageToTowers) return []

  if (participant.totalDamageToTowers === teams.allTeamStats.maxDamageToTowers) {
    return [
      {
        label: '★ 拆塔',
        color: 'bg-stone-700 dark:bg-stone-600',
        textColor: 'text-white',
        content: `全场最高对塔伤害：${participant.totalDamageToTowers.toLocaleString()}，占队伍对塔伤害的 ${((participant.totalDamageToTowers / noZero(team.totalDamageToTowers)) * 100).toFixed(2)}%`,
        priority: 900
      }
    ]
  } else if (participant.totalDamageToTowers === team.maxDamageToTowers) {
    return [
      {
        label: '拆塔',
        color: 'bg-stone-600 dark:bg-stone-500',
        textColor: 'text-white',
        content: `队伍最高对塔伤害：${participant.totalDamageToTowers.toLocaleString()}，占队伍对塔伤害的 ${((participant.totalDamageToTowers / noZero(team.totalDamageToTowers)) * 100).toFixed(2)}%`,
        priority: 850
      }
    ]
  }
  return []
}

function computeShieldTags({ participant, team, teams }: TagContext): PlayerTag[] {
  if (!participant.totalDamageShieldedOnTeammates) return []

  if (
    participant.totalDamageShieldedOnTeammates === teams.allTeamStats.maxDamageShieldedOnTeammates
  ) {
    return [
      {
        label: '★ 护盾',
        color: 'bg-sky-700 dark:bg-sky-800',
        textColor: 'text-white',
        content: `全场最高护盾：${participant.totalDamageShieldedOnTeammates.toLocaleString()}，占队伍护盾的 ${((participant.totalDamageShieldedOnTeammates / noZero(team.totalDamageShieldedOnTeammates ?? 0)) * 100).toFixed(2)}%`,
        priority: 1500
      }
    ]
  } else if (participant.totalDamageShieldedOnTeammates === team.maxDamageShieldedOnTeammates) {
    return [
      {
        label: '护盾',
        color: 'bg-sky-600 dark:bg-sky-700',
        textColor: 'text-white',
        content: `队伍最高护盾：${participant.totalDamageShieldedOnTeammates.toLocaleString()}，占队伍护盾的 ${((participant.totalDamageShieldedOnTeammates / noZero(team.totalDamageShieldedOnTeammates ?? 0)) * 100).toFixed(2)}%`,
        priority: 1450
      }
    ]
  }
  return []
}

function computeSoloTags({ participant }: TagContext): PlayerTag[] {
  if (participant.soloKills && participant.soloKills >= 2) {
    return [
      {
        label: `${times('单杀', participant.soloKills)}`,
        color: 'bg-indigo-700 dark:bg-indigo-800',
        textColor: 'text-white',
        content: `造成了 ${participant.soloKills.toLocaleString()} 次单杀`,
        priority: 1700
      }
    ]
  }
  return []
}

function computeGoldTags({ participant, team, teams }: TagContext): PlayerTag[] {
  if (!participant.goldEarned) return []

  if (participant.goldEarned === teams.allTeamStats.maxGoldEarned) {
    return [
      {
        label: '★ 金币',
        color: 'bg-amber-700 dark:bg-amber-800',
        textColor: 'text-white',
        content: `全场最高经济：${participant.goldEarned.toLocaleString()}，占队伍经济的 ${((participant.goldEarned / noZero(team.totalGoldEarned)) * 100).toFixed(2)}%`,
        priority: 700
      }
    ]
  } else if (participant.goldEarned === team.maxGoldEarned) {
    return [
      {
        label: '金币',
        color: 'bg-amber-600 dark:bg-amber-700',
        textColor: 'text-white',
        content: `队伍最高经济：${participant.goldEarned.toLocaleString()}，占队伍经济的 ${((participant.goldEarned / noZero(team.totalGoldEarned)) * 100).toFixed(2)}%`,
        priority: 650
      }
    ]
  }
  return []
}

function computeCsTags({ participant, teams }: TagContext): PlayerTag[] {
  if (participant.cs && participant.cs === teams.allTeamStats.maxCs) {
    return [
      {
        label: '★ 补兵',
        color: 'bg-orange-700 dark:bg-orange-800',
        textColor: 'text-white',
        content: `全场最高补兵：${participant.cs.toLocaleString()}`,
        priority: 600
      }
    ]
  }
  return []
}

function computeKillsTags({ participant, team, teams }: TagContext): PlayerTag[] {
  if (!participant.kills) return []

  if (participant.kills === teams.allTeamStats.maxKills) {
    return [
      {
        label: '★ 击杀',
        color: 'bg-violet-700 dark:bg-violet-800',
        textColor: 'text-white',
        content: `全场最多击杀：${participant.kills.toLocaleString()}`,
        priority: 1200
      }
    ]
  } else if (participant.kills === team.maxKills) {
    return [
      {
        label: '击杀',
        color: 'bg-violet-600 dark:bg-violet-700',
        textColor: 'text-white',
        content: `队伍最多击杀：${participant.kills.toLocaleString()}`,
        priority: 1150
      }
    ]
  }
  return []
}

function computeKpTags({ participant, team, teams }: TagContext): PlayerTag[] {
  if (!participant.killParticipation) return []

  if (participant.killParticipation === teams.allTeamStats.maxKillParticipation) {
    return [
      {
        label: '★ 参团',
        color: 'bg-cyan-700 dark:bg-cyan-800',
        textColor: 'text-white',
        content: `全场最高参团率：${(participant.killParticipation * 100).toFixed(2)}%`,
        priority: 1100
      }
    ]
  } else if (participant.killParticipation === team.maxKillParticipation) {
    return [
      {
        label: '参团',
        color: 'bg-cyan-600 dark:bg-cyan-700',
        textColor: 'text-white',
        content: `队伍最高参团率：${(participant.killParticipation * 100).toFixed(2)}%`,
        priority: 1050
      }
    ]
  }
  return []
}

export function usePlayerTags() {
  const { participant, teams, team } = useMatchCard()

  return computed(() => {
    if (!participant.value || !team.value) return []

    const context: TagContext = {
      participant: participant.value,
      team: team.value,
      teams: teams.value
    }

    const tags: PlayerTag[] = [
      ...computeMultikillTags(context),
      ...computeDamageTags(context),
      ...computeTakenTags(context),
      ...computeHealTags(context),
      ...computeTowerTags(context),
      ...computeShieldTags(context),
      ...computeSoloTags(context),
      ...computeGoldTags(context),
      ...computeCsTags(context),
      ...computeKillsTags(context),
      ...computeKpTags(context)
    ]

    return tags.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  })
}
