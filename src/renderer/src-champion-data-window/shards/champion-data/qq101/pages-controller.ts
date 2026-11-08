import type { Qq101PairQuery } from '@shared/http-api-axios-helper/qq101'
import type { CurrentGameUnavailableReason } from '@shared/shards/champion-data/automation'
import { formatError } from '@shared/utils/errors'
import { isAbortError } from '@shared/utils/queue-keeper'
import isEqual from 'lodash/isEqual'

import type { ChampionDataRendererContext } from '../context'
import { isValidRunePage } from '../source-contract'
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

  get currentGamePage() {
    return (
      this._state.pages.items.find(
        (p): p is Extract<Qq101Page, { kind: 'champion' }> =>
          p.kind === 'champion' && Boolean(p.currentGame)
      ) ?? null
    )
  }

  async syncCurrentGamePage(
    championId: number,
    query: Qq101HeroQuery,
    reason: CurrentGameUnavailableReason | null
  ) {
    if (!this._enabled) {
      return
    }

    const previous = this.currentGamePage
    const currentGame = { requestedQuery: query, unavailableReason: reason }
    if (previous?.championId === championId && isEqual(previous.currentGame, currentGame)) {
      return
    }

    const id = previous?.id ?? `qq101-${++this._sequence}`
    const page: Extract<Qq101Page, { kind: 'champion' }> = {
      kind: 'champion',
      id,
      championId,
      query,
      currentGame,
      view: null,
      modeChange: { status: 'idle' }
    }
    if (previous) {
      this._replace(page)
    } else {
      this._state.pages.items = [page, ...this._state.pages.items]
      this.activate(id)
    }

    return this._loadCurrentGamePage()
  }

  private async _loadCurrentGamePage() {
    const page = this.currentGamePage
    if (!page?.currentGame || !this._enabled) {
      return
    }

    this._details.get(page.id)?.close()
    this._modeChanges.get(page.id)?.abort()

    if (page.currentGame.unavailableReason) {
      return
    }

    const request = new AbortController()
    this._modeChanges.set(page.id, request)

    this._replace({ ...page, view: null, modeChange: { status: 'loading' } })

    try {
      let query = page.currentGame.requestedQuery
      if (query.mode === 'ranked') {
        const patches = await this._loader.loadPatches(request.signal)
        if (request.signal.aborted) {
          return
        }

        if (!patches[0]) {
          throw new Error('QQ101 patch list is empty')
        }

        query = { ...query, patch: patches[0].name }
      }

      if (request.signal.aborted) {
        return
      }

      this._replace({ ...page, query, view: null, modeChange: { status: 'idle' } })

      await this._createDetails(page.id).select(
        page.championId,
        query.mode === 'ranked' ? (query.position ?? undefined) : undefined
      )
    } catch (error) {
      if (request.signal.aborted || isAbortError(error)) {
        return
      }

      const current = this.currentGamePage
      if (current?.id === page.id) {
        this._replace({ ...current, modeChange: { status: 'error', message: formatError(error) } })
      }
    }
  }

  removeCurrentGamePage() {
    const page = this.currentGamePage
    if (page) {
      this._removePage(page.id)
    }
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
    if (!this._enabled) {
      return
    }

    const origin = this._state.pages.items.find((p) => p.id === originId)
    const preferences = this._state.loadedPreferences
    let query: Qq101HeroQuery

    if (origin?.kind === 'champion') {
      query =
        origin.query.mode === 'ranked'
          ? { ...origin.query, position: position ?? null }
          : origin.query
    } else if (origin?.kind === 'pairs' || preferences?.mode === 'aram_mayhem') {
      query = { mode: 'aram_mayhem' }
    } else if (preferences?.mode === 'ranked') {
      query = {
        mode: 'ranked',
        patch: preferences.patch ?? '',
        tier: preferences.tier,
        position: position ?? null
      }
    } else {
      return
    }

    const existing = this._state.pages.items.find(
      (p) =>
        p.kind === 'champion' &&
        !p.currentGame &&
        p.championId === championId &&
        sameHeroQuery(p.query, query)
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

    const controller = this._createDetails(id)
    await controller.select(
      championId,
      query.mode === 'ranked' ? (query.position ?? undefined) : undefined
    )
  }

  private _createDetails(id: string) {
    const controller = new Qq101DetailsController(this._context, this._loader, id)

    this._details.set(id, controller)
    return controller
  }

  async updateHero(id: string, query: Qq101HeroQuery) {
    if (
      this._state.pages.items.some((p) => p.id === id && p.kind === 'champion' && p.currentGame)
    ) {
      return
    }

    return this._updateHero(id, query)
  }

  private async _updateHero(id: string, query: Qq101HeroQuery) {
    const page = this._state.pages.items.find((p) => p.id === id)
    if (page?.kind !== 'champion') {
      return
    }

    this._modeChanges.get(id)?.abort()
    this._replace({ ...page, query, modeChange: { status: 'idle' } })
    await this._details
      .get(id)
      ?.select(page.championId, query.mode === 'ranked' ? (query.position ?? undefined) : undefined)
  }

  async changeHeroMode(id: string, mode: 'ranked' | 'aram_mayhem') {
    const page = this._state.pages.items.find((p) => p.id === id)
    if (page?.kind !== 'champion' || page.currentGame) {
      return
    }

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
      if (controller.signal.aborted) {
        return
      }

      if (!patches[0]) {
        throw new Error('QQ101 patch list is empty')
      }

      this._state.patches = patches
      await this.updateHero(id, { mode, patch: patches[0], tier: 255, position: null })
    } catch (error) {
      if (controller.signal.aborted || isAbortError(error)) {
        return
      }

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
    if (page?.kind !== 'pairs' || !this._enabled) {
      return
    }

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
      if (controller.signal.aborted || isAbortError(error)) {
        return
      }

      const message = formatError(error)
      this._context.logger.warn('QQ101 pair page failed', message)
      this._replace({ ...page, query, state: { status: 'error', message } })
    }
  }

  getRecommendedRunes() {
    const page = this.currentGamePage
    const section = page?.view?.mode === 'ranked' ? page.view.sections.runes : null
    if (!page || section?.status !== 'ready') {
      return undefined
    }

    return section.data.pages
      .map((_rune, index) => this.getRuneSelection(page.id, index)!.runes)
      .find(isValidRunePage)
  }

  getRuneSelection(id: string, index: number) {
    if (!this._enabled) {
      return null
    }

    const page = this._state.pages.items.find((p) => p.id === id)
    const view = page?.kind === 'champion' ? page.view : null
    if (view?.mode !== 'ranked' || view.sections.runes.status !== 'ready') {
      return null
    }

    const rune = view.sections.runes.data.pages[index]
    if (!rune) {
      return null
    }

    return {
      championId: view.championId,
      runes: {
        primaryStyleId: rune.primaryStyleId ?? 0,
        subStyleId: rune.secondaryStyleId ?? 0,
        selectedPerkIds: [...rune.primaryRuneIds, ...rune.secondaryRuneIds, ...rune.statShardIds]
      }
    }
  }

  retry(id: string, key: Qq101DetailSectionKey) {
    return this._details.get(id)?.retry(key)
  }

  async refresh(id = this._state.pages.activeId) {
    const page = this._state.pages.items.find((p) => p.id === id)
    if (page?.kind === 'pairs') {
      return this.updatePairs(id, page.query)
    }

    if (page?.kind === 'champion') {
      return page.currentGame ? this._loadCurrentGamePage() : this.updateHero(id, page.query)
    }
  }

  close(id: string) {
    if (
      this._state.pages.items.some((p) => p.id === id && p.kind === 'champion' && p.currentGame)
    ) {
      return
    }

    this._removePage(id)
  }

  private _removePage(id: string) {
    const index = this._state.pages.items.findIndex((p) => p.id === id)
    if (index < 0) {
      return
    }

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

    const ordered = ids.map((id) => pages.get(id)!)
    this._state.pages.items = [
      ...ordered.filter((p) => p.kind === 'champion' && p.currentGame),
      ...ordered.filter((p) => p.kind !== 'champion' || !p.currentGame)
    ]
  }

  clear() {
    for (const page of [...this._state.pages.items]) {
      this._removePage(page.id)
    }

    this.activate('rankings')
  }
}
