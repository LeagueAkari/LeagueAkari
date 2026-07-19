import { SUMMONER_SPELL_SMITE_ID } from '@shared/constants/summoner-spells'
import type { AggregatedAnalysis } from '@shared/data-adapter/analysis/player'
import type { VNode } from 'vue'

import type { PlayerCardTagContext, PlayerCardTagDefinition, PlayerCardTagPopover } from '../types'

export type EasyGankTag = {
  kind: 'hard-gank' | 'easy-gank' | 'very-easy-gank'
  labelKey:
    | 'ongoingGame.playerCard.hardGank'
    | 'ongoingGame.playerCard.easyGank'
    | 'ongoingGame.playerCard.veryEasyGank'
  times: number
  count: number
}

export type KillDamageEfficiencyTag = {
  kind: 'high' | 'low' | 'normal'
  value: number
}

const TAG_CLASS = 'rounded-xs px-1 py-0.5 text-[11px] leading-[11px]'

const tagClass = (...classes: string[]) => [TAG_CLASS, ...classes]

const textPopover = (content: VNode | string | number): PlayerCardTagPopover => ({
  content: <div class="max-w-60 text-xs">{content}</div>
})

const truncateTailingZeros = (num: number, precision = 1) => {
  const str = num.toFixed(precision)
  return str.replace(/\.?0+$/, '')
}

const PREMADE_TEAM_TAG_CLASSES: Record<string, string> = {
  A: 'bg-[#0f6f68] text-white dark:bg-[#48e5db] dark:text-black',
  B: 'bg-[#1f3fa6] text-white dark:bg-[#628aff] dark:text-black',
  C: 'bg-[#5c6000] text-white dark:bg-[#d4de17] dark:text-black',
  D: 'bg-[#1a7a2a] text-white dark:bg-[#2eda3e] dark:text-black',
  E: 'bg-[#8a4400] text-white dark:bg-[#ff9f1c] dark:text-black',
  F: 'bg-[#8a2a00] text-white dark:bg-[#da4e2e] dark:text-white',
  G: 'bg-[#6a0d6a] text-white dark:bg-[#bc2ebc] dark:text-white',
  H: 'bg-[#a2133f] text-white dark:bg-[#fa4e80] dark:text-black',
  I: 'bg-[#0b3d91] text-white dark:bg-[#0b3d91] dark:text-white',
  J: 'bg-[#7f0000] text-white dark:bg-[#7f0000] dark:text-white',
  K: 'bg-[#5a2a0b] text-white dark:bg-[#8b4513] dark:text-white',
  L: 'bg-[#333333] text-white dark:bg-[#555555] dark:text-white'
}

const EASY_GANK_TAG_CLASSES = {
  'hard-gank': 'bg-[#24606d] text-white',
  'easy-gank': 'bg-[#8f541e] text-white',
  'very-easy-gank': 'bg-[#a81919] text-white'
}

const KILL_DAMAGE_EFFICIENCY_LOW_THRESHOLD = 0.65
const KILL_DAMAGE_EFFICIENCY_HIGH_THRESHOLD = 1.35

export function getIsCurrentJungler(
  assignedPosition: string | undefined,
  spells: { spell1Id: number; spell2Id: number } | undefined
) {
  if (assignedPosition?.toUpperCase() === 'JUNGLE') {
    return true
  }

  return (
    spells?.spell1Id === SUMMONER_SPELL_SMITE_ID || spells?.spell2Id === SUMMONER_SPELL_SMITE_ID
  )
}

export function getEasyGankTag(
  analysis: AggregatedAnalysis,
  isCurrentJungler: boolean
): EasyGankTag | null {
  if (isCurrentJungler || !analysis.details) {
    return null
  }

  const times = analysis.details.avgEarlyDeathsWithEnemyJunglerInvolved

  if (times === null) {
    return null
  }

  if (times > 2) {
    return {
      kind: 'very-easy-gank',
      labelKey: 'ongoingGame.playerCard.veryEasyGank',
      times,
      count: analysis.detailsCount
    }
  }

  if (times >= 1.5) {
    return {
      kind: 'easy-gank',
      labelKey: 'ongoingGame.playerCard.easyGank',
      times,
      count: analysis.detailsCount
    }
  }

  if (times >= 1) {
    return null
  }

  return {
    kind: 'hard-gank',
    labelKey: 'ongoingGame.playerCard.hardGank',
    times,
    count: analysis.detailsCount
  }
}

export function getKillDamageEfficiencyTag(analysis: AggregatedAnalysis): KillDamageEfficiencyTag {
  const kde = analysis.summary.avgKillDamageEfficiency

  if (kde > KILL_DAMAGE_EFFICIENCY_HIGH_THRESHOLD) {
    return {
      kind: 'high',
      value: kde
    }
  }

  if (kde < KILL_DAMAGE_EFFICIENCY_LOW_THRESHOLD) {
    return {
      kind: 'low',
      value: kde
    }
  }

  return {
    kind: 'normal',
    value: kde
  }
}

export const SELF_TAG: PlayerCardTagDefinition = {
  id: 'self',
  render: (ctx) => {
    if (!ctx.settings.showSelfTag || ctx.puuid !== ctx.selfPuuid) {
      return null
    }

    return {
      label: (
        <div class={tagClass('bg-[#37246c] text-white')}>
          {ctx.t('ongoingGame.playerCard.self')}
        </div>
      )
    }
  }
}

export const PREMADE_TEAM_TAG: PlayerCardTagDefinition = {
  id: 'premade-team',
  render: (ctx) => {
    const premadeTeamId = ctx.premadeTeamId

    if (!ctx.settings.showPremadeTeamTag || !premadeTeamId) {
      return null
    }

    return {
      label: (
        <div class={tagClass(PREMADE_TEAM_TAG_CLASSES[premadeTeamId] ?? 'bg-white/25 text-white')}>
          {ctx.t('ongoingGame.playerCard.premade', { team: premadeTeamId })}
        </div>
      ),
      popover: textPopover(ctx.t('ongoingGame.playerCard.premadePopover', { team: premadeTeamId }))
    }
  }
}

export const HIGH_WIN_RATE_TAG: PlayerCardTagDefinition = {
  id: 'high-win-rate',
  render: (ctx) => {
    const analysis = ctx.analysis

    if (
      !ctx.settings.showWinRateTeamTag ||
      !analysis ||
      analysis.winLoss.all.count < 16 ||
      analysis.winLoss.all.winRate < 0.85
    ) {
      return null
    }

    return {
      label: (
        <div class={tagClass('bg-[#7e2c85] text-white')}>
          {ctx.t('ongoingGame.playerCard.highWinRate')}
        </div>
      ),
      popover: textPopover(
        ctx.t('ongoingGame.playerCard.highWinRatePopover', {
          count: analysis.winLoss.all.count,
          winCount: analysis.winLoss.all.wins
        })
      )
    }
  }
}

export const PRIVACY_TAG: PlayerCardTagDefinition = {
  id: 'privacy',
  render: (ctx) => {
    if (!ctx.settings.showPrivacyTag || ctx.summoners[ctx.puuid]?.privacy !== 'PRIVATE') {
      return null
    }

    return {
      label: (
        <div class={tagClass('bg-[#870808] text-white')}>
          {ctx.t('ongoingGame.playerCard.private')}
        </div>
      ),
      popover: textPopover(ctx.t('ongoingGame.playerCard.privatePopover'))
    }
  }
}

export const WINNING_STREAK_TAG: PlayerCardTagDefinition = {
  id: 'winning-streak',
  render: (ctx) => {
    const analysis = ctx.analysis

    if (!ctx.settings.showWinningStreakTag || !analysis || analysis.winLoss.all.winningStreak < 3) {
      return null
    }

    return {
      label: (
        <div class={tagClass('bg-[#18571c] text-white')}>
          {ctx.t('ongoingGame.playerCard.winningStreak', {
            count: analysis.winLoss.all.winningStreak
          })}
        </div>
      ),
      popover: textPopover(
        ctx.t('ongoingGame.playerCard.winningStreakPopover', {
          count: analysis.winLoss.all.winningStreak
        })
      )
    }
  }
}

export const LOSING_STREAK_TAG: PlayerCardTagDefinition = {
  id: 'losing-streak',
  render: (ctx) => {
    const analysis = ctx.analysis

    if (!ctx.settings.showLosingStreakTag || !analysis || analysis.winLoss.all.losingStreak < 3) {
      return null
    }

    return {
      label: (
        <div class={tagClass('bg-[#893b3b] text-white')}>
          {ctx.t('ongoingGame.playerCard.losingStreak', {
            count: analysis.winLoss.all.losingStreak
          })}
        </div>
      ),
      popover: textPopover(
        ctx.t('ongoingGame.playerCard.losingStreakPopover', {
          count: analysis.winLoss.all.losingStreak
        })
      )
    }
  }
}

export const EASY_GANK_TAG: PlayerCardTagDefinition = {
  id: 'easy-gank',
  render: (ctx) => {
    const analysis = ctx.analysis

    if (!ctx.settings.showEasyGankTag || !analysis) {
      return null
    }

    const tag = getEasyGankTag(
      analysis,
      getIsCurrentJungler(ctx.positionAssignment?.position, ctx.spells)
    )

    if (!tag) {
      return null
    }

    return {
      label: <div class={tagClass(EASY_GANK_TAG_CLASSES[tag.kind])}>{ctx.t(tag.labelKey)}</div>,
      popover: textPopover(
        ctx.t('ongoingGame.playerCard.easyGankPopover', {
          times: tag.times.toFixed(2),
          count: tag.count
        })
      )
    }
  }
}

export const SOLO_KILLS_TAG: PlayerCardTagDefinition = {
  id: 'solo-kills',
  render: (ctx) => {
    const analysis = ctx.analysis
    const avgSoloKills = analysis?.summary.avgSoloKills

    if (!ctx.settings.showSoloKillsTag || !analysis || !avgSoloKills) {
      return null
    }

    return {
      label: (
        <div class={tagClass('bg-[#9019a8] text-white')}>
          {ctx.t('ongoingGame.playerCard.soloKills', {
            times: avgSoloKills.toFixed(1)
          })}
        </div>
      ),
      popover: textPopover(
        ctx.t('ongoingGame.playerCard.soloKillsPopover', {
          times: avgSoloKills.toFixed(2),
          count: analysis.count
        })
      )
    }
  }
}

export const AVERAGE_TEAM_DAMAGE_TAG: PlayerCardTagDefinition = {
  id: 'average-team-damage',
  render: (ctx) => {
    const analysis = ctx.analysis

    if (!ctx.settings.showAverageTeamDamageTag || !analysis) {
      return null
    }

    return {
      label: (
        <div class={tagClass('bg-[#692723] text-white')}>
          {ctx.t('ongoingGame.playerCard.teamDamageShare', {
            rate: (analysis.summary.avgChampionDamagePercentageOfTeam * 100).toFixed(0)
          })}
        </div>
      ),
      popover: textPopover(
        ctx.t('ongoingGame.playerCard.teamDamageSharePopover', {
          rate: (analysis.summary.avgChampionDamagePercentageOfTeam * 100).toFixed(2),
          count: analysis.count
        })
      )
    }
  }
}

export const AVERAGE_TEAM_DAMAGE_TAKEN_TAG: PlayerCardTagDefinition = {
  id: 'average-team-damage-taken',
  render: (ctx) => {
    const analysis = ctx.analysis

    if (!ctx.settings.showAverageTeamDamageTakenTag || !analysis) {
      return null
    }

    return {
      label: (
        <div class={tagClass('bg-[#135225] text-white')}>
          {ctx.t('ongoingGame.playerCard.teamDamageTakenShare', {
            rate: (analysis.summary.avgDamageTakenPercentageOfTeam * 100).toFixed(0)
          })}
        </div>
      ),
      popover: textPopover(
        ctx.t('ongoingGame.playerCard.teamDamageTakenSharePopover', {
          rate: (analysis.summary.avgDamageTakenPercentageOfTeam * 100).toFixed(2),
          count: analysis.count
        })
      )
    }
  }
}

export const AVERAGE_TEAM_GOLD_TAG: PlayerCardTagDefinition = {
  id: 'average-team-gold',
  render: (ctx) => {
    const analysis = ctx.analysis

    if (!ctx.settings.showAverageTeamGoldTag || !analysis) {
      return null
    }

    return {
      label: (
        <div class={tagClass('bg-[#a73d2a] text-white')}>
          {ctx.t('ongoingGame.playerCard.teamGoldShare', {
            rate: (analysis.summary.avgGoldPercentageOfTeam * 100).toFixed(0)
          })}
        </div>
      ),
      popover: textPopover(
        ctx.t('ongoingGame.playerCard.teamGoldSharePopover', {
          rate: (analysis.summary.avgGoldPercentageOfTeam * 100).toFixed(2),
          count: analysis.count
        })
      )
    }
  }
}

export const AVERAGE_CS_PER_MINUTE_TAG: PlayerCardTagDefinition = {
  id: 'average-cs-per-minute',
  render: (ctx) => {
    const analysis = ctx.analysis

    if (!ctx.settings.showAverageCsPerMinuteTag || !analysis) {
      return null
    }

    const value = analysis.summary.avgCsPerMinute
    const teamShare = analysis.summary.avgCsPercentageOfTeam

    return {
      label: (
        <div class={tagClass('bg-[#5a4a1f] text-white')}>
          {ctx.t('ongoingGame.playerCard.csPerMinute', {
            value: value.toFixed(1)
          })}
        </div>
      ),
      popover: textPopover(
        <div class="flex flex-col gap-1">
          <div>
            {ctx.t('ongoingGame.playerCard.csPerMinutePopover', {
              value: value.toFixed(2),
              count: analysis.count
            })}
          </div>
          <div>
            {ctx.t('ongoingGame.playerCard.csTeamSharePopover', {
              rate: (teamShare * 100).toFixed(2)
            })}
          </div>
        </div>
      )
    }
  }
}

const renderDamageGoldEfficiencyPopover = (
  ctx: PlayerCardTagContext,
  analysis: AggregatedAnalysis
) => (
  <div class="max-w-72 text-xs leading-5">
    <div class="text-black/75 dark:text-gray-200">
      {ctx.t('ongoingGame.playerCard.damageGoldEfficiencyPopover', {
        rate: (analysis.summary.avgDamageGoldEfficiency * 100).toFixed(2),
        count: analysis.count
      })}
    </div>
    <div class="mt-1 text-black/55 dark:text-white/55">
      {ctx.t('ongoingGame.playerCard.damageGoldEfficiencyPopoverDefinition')}
    </div>
    <div class="mt-1 text-black/55 dark:text-white/55">
      {ctx.t('ongoingGame.playerCard.damageGoldEfficiencyPopoverUsage')}
    </div>
  </div>
)

export const AVERAGE_DAMAGE_GOLD_EFFICIENCY_TAG: PlayerCardTagDefinition = {
  id: 'average-damage-gold-efficiency',
  render: (ctx) => {
    const analysis = ctx.analysis

    if (!ctx.settings.showAverageDamageGoldEfficiencyTag || !analysis) {
      return null
    }

    return {
      label: (
        <div class={tagClass('bg-[#8f411e] text-white')}>
          {ctx.t('ongoingGame.playerCard.damageGoldEfficiency', {
            rate: (analysis.summary.avgDamageGoldEfficiency * 100).toFixed(0)
          })}
        </div>
      ),
      popover: {
        content: renderDamageGoldEfficiencyPopover(ctx, analysis)
      }
    }
  }
}

export const AVERAGE_ENEMY_MISSING_PINGS_TAG: PlayerCardTagDefinition = {
  id: 'average-enemy-missing-pings',
  render: (ctx) => {
    const analysis = ctx.analysis

    if (
      !ctx.settings.showAverageEnemyMissingPingsTag ||
      !analysis ||
      analysis.summary.avgEnemyMissingPings === null
    ) {
      return null
    }

    const avgEnemyMissingPings = analysis.summary.avgEnemyMissingPings

    return {
      label: (
        <div class={tagClass('bg-[#e7da30] text-black')}>
          {ctx.t('ongoingGame.playerCard.enemyMissingPings', {
            count: truncateTailingZeros(avgEnemyMissingPings)
          })}
        </div>
      ),
      popover: textPopover(
        ctx.t('ongoingGame.playerCard.enemyMissingPingsPopover', {
          count: avgEnemyMissingPings.toFixed(3)
        })
      )
    }
  }
}

export const AVERAGE_VISION_SCORE_TAG: PlayerCardTagDefinition = {
  id: 'average-vision-score',
  render: (ctx) => {
    const analysis = ctx.analysis

    if (!ctx.settings.showAverageVisionScoreTag || !analysis) {
      return null
    }

    return {
      label: (
        <div class={tagClass('bg-[#2451a6] text-white')}>
          {ctx.t('ongoingGame.playerCard.visionScore', {
            count: truncateTailingZeros(analysis.summary.avgVisionScore)
          })}
        </div>
      ),
      popover: textPopover(
        ctx.t('ongoingGame.playerCard.visionScorePopover', {
          count: analysis.summary.avgVisionScore.toFixed(3)
        })
      )
    }
  }
}

export const AVERAGE_KILL_DAMAGE_EFFICIENCY_TAG: PlayerCardTagDefinition = {
  id: 'average-kill-damage-efficiency',
  render: (ctx) => {
    const analysis = ctx.analysis

    if (!ctx.settings.showAverageKillDamageEfficiencyTag || !analysis) {
      return null
    }

    const tag = getKillDamageEfficiencyTag(analysis)

    if (tag.kind === 'normal') {
      return null
    }

    return {
      label: (
        <div class={tagClass('bg-[#04614b] text-white')}>
          {tag.kind === 'high'
            ? ctx.t('ongoingGame.playerCard.killDamageEfficiencyHigh')
            : ctx.t('ongoingGame.playerCard.killDamageEfficiencyLow')}
        </div>
      ),
      popover: textPopover(
        tag.kind === 'high'
          ? ctx.t('ongoingGame.playerCard.killDamageEfficiencyHighPopover', {
              rate: (tag.value * 100).toFixed(2),
              count: analysis.count
            })
          : ctx.t('ongoingGame.playerCard.killDamageEfficiencyLowPopover', {
              rate: (tag.value * 100).toFixed(2),
              count: analysis.count
            })
      )
    }
  }
}

export const BASIC_PLAYER_CARD_TAGS: PlayerCardTagDefinition[] = [
  SELF_TAG,
  PREMADE_TEAM_TAG,
  HIGH_WIN_RATE_TAG,
  PRIVACY_TAG,
  WINNING_STREAK_TAG,
  LOSING_STREAK_TAG,
  EASY_GANK_TAG,
  SOLO_KILLS_TAG,
  AVERAGE_TEAM_DAMAGE_TAG,
  AVERAGE_TEAM_DAMAGE_TAKEN_TAG,
  AVERAGE_TEAM_GOLD_TAG,
  AVERAGE_CS_PER_MINUTE_TAG,
  AVERAGE_DAMAGE_GOLD_EFFICIENCY_TAG,
  AVERAGE_ENEMY_MISSING_PINGS_TAG,
  AVERAGE_VISION_SCORE_TAG,
  AVERAGE_KILL_DAMAGE_EFFICIENCY_TAG
]
