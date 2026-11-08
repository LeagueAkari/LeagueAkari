import { formatError } from '@shared/utils/errors'
import { QueueKeeper, isAbortError } from '@shared/utils/queue-keeper'

import type { ChampionDataRendererContext } from '../context'
import { useChampionDataStore } from '../store'
import type { Qq101ChampionDataLoader } from './data-loader'
import type { Qq101DetailSectionKey, Qq101DetailView, Qq101Section } from './types'

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
  if (Array.isArray(value)) {
    return value.length > 0
  }

  if (typeof value !== 'object' || value === null) {
    return false
  }

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
    private readonly _pageId: string
  ) {}

  private get _page() {
    const page = useChampionDataStore().qq101.pages.items.find((page) => page.id === this._pageId)

    return page?.kind === 'champion' ? page : null
  }

  private _setView(view: Qq101DetailView | null) {
    const { pages } = useChampionDataStore().qq101

    pages.items = pages.items.map((page) =>
      page.kind === 'champion' && page.id === this._pageId ? { ...page, view } : page
    )
  }

  close() {
    this._abortController?.abort()
    this._abortController = null

    this._setView(null)
  }

  async select(championId: number, position?: string) {
    const store = useChampionDataStore()
    const preferences = this._page?.query

    if (!preferences || !store.qq101.enabled || !store.settings.sourcePreferences.enabled.qq101) {
      return
    }

    this.close()

    const controller = new AbortController()
    this._abortController = controller

    if (preferences.mode === 'aram_mayhem') {
      this._setView({
        mode: 'aram_mayhem',
        championId,
        summary: { status: 'idle' },
        recommendations: { status: 'idle' }
      })
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

    this._setView(view)

    await this.retry('positions', false)

    if (controller.signal.aborted) {
      return
    }

    const current = this._page?.view
    if (current?.mode !== 'ranked' || !current.position) {
      return
    }

    await this._loadSections()
  }

  async changePosition(position: string) {
    const view = this._page?.view
    if (view?.mode !== 'ranked') {
      return
    }

    await this.select(view.championId, position)
  }

  private async _loadSections() {
    await Promise.all(
      SECTION_KEYS.filter((key) => key !== 'positions').map((key) => this.retry(key))
    )
  }

  async retry(key: Qq101DetailSectionKey, unlock = true) {
    const view = this._page?.view
    const signal = this._abortController?.signal
    if (!view || !signal || signal.aborted) {
      return
    }

    if (view.mode === 'aram_mayhem') {
      if (key === 'summary') {
        if (view.summary.status === 'loading') {
          return
        }

        this._setView({ ...view, summary: { status: 'loading' } })

        const summary = await this._run(
          () => this._loader.loadMayhemSummary(view.championId, signal),
          key,
          signal
        )
        const current = this._page?.view
        if (!signal.aborted && current?.mode === 'aram_mayhem') {
          this._setView({ ...current, summary })
        }

        return
      }

      if (key !== 'recommendations' || view.recommendations.status === 'loading') {
        return
      }

      this._setView({ ...view, recommendations: { status: 'loading' } })

      const result = await this._run(
        () => this._loader.loadMayhemDetails(view.championId, signal),
        key,
        signal
      )
      const current = this._page?.view
      if (!signal.aborted && current?.mode === 'aram_mayhem') {
        this._setView({ ...current, recommendations: result })
      }

      return
    }

    if (key === 'recommendations' || key === 'summary' || view.sections[key].status === 'loading') {
      return
    }

    if (key !== 'positions' && !view.position) {
      return
    }

    if (key === 'jungle' && view.position !== 'JUNGLE') {
      this._setView({
        ...view,
        sections: { ...view.sections, jungle: { status: 'empty' } }
      })
      return
    }

    this._setView({
      ...view,
      sections: { ...view.sections, [key]: { status: 'loading' } }
    })

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

    const current = this._page?.view
    if (signal.aborted || current?.mode !== 'ranked') {
      return
    }

    let position = current.position
    if (
      key === 'positions' &&
      !position &&
      result.status === 'ready' &&
      'positions' in result.data
    ) {
      const positions = [...result.data.positions].sort((a, b) => (b.share ?? -1) - (a.share ?? -1))
      position = positions[0]?.position ?? null
    }

    this._setView({ ...current, position, sections: { ...current.sections, [key]: result } })

    // A successful lane retry also starts the sections that were waiting on it.
    if (unlock && !current.position && position) {
      await this._loadSections()
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
      if (signal.aborted || isAbortError(error)) {
        return { status: 'idle' }
      }

      const message = formatError(error)
      this._context.logger.warn(`QQ101 ${key} failed`, message)

      return { status: 'error', message }
    }
  }
}
