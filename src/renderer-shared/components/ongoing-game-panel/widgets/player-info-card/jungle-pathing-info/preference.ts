import type { AggregatedJungleAnalysis } from '@shared/data-adapter/analysis/player'

type Translate = (key: string, options?: Record<string, unknown>) => string

type MapPreferenceKind = 'top' | 'mid' | 'bot' | 'topMid' | 'midBot' | 'balanced'

interface MapPreference {
  kind: MapPreferenceKind
  pct: number | null
}

export function resolveMapPreference(stats: AggregatedJungleAnalysis): MapPreference {
  const topShare = stats.avgTopZonePercentage
  const midShare = stats.avgMidZonePercentage
  const botShare = stats.avgBotZonePercentage
  const topMidShare = topShare + midShare
  const midBotShare = midShare + botShare

  if (midBotShare >= 0.7 && topShare <= 0.28) {
    return { kind: 'midBot', pct: Math.round(midBotShare * 100) }
  }

  if (topMidShare >= 0.7 && botShare <= 0.28) {
    return { kind: 'topMid', pct: Math.round(topMidShare * 100) }
  }

  const ranked = [
    { kind: 'top' as const, share: topShare },
    { kind: 'mid' as const, share: midShare },
    { kind: 'bot' as const, share: botShare }
  ].sort((a, b) => b.share - a.share)

  if (ranked[0].share >= 0.4 && ranked[0].share - ranked[1].share >= 0.08) {
    return { kind: ranked[0].kind, pct: Math.round(ranked[0].share * 100) }
  }

  return { kind: 'balanced', pct: null }
}

export function mapPreferenceText(t: Translate, pref: MapPreference, short = false): string {
  switch (pref.kind) {
    case 'top':
      return t('JunglePathing.topsidePref')
    case 'mid':
      return t('JunglePathing.midPref')
    case 'bot':
      return t('JunglePathing.botsidePref')
    case 'topMid':
      return t('JunglePathing.topMidPref')
    case 'midBot':
      return t('JunglePathing.midBotPref')
    default:
      return short ? t('JunglePathing.balancedShort') : t('JunglePathing.balanced')
  }
}

export function mapPreferenceColor(pref: MapPreference): string {
  switch (pref.kind) {
    case 'top':
    case 'topMid':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'mid':
      return 'text-amber-600 dark:text-yellow-400'
    case 'bot':
    case 'midBot':
      return 'text-blue-600 dark:text-blue-400'
    default:
      return 'text-black/70 dark:text-white/70'
  }
}

export function topsideTextShort(t: Translate, stats: AggregatedJungleAnalysis) {
  return mapPreferenceText(t, resolveMapPreference(stats), true)
}

export function topsideTextWithPct(t: Translate, stats: AggregatedJungleAnalysis) {
  const pref = resolveMapPreference(stats)
  const base = mapPreferenceText(t, pref)

  if (pref.pct === null) {
    return base
  }

  return `${base} ${pref.pct}%`
}

export function topsideTextTrigger(t: Translate, stats: AggregatedJungleAnalysis) {
  const pref = resolveMapPreference(stats)
  const base = t(`JunglePathing.prefShort.${pref.kind}`)

  if (pref.pct === null) {
    return base
  }

  return `${base} ${pref.pct}%`
}

export function topsideTextColor(stats: AggregatedJungleAnalysis) {
  return mapPreferenceColor(resolveMapPreference(stats))
}

export function formatWeightSum(value: number): string {
  const rounded = Math.round(value)

  return rounded > 999 ? '999+' : rounded.toString()
}
