import type { Qq101ChampionDataOverview } from '@renderer-shared/shards/champion-data/qq101/types'
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { computed, ref } from 'vue'

import Rankings from './Rankings.vue'

const heroes = [103, 121, 86, 136, 222, 412, 64, 22, 1, 81, 67, 157]
const base = heroes.map((championId, index) => ({
  championId,
  rank: index + 1,
  rankChange: index % 3 === 0 ? 2 : -1,
  winRate: 0.56 - index * 0.007,
  pickRate: 0.12 - index * 0.004,
  bestPartners: [],
  averageDeathTimeSeconds: null,
  killParticipationRate: null,
  damageShare: null,
  damageTakenShare: null
}))
const overviews: Record<Qq101ChampionDataPreferences['mode'], Qq101ChampionDataOverview> = {
  ranked: {
    mode: 'ranked',
    data: {
      date: '20260926',
      patch: '16.19',
      champions: base.map((row, index) => ({
        ...row,
        rowKey: `${row.championId}:MIDDLE`,
        position: 'MIDDLE',
        strengthTier: `T${index % 5}`,
        banRate: 0.02,
        counterChampionIds: [],
        dailyAverageSurge: null,
        isHot: false
      }))
    }
  },
  classic: {
    mode: 'classic',
    data: {
      date: '20260926',
      champions: base.map((row, index) => ({
        ...row,
        classicChampionId: row.championId + 60000,
        position: 'ALL',
        strengthTier: `T${index % 5}`,
        banRate: 0.02,
        counterChampionIds: []
      }))
    }
  },
  aram: { mode: 'aram', data: { date: '20260926', champions: base } },
  aram_mayhem: {
    mode: 'aram_mayhem',
    data: {
      date: '20260926',
      augmentDate: '20260926',
      synergyDate: '20260925',
      errors: {},
      champions: base.map((row) => ({ ...row, lowestRankAugmentIds: [] })),
      augments: [2132, 1068, 1030, 1379].map((augmentId, index) => ({
        augmentId,
        augmentTier: null,
        pickRate: 0.15 - index * 0.02,
        pickRank: index + 1,
        pickRankChange: -1,
        pickRankImprovement: 1,
        winRate: 0.54 - index * 0.01,
        winRank: 4 - index,
        winRankChange: 2,
        winRankImprovement: -2,
        bestChampions: []
      })),
      synergies: heroes
        .flatMap((championId, index) =>
          heroes.slice(index + 1).map((partner) => ({
            champions: [{ championId }, { championId: partner }],
            winRate: 0.55,
            pickRate: 0.002
          }))
        )
        .map((pair, index) => ({ ...pair, rank: index + 1 }))
    }
  }
}
const meta = {
  title: 'Champion Data/QQ101 Rankings',
  component: Rankings,
  args: {
    loadedPreferences: null,
    overview: null,
    patches: [],
    loading: false,
    error: null,
    preferences: { mode: 'ranked', tier: 26, position: 'all', patch: '16.19' }
  },
  render: (args, context) => ({
    components: { Rankings },
    setup() {
      const preferences = ref({ ...args.preferences })
      const overview = computed(() => overviews[preferences.value.mode])
      const change = (update: Partial<Qq101ChampionDataPreferences>) => {
        preferences.value = { ...preferences.value, ...update }
      }
      return { args, preferences, overview, change, width: context.parameters.previewWidth ?? 530 }
    },
    template:
      '<div :style="{ height: \'620px\', width: width + \'px\', maxWidth: \'100%\', display: \'flex\' }"><Rankings v-bind="args" :preferences="preferences" :loaded-preferences="preferences" :overview="overview" :patches="[\'16.19\', \'16.18\']" @change="change" /></div>'
  })
} satisfies Meta<typeof Rankings>
export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const Wide: Story = { parameters: { previewWidth: 960 } }
export const InitialLoading: Story = {
  args: { loading: true },
  render: (args) => ({
    components: { Rankings },
    setup: () => ({ args }),
    template:
      '<div style="height: 620px; width: 530px; max-width: 100%; display: flex"><Rankings v-bind="args" /></div>'
  })
}
export const Mayhem: Story = {
  args: { preferences: { mode: 'aram_mayhem', tier: 255, position: 'all', patch: null } }
}
export const Aram: Story = {
  args: { preferences: { mode: 'aram', tier: 255, position: 'all', patch: null } }
}
export const Classic: Story = {
  args: { preferences: { mode: 'classic', tier: 255, position: 'all', patch: null } }
}
export const Updating: Story = { args: { loading: true } }
export const Failed: Story = { args: { error: 'Network unavailable' } }
