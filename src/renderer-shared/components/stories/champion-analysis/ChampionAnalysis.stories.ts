import { ChampionAnalysisContent } from '@renderer-shared/components/champion-analysis'
import type { AggregatedChampionAnalysis } from '@shared/data-adapter/analysis/player'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

const analysis: AggregatedChampionAnalysis = {
  championId: 77,
  summary: {
    avgChampionDamageRatioToTeamMax: 0.78,
    avgChampionDamageRatioToMax: 0.73,
    avgChampionDamagePercentageOfTeam: 0.26,
    avgChampionDamagePerMinute: 3393,
    avgDamageTakenRatioToTeamMax: 0.5,
    avgDamageTakenRatioToMax: 0.36,
    avgDamageTakenPercentageOfTeam: 0.15,
    avgGoldRatioToTeamMax: 0.76,
    avgGoldRatioToMax: 0.71,
    avgGoldPercentageOfTeam: 0.19,
    avgCsRatioToTeamMax: 0.52,
    avgCsRatioToMax: 0.45,
    avgCsPercentageOfTeam: 0.17,
    avgCsPerMinute: 2,
    avgTowerDamageRatioToTeamMax: 1,
    avgTowerDamageRatioToMax: 0.84,
    avgTowerDamagePercentageOfTeam: 0.39,
    avgVisionScore: 0,
    avgVisionScorePercentageOfTeam: 0,
    avgDamageGoldEfficiency: 3.7,
    avgKillParticipation: 0.66,
    avgKillDamageEfficiency: 0.63,
    kills: 18,
    deaths: 31,
    assists: 55,
    avgKda: 2.35,
    kdaCv: 0.28,
    winRate: 0.5,
    avgSoloKills: 0,
    avgEnemyMissingPings: 0.5,
    avgPings: 2.5
  },
  winLoss: {
    all: {
      count: 2,
      activeSessionWins: 0,
      activeSessionLosses: 0,
      wins: 1,
      losses: 1,
      winRate: 0.5,
      winningStreak: 0,
      losingStreak: 0
    },
    normal: {
      count: 2,
      activeSessionWins: 0,
      activeSessionLosses: 0,
      wins: 1,
      losses: 1,
      winRate: 0.5,
      winningStreak: 0,
      losingStreak: 0
    },
    cherry: {
      count: 0,
      activeSessionWins: 0,
      activeSessionLosses: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      winningStreak: 0,
      losingStreak: 0,
      top1s: 0,
      topHalfFinishes: 0,
      top1Rate: 0,
      topHalfRate: 0,
      avgSubteamPlacement: 0
    }
  },
  akariScore: {
    kdaScore: 0.3,
    winRateScore: 0.1,
    dmgScore: 0.45,
    dmgTakenScore: 0.2,
    healingScore: 0.05,
    csScore: 0.1,
    goldScore: 0.3,
    participationScore: 0.58,
    visionScore: 0.15,
    total: 2.23,
    maxScore: 17,
    outstanding: false,
    extraordinary: false
  },
  positions: null,
  jungle: null
}

const meta = {
  title: 'Renderer Shared/Player Data/Champion Analysis',
  component: ChampionAnalysisContent,
  args: {
    analysis,
    collecting: false,
    onCollectMatches: () => undefined
  },
  argTypes: {
    analysis: { control: false },
    mastery: { control: false },
    onCollectMatches: { control: false }
  },
  render: (args) => ({
    components: { ChampionAnalysisContent },
    setup() {
      return { args }
    },
    template: `
      <div class="flex min-h-96 w-full items-start justify-center pt-4">
        <ChampionAnalysisContent v-bind="args" />
      </div>
    `
  }),
  parameters: {
    akariStoryPanelMaxWidth: 720
  }
} satisfies Meta<typeof ChampionAnalysisContent>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}
