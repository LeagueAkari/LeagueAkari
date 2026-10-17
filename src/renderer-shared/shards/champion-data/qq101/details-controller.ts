import { formatError } from '@shared/utils/errors'
import { QueueKeeper, isAbortError } from '@shared/utils/queue-keeper'

import type { ChampionDataRendererContext } from '../context'
import type { Qq101ChampionDataLoader } from './data-loader'
import type { Qq101DetailSectionKey, Qq101DetailView, Qq101HeroQuery, Qq101Section } from './types'

export interface Qq101DetailsHost {
  readonly enabled: boolean
  readonly query: Qq101HeroQuery
  detailView: Qq101DetailView | null
}

const SECTION_KEYS = [
  'positions',
  'matchups',
  'synergies',
  'summonerSpells',
  'skillOrder',
  'build',
  'runes',
  'trend',
  'tierStats',
  'durations',
  'jungle'
] as const

function hasContent(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value !== 'object' || value === null) return false

  return Object.values(value).some((entry) =>
    Array.isArray(entry) ? entry.length > 0 : typeof entry === 'object' && hasContent(entry)
  )
}

/** Owns the selected hero's request lifetime, independently from the ranking query. */
export class Qq101DetailsController {
  private _abortController: AbortController | null = null
  private _sequence = 0
  private readonly _queue = new QueueKeeper([{ id: 'details', options: { concurrency: 4 } }])

  constructor(
    private readonly _context: ChampionDataRendererContext,
    private readonly _loader: Qq101ChampionDataLoader,
    private readonly _state: Qq101DetailsHost
  ) {}

  close() {
    this._abortController?.abort()
    this._abortController = null
    this._state.detailView = null
  }

  async select(championId: number, position?: string) {
    const preferences = this._state.query
    if (!this._state.enabled) return

    this.close()

    const controller = new AbortController()
    this._abortController = controller

    if (preferences.mode === 'aram_mayhem') {
      this._state.detailView = {
        mode: 'aram_mayhem',
        championId,
        summary: { status: 'idle' },
        recommendations: { status: 'idle' }
      }
      await Promise.all([this.retry('recommendations'), this.retry('summary')])
      return
    }

    const sections = Object.fromEntries(
      SECTION_KEYS.map((key) => [key, { status: 'idle' }])
    ) as Extract<Qq101DetailView, { mode: 'ranked' }>['sections']
    const view: Extract<Qq101DetailView, { mode: 'ranked' }> = {
      mode: 'ranked',
      championId,
      position: position && position !== 'ALL' ? position : null,
      patch: preferences.patch ?? '',
      tier: preferences.tier,
      sections
    }

    this._state.detailView = view
    await this.retry('positions', false)

    if (controller.signal.aborted) return
    if (!this._state.detailView || this._state.detailView.mode !== 'ranked') return

    const current = this._state.detailView
    if (!current.position && current.sections.positions.status === 'ready') {
      const positions = [...current.sections.positions.data.positions].sort(
        (a, b) => (b.share ?? -1) - (a.share ?? -1)
      )
      this._state.detailView = { ...current, position: positions[0]?.position ?? null }
    }

    if (!this._state.detailView.position) return

    await this._loadSections()
  }

  async changePosition(position: string) {
    const view = this._state.detailView
    if (view?.mode !== 'ranked') return

    await this.select(view.championId, position)
  }

  private async _loadSections() {
    await Promise.all(
      SECTION_KEYS.filter((key) => key !== 'positions').map((key) => this.retry(key))
    )
  }

  async retry(key: Qq101DetailSectionKey, unlock = true) {
    const view = this._state.detailView
    const signal = this._abortController?.signal
    if (!view || !signal || signal.aborted) return

    if (view.mode === 'aram_mayhem') {
      if (key === 'summary') {
        if (view.summary.status === 'loading') return

        this._state.detailView = { ...view, summary: { status: 'loading' } }
        const summary = await this._run(
          () => this._loader.loadMayhemSummary(view.championId, signal),
          key,
          signal
        )
        const current = this._state.detailView
        if (!signal.aborted && current?.mode === 'aram_mayhem') {
          this._state.detailView = { ...current, summary }
        }

        return
      }

      if (key !== 'recommendations' || view.recommendations.status === 'loading') return

      this._state.detailView = { ...view, recommendations: { status: 'loading' } }
      const result = await this._run(
        () => this._loader.loadMayhemDetails(view.championId, signal),
        key,
        signal
      )
      const current = this._state.detailView
      if (!signal.aborted && current?.mode === 'aram_mayhem') {
        this._state.detailView = { ...current, recommendations: result }
      }

      return
    }

    if (key === 'recommendations' || key === 'summary' || view.sections[key].status === 'loading')
      return
    if (key !== 'positions' && !view.position) return

    if (key === 'jungle' && view.position !== 'JUNGLE') {
      this._state.detailView = {
        ...view,
        sections: { ...view.sections, jungle: { status: 'empty' } }
      }
      return
    }

    this._state.detailView = {
      ...view,
      sections: { ...view.sections, [key]: { status: 'loading' } }
    }

    const result = await this._run(
      () =>
        this._loader.loadRiftSection(
          key,
          {
            patch: view.patch,
            tier: view.tier,
            position: view.position ?? 'ALL'
          },
          view.championId,
          signal
        ),
      key,
      signal
    )

    const current = this._state.detailView
    if (signal.aborted || current?.mode !== 'ranked') return

    this._state.detailView = { ...current, sections: { ...current.sections, [key]: result } }

    // Retrying the prerequisite can unlock a hero whose lane lookup initially failed.
    if (
      key === 'positions' &&
      !current.position &&
      result.status === 'ready' &&
      'positions' in result.data
    ) {
      const positions = [...result.data.positions].sort((a, b) => (b.share ?? -1) - (a.share ?? -1))
      const position = positions[0]?.position
      if (position) {
        this._state.detailView = { ...this._state.detailView, position }
        if (unlock) {
          await this._loadSections()
        }
      }
    }
  }

  private async _run<T>(
    load: () => Promise<T>,
    key: string,
    signal: AbortSignal
  ): Promise<Qq101Section<T>> {
    try {
      const data = await this._queue.add('details', String(++this._sequence), load, { signal })
      return hasContent(data) ? { status: 'ready', data } : { status: 'empty' }
    } catch (error) {
      if (signal.aborted || isAbortError(error)) return { status: 'idle' }

      const message = formatError(error)
      this._context.logger.warn(`QQ101 ${key} failed`, message)
      return { status: 'error', message }
    }
  }
}
