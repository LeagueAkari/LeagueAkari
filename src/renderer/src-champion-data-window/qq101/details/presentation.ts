import type {
  Qq101DetailView,
  Qq101RiftSectionKey,
  Qq101Section
} from '@renderer-shared/shards/champion-data/qq101/types'

import { formatCount } from '../format'

export type EntityKind = 'champion' | 'item' | 'perk' | 'spell' | 'augment'

export type DetailCell =
  | { kind: 'text'; text: string }
  | { kind: 'abilities'; values: string[] }
  | { kind: 'position'; value: string }
  | { kind: 'tier'; value: number }
  | { kind: 'entities'; entity: EntityKind; ids: number[] }

export interface DetailTable {
  title: string
  columns: string[]
  rows: DetailCell[][]
}

export interface DetailPanel {
  key: Qq101RiftSectionKey | 'recommendations'
  state: Qq101Section<unknown>
  date: string
  tables: DetailTable[]
  chart?: DetailChart
}

export interface DetailChart {
  kind: 'line' | 'bar'
  axis: 'patch' | 'duration'
  points: { label: string; winRate: number | null; rank?: number | null }[]
}

function text(value: string | number | null): DetailCell {
  return {
    kind: 'text',
    text: value === null ? '—' : String(value)
  }
}

function position(value: string): DetailCell {
  return { kind: 'position', value }
}

function tier(value: number): DetailCell {
  return { kind: 'tier', value }
}

function entities(entity: EntityKind, ids: number[]): DetailCell {
  return { kind: 'entities', entity, ids }
}

function percent(value: number | null) {
  return text(value === null ? null : `${(value * 100).toFixed(2)}%`)
}

function ability(values: (number | string)[]): DetailCell {
  return {
    kind: 'abilities',
    values: values.map((v) =>
      typeof v === 'number' ? ({ 1: 'Q', 2: 'W', 3: 'E', 4: 'R' }[v] ?? `#${v}`) : v
    )
  }
}

function table(title: string, columns: string[], rows: DetailCell[][]): DetailTable {
  return { title, columns, rows }
}

function rates(row: { pickRate: number | null; winRate: number | null }) {
  return [percent(row.pickRate), percent(row.winRate)]
}

export function detailPanels(view: Qq101DetailView, quality = 'all'): DetailPanel[] {
  if (view.mode === 'aram_mayhem') {
    const state = view.recommendations
    if (state.status !== 'ready') return [{ key: 'recommendations', state, date: '', tables: [] }]

    const data = state.data
    return [
      {
        key: 'recommendations',
        state,
        date: data.date,
        tables: [
          table(
            'augments',
            ['augment', 'grade', 'pickRate'],
            (quality === 'all'
              ? data.augments
              : data.augmentsByQuality.filter((row) => row.quality === quality)
            ).map((r) => [entities('augment', [r.augmentId]), text(r.grade), percent(r.pickRate)])
          ),
          ...(['starting', 'boots', 'core', 'items', 'builds'] as const).map((key) =>
            table(
              key,
              ['items', 'pickRate', 'winRate'],
              data[key].map((r) => [entities('item', r.itemIds), ...rates(r)])
            )
          ),
          table(
            'skillOrder',
            ['priority', 'levelOrder', 'pickRate', 'winRate'],
            data.skillOrders.flatMap((r) =>
              r.plans.length
                ? r.plans.map((p) => [
                    ability(r.abilityCodes),
                    ability(p.abilityCodes),
                    ...rates(p)
                  ])
                : [[ability(r.abilityCodes), ability([]), ...rates(r)]]
            )
          ),
          table(
            'synergies',
            ['champion', 'pickRate', 'winRate'],
            data.partners.map((r) => [entities('champion', [r.championId]), ...rates(r)])
          )
        ]
      }
    ]
  }

  const sections = view.sections
  const panels: DetailPanel[] = []

  const add = <T extends { date: string }>(
    key: Qq101RiftSectionKey,
    state: Qq101Section<T>,
    project: (data: T) => DetailTable[]
  ) => {
    panels.push({
      key,
      state,
      date: state.status === 'ready' ? state.data.date : '',
      tables: state.status === 'ready' ? project(state.data) : []
    })
  }

  const addChart = <T extends { date: string }>(
    key: 'trend' | 'durations',
    state: Qq101Section<T>,
    project: (data: T) => DetailChart
  ) => {
    panels.push({
      key,
      state,
      date: state.status === 'ready' ? state.data.date : '',
      tables: [],
      chart: state.status === 'ready' ? project(state.data) : undefined
    })
  }

  add('positions', sections.positions, (d) => [
    table(
      'positions',
      ['position', 'share', 'winRate', 'pickRate', 'banRate'],
      d.positions.map((r) => [
        position(r.position),
        percent(r.share),
        percent(r.winRate),
        percent(r.pickRate),
        percent(r.banRate)
      ])
    )
  ])
  add('runes', sections.runes, (d) => [
    table(
      'runes',
      ['rank', 'primaryRunes', 'secondaryRunes', 'statShards', 'pickRate', 'winRate', 'games'],
      d.pages.map((r) => [
        text(r.rank),
        entities('perk', r.primaryRuneIds),
        entities('perk', r.secondaryRuneIds),
        entities('perk', r.statShardIds),
        ...rates(r),
        text(formatCount(r.games))
      ])
    )
  ])
  add('summonerSpells', sections.summonerSpells, (d) => [
    table(
      'summonerSpells',
      ['spells', 'pickRate', 'winRate'],
      d.recommendations.map((r) => [entities('spell', r.summonerSpellIds), ...rates(r)])
    )
  ])
  add('skillOrder', sections.skillOrder, (d) => [
    table(
      'skillOrder',
      ['priority', 'levelOrder', 'pickRate', 'winRate'],
      d.options.map((r) => [ability(r.abilityPriority), ability(r.levelOrder), ...rates(r)])
    )
  ])
  add('build', sections.build, (d) =>
    Object.entries(d.slots).map(([key, rows]) =>
      table(
        key,
        ['items', 'pickRate', 'winRate'],
        rows.map((r) => [entities('item', r.itemIds), ...rates(r)])
      )
    )
  )
  add('matchups', sections.matchups, (d) =>
    (['favorable', 'unfavorable'] as const).map((key) =>
      table(
        key,
        ['champion', 'winRate', 'matchupRate'],
        d[key].map((r) => [
          entities('champion', [r.championId]),
          percent(r.winRate),
          percent(r.advantage)
        ])
      )
    )
  )
  add('synergies', sections.synergies, (d) => [
    table(
      'synergies',
      ['champion', 'winRate', 'games'],
      d.synergies.map((r) => [
        entities('champion', [r.championId]),
        percent(r.winRate),
        text(formatCount(r.games))
      ])
    )
  ])
  addChart('trend', sections.trend, (d) => ({
    kind: 'line',
    axis: 'patch',
    points: d.points
      .toSorted((a, b) => a.patch.localeCompare(b.patch, undefined, { numeric: true }))
      .map((r) => ({ label: r.patch, winRate: r.winRate }))
  }))
  add('tierStats', sections.tierStats, (d) => [
    table(
      'tierStats',
      ['tier', 'winRate', 'pickRate', 'banRate'],
      d.tiers.map((r) => [
        tier(r.tierId),
        percent(r.winRate),
        percent(r.pickRate),
        percent(r.banRate)
      ])
    )
  ])
  addChart('durations', sections.durations, (d) => ({
    kind: 'bar',
    axis: 'duration',
    points: d.durations
      .toSorted((a, b) => a.rangeId - b.rangeId)
      .map((r) => ({ label: r.range, winRate: r.winRate, rank: r.rank }))
  }))
  if (view.position === 'JUNGLE') {
    add('jungle', sections.jungle, () => [])
  }

  return panels
}
