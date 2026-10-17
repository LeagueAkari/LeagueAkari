import type { Qq101PairQuery } from '@shared/http-api-axios-helper/qq101'
import { formatError } from '@shared/utils/errors'
import { isAbortError } from '@shared/utils/queue-keeper'

import type { ChampionDataRendererContext } from '../context'
import { useChampionDataStore } from '../store'
import type { Qq101ChampionDataLoader } from './data-loader'
import { Qq101DetailsController } from './details-controller'
import type { Qq101DetailSectionKey, Qq101HeroQuery, Qq101Page } from './types'

function sameHeroQuery(a: Qq101HeroQuery, b: Qq101HeroQuery) {
  return a.mode === 'aram_mayhem'
    ? b.mode === 'aram_mayhem'
    : b.mode === 'ranked' && a.patch === b.patch && a.tier === b.tier && a.position === b.position
}

function samePairQuery(a: Qq101PairQuery, b: Qq101PairQuery) {
  return (
    a.championId === b.championId && a.firstRole === b.firstRole && a.secondRole === b.secondRole
  )
}

export class Qq101PagesController {
  private _sequence = 0
  private readonly _details = new Map<string, Qq101DetailsController>()
  private readonly _pairs = new Map<string, AbortController>()
  private readonly _modeChanges = new Map<string, AbortController>()

  constructor(
    private readonly _context: ChampionDataRendererContext,
    private readonly _loader: Qq101ChampionDataLoader
  ) {}

  private get _state() {
    return useChampionDataStore().qq101
  }

  private get _enabled() {
    return this._state.enabled && useChampionDataStore().settings.sourcePreferences.enabled.qq101
  }

  activate(id: string) {
    if (id === 'rankings' || this._state.pages.items.some((p) => p.id === id)) {
      this._state.pages.activeId = id
    }
  }

  private _replace(page: Qq101Page) {
    this._state.pages.items = this._state.pages.items.map((p) => (p.id === page.id ? page : p))
  }

  async openChampion(championId: number, position?: string, originId?: string) {
    if (!this._enabled) return

    const origin = this._state.pages.items.find((p) => p.id === originId)
    const preferences = this._state.loadedPreferences
    const query: Qq101HeroQuery | null =
      origin?.kind === 'champion'
        ? origin.query.mode === 'ranked'
          ? { ...origin.query, position: position ?? null }
          : origin.query
        : origin?.kind === 'pairs' || preferences?.mode === 'aram_mayhem'
          ? { mode: 'aram_mayhem' }
          : preferences?.mode === 'ranked'
            ? {
                mode: 'ranked',
                patch: preferences.patch ?? '',
                tier: preferences.tier,
                position: position ?? null
              }
            : null
    if (!query) return

    const existing = this._state.pages.items.find(
      (p) => p.kind === 'champion' && p.championId === championId && sameHeroQuery(p.query, query)
    )
    if (existing) {
      this.activate(existing.id)
      return
    }

    const id = `qq101-${++this._sequence}`
    const page: Extract<Qq101Page, { kind: 'champion' }> = {
      kind: 'champion',
      id,
      championId,
      query,
      view: null,
      modeChange: { status: 'idle' }
    }

    this._state.pages.items = [...this._state.pages.items, page]
    this.activate(id)

    const owner = this
    const controller = new Qq101DetailsController(this._context, this._loader, {
      get enabled() {
        return owner._enabled && owner._state.pages.items.some((p) => p.id === id)
      },

      get query() {
        const current = owner._state.pages.items.find((p) => p.id === id)
        return current?.kind === 'champion' ? current.query : query
      },

      get detailView() {
        const current = owner._state.pages.items.find((p) => p.id === id)
        return current?.kind === 'champion' ? current.view : null
      },

      set detailView(view) {
        const current = owner._state.pages.items.find((p) => p.id === id)
        if (current?.kind === 'champion') {
          owner._replace({ ...current, view })
        }
      }
    })

    this._details.set(id, controller)
    await controller.select(
      championId,
      query.mode === 'ranked' ? (query.position ?? undefined) : undefined
    )
  }

  async updateHero(id: string, query: Qq101HeroQuery) {
    const page = this._state.pages.items.find((p) => p.id === id)
    if (page?.kind !== 'champion') return

    this._modeChanges.get(id)?.abort()
    this._replace({ ...page, query, modeChange: { status: 'idle' } })
    await this._details
      .get(id)
      ?.select(page.championId, query.mode === 'ranked' ? (query.position ?? undefined) : undefined)
  }

  async changeHeroMode(id: string, mode: 'ranked' | 'aram_mayhem') {
    const page = this._state.pages.items.find((p) => p.id === id)
    if (page?.kind !== 'champion') return

    if (mode === 'aram_mayhem') {
      await this.updateHero(id, { mode })
      return
    }

    this._modeChanges.get(id)?.abort()

    const controller = new AbortController()
    this._modeChanges.set(id, controller)
    this._replace({ ...page, modeChange: { status: 'loading' } })

    try {
      const patches = this._state.patches.length
        ? this._state.patches
        : (await this._loader.loadPatches(controller.signal)).map((p) => p.name)
      if (controller.signal.aborted) return
      if (!patches[0]) throw new Error('QQ101 patch list is empty')

      this._state.patches = patches
      await this.updateHero(id, { mode, patch: patches[0], tier: 255, position: null })
    } catch (error) {
      if (controller.signal.aborted || isAbortError(error)) return

      const current = this._state.pages.items.find((p) => p.id === id)
      const message = formatError(error)
      this._context.logger.warn('QQ101 hero mode change failed', message)
      if (current?.kind === 'champion') {
        this._replace({ ...current, modeChange: { status: 'error', message } })
      }
    }
  }

  async openPairs(query: Qq101PairQuery) {
    const existing = this._state.pages.items.find(
      (p) => p.kind === 'pairs' && samePairQuery(p.query, query)
    )
    if (existing) {
      this.activate(existing.id)
      return
    }

    const id = `qq101-${++this._sequence}`
    this._state.pages.items = [
      ...this._state.pages.items,
      { kind: 'pairs', id, query, state: { status: 'idle' } }
    ]
    this.activate(id)
    await this.updatePairs(id, query)
  }

  async updatePairs(id: string, query: Qq101PairQuery) {
    const page = this._state.pages.items.find((p) => p.id === id)
    if (page?.kind !== 'pairs' || !this._enabled) return

    this._pairs.get(id)?.abort()

    const controller = new AbortController()
    this._pairs.set(id, controller)
    this._replace({ ...page, query, state: { status: 'loading' } })

    try {
      const data = await this._loader.loadPairs(query, controller.signal)
      if (!controller.signal.aborted) {
        this._replace({
          ...page,
          query,
          state: data.synergies.length ? { status: 'ready', data } : { status: 'empty' }
        })
      }
    } catch (error) {
      if (controller.signal.aborted || isAbortError(error)) return

      const message = formatError(error)
      this._context.logger.warn('QQ101 pair page failed', message)
      this._replace({ ...page, query, state: { status: 'error', message } })
    }
  }

  retry(id: string, key: Qq101DetailSectionKey) {
    return this._details.get(id)?.retry(key)
  }

  refresh(id = this._state.pages.activeId) {
    const page = this._state.pages.items.find((p) => p.id === id)
    if (page?.kind === 'pairs') return this.updatePairs(id, page.query)
    if (page?.kind === 'champion') return this.updateHero(id, page.query)

    return Promise.resolve()
  }

  close(id: string) {
    const index = this._state.pages.items.findIndex((p) => p.id === id)
    if (index < 0) return

    this._details.get(id)?.close()
    this._details.delete(id)
    this._pairs.get(id)?.abort()
    this._pairs.delete(id)
    this._modeChanges.get(id)?.abort()
    this._modeChanges.delete(id)

    this._state.pages.items = this._state.pages.items.filter((p) => p.id !== id)

    if (this._state.pages.activeId === id) {
      this.activate(this._state.pages.items[Math.max(0, index - 1)]?.id ?? 'rankings')
    }
  }

  reorder(ids: string[]) {
    const pages = new Map(this._state.pages.items.map((page) => [page.id, page]))
    if (
      ids.length !== pages.size ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !pages.has(id))
    ) {
      throw new Error('Invalid QQ101 tab order')
    }

    this._state.pages.items = ids.map((id) => pages.get(id)!)
  }

  clear() {
    for (const page of [...this._state.pages.items]) {
      this.close(page.id)
    }

    this.activate('rankings')
  }
}
