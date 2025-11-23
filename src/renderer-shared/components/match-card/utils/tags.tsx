import { computed } from 'vue'

import { useMatchCard } from '../context'

export function usePlayerTags() {
  const { puuid, participants, teams } = useMatchCard()

  const stats = computed(() => {
    return participants.value.find((s) => s.puuid === puuid.value)
  })

  const team = computed(() => {
    if (!stats.value) return null
    return teams.value.teamStatMap[stats.value.teamIdentifier]
  })

  return computed(() => {
    if (!stats.value || !team.value) return []

    const tags: { label: string; color: string; textColor: string }[] = []

    if (
      stats.value.totalDamageDealtToChampions === teams.value.allTeamStats.maxDamageDealtToChampions
    ) {
      tags.push({ label: '伤害最高', color: 'bg-cyan-900', textColor: 'text-white' })
    } else if (stats.value.totalDamageDealtToChampions === team.value.maxDamageDealtToChampions) {
      tags.push({ label: '队伤最高', color: 'bg-orange-800', textColor: 'text-white' })
    }

    if (stats.value.totalDamageTaken === teams.value.allTeamStats.maxDamageTaken) {
      tags.push({ label: '全场坦克', color: 'bg-pink-900', textColor: 'text-white' })
    } else if (stats.value.totalDamageTaken === team.value.maxDamageTaken) {
      tags.push({ label: '队伍坦克', color: 'bg-orange-800', textColor: 'text-white' })
    }

    // test
    if (true) {
      tags.push({ label: '一板一眼', color: 'bg-yellow-500', textColor: 'text-black' })
    }

    return tags
  })
}
