import { createOpggSnapshot } from '@shared/shards/champion-data'
import type { OpggChampionDataPreferences } from '@shared/types/champion-data'
import type {
  OpggChampionDataQuery,
  OpggChampionDataQueryUpdate,
  OpggChampionDataSnapshot
} from '@shared/types/champion-data/opgg'
import type { OpggRankedPosition } from '@shared/types/opgg'
import { formatError } from '@shared/utils/errors'
import { QueueKeeper, isAbortError } from '@shared/utils/queue-keeper'
import { compareShallow, compareStructural, runInAction } from 'mobx'

import type {
  OpggChampionDataMainContext,
  OpggLoadedChampion,
  OpggLoadedOverview,
  OpggOverviewTarget
} from '../context'
import { type OpggProjectionResources, projectDetails, projectOverview } from './data-adapter'
import type { OpggChampionDataLoader } from './data-loader'

interface PendingPage {
  revision: number
  resolve: (loaded: boolean) => void
}

function canReuseOverview(overview: OpggLoadedOverview, target: OpggOverviewTarget) {
  if (overview.mode !== target.mode) {
    return false
  }
  if (overview.mode === 'aram_mayhem' || target.mode === 'aram_mayhem') {
    return true
  }
  if (overview.region !== target.region || overview.version !== target.version) {
    return false
  }
  if (overview.mode === 'arena' || target.mode === 'arena') {
    return true
  }
  return overview.tier === target.tier
}

export class OpggChampionDataController {
  private readonly _queue = new QueueKeeper([{ id: 'read', options: { concurrency: 1 } }])
  private _overview: OpggLoadedOverview | null = null
  private _ready: Promise<boolean> = Promise.resolve(false)
  private _dependenciesReady = false
  private _sequence = 0
  private _drainingGeneration: number | null = null
  private readonly _pending = new Map<number, PendingPage>()
  private readonly _cancelledPages = new Set<number | null>()
  private readonly _loaded = new Map<
    number,
    { champion: OpggLoadedChampion; position: OpggRankedPosition }
  >()

  constructor(
    private readonly _context: OpggChampionDataMainContext,
    private readonly _loader: OpggChampionDataLoader
  ) {}

  start() {
    const { state, settings, mobxUtils, extraAssets, leagueClient, windowManager } = this._context
    this._publish(createOpggSnapshot(settings.opggPreferences))
    mobxUtils.reaction(
      () => [state.enabled, windowManager.championDataWindow.settings.enabled] as const,
      ([enabled, windowEnabled]) => {
        if (!enabled || !windowEnabled) {
          this.cancel(!enabled)
          return
        }
        const follow = this._followQuery()
        void this.update(follow ?? {}, true, Boolean(follow))
      },
      { fireImmediately: true, equals: compareShallow }
    )
    mobxUtils.reaction(
      () => this._followQuery(),
      (query) => {
        if (query && windowManager.championDataWindow.settings.enabled && state.enabled) {
          void this.update(query, false, true)
        }
      },
      { equals: compareStructural }
    )
    mobxUtils.reaction(
      () => [
        state.aramBalance,
        extraAssets.gtimg.kiwiAugments,
        leagueClient.data.gameData.augments
      ],
      () => {
        const snapshot = state.snapshot
        const pages = { ...snapshot.pages }
        for (const [id, loaded] of this._loaded) {
          if (pages[id]?.status === 'ready' && !pages[id].stale) {
            pages[id] = { ...pages[id], champion: this._project(loaded.champion, loaded.position) }
          }
        }
        this._publish({ ...snapshot, pages })
      }
    )
  }

  private _publish(snapshot: OpggChampionDataSnapshot) {
    // Compatibility projections for existing renderer consumers; pages own the data.
    const active =
      snapshot.activePage === null ? snapshot.overviewState : snapshot.pages[snapshot.activePage]
    const champion =
      snapshot.activePage === null ? null : (snapshot.pages[snapshot.activePage]?.champion ?? null)
    runInAction(() => {
      this._context.state.snapshot = {
        ...snapshot,
        query: { ...snapshot.query, championId: snapshot.activePage },
        status: active?.status ?? 'idle',
        error: active?.error ?? null,
        champion
      }
    })
  }

  private _open(id: number) {
    const snapshot = this._context.state.snapshot
    if (!snapshot.pages[id] && snapshot.openedChampions.length >= 20) {
      return false
    }

    const pages = { ...snapshot.pages }
    if (!pages[id]) {
      pages[id] = {
        champion: null,
        status: 'idle',
        error: null,
        revision: ++this._sequence,
        stale: true
      }
    }
    this._publish({
      ...snapshot,
      activePage: id,
      openedChampions: snapshot.openedChampions.includes(id)
        ? snapshot.openedChampions
        : [...snapshot.openedChampions, id],
      pages
    })
    return true
  }

  async open(id: number) {
    if (
      !this._context.state.enabled ||
      !this._context.windowManager.championDataWindow.settings.enabled
    ) {
      return false
    }
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid champion ID')
    }
    if (!this._open(id)) {
      return false
    }
    const page = this._context.state.snapshot.pages[id]
    if (!page.stale || page.status === 'loading') {
      return true
    }
    if (!this._overview) {
      return this.update({}, true)
    }
    return this._requestPage(id)
  }

  activate(id: number | null) {
    if (id !== null) {
      return this.open(id)
    }
    this._publish({ ...this._context.state.snapshot, activePage: null })
    return Promise.resolve(true)
  }

  close(id: number) {
    const snapshot = this._context.state.snapshot
    const index = snapshot.openedChampions.indexOf(id)
    if (index < 0) {
      return
    }
    this._queue.cancelById(`champion:${id}`)
    this._pending.get(id)?.resolve(false)
    this._pending.delete(id)
    this._loaded.delete(id)
    const openedChampions = snapshot.openedChampions.filter((value) => value !== id)
    const pages = { ...snapshot.pages }
    delete pages[id]
    const activePage =
      snapshot.activePage === id
        ? (openedChampions[index] ?? openedChampions[index - 1] ?? null)
        : snapshot.activePage
    this._publish({ ...snapshot, openedChampions, pages, activePage })
  }

  reorder(ids: number[]) {
    const snapshot = this._context.state.snapshot
    if (
      ids.length !== snapshot.openedChampions.length ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !snapshot.pages[id])
    ) {
      throw new Error('Invalid OP.GG tab order')
    }
    this._publish({ ...snapshot, openedChampions: [...ids] })
  }

  private _cancelJobs() {
    this._queue.cancelAll()
    for (const job of this._pending.values()) {
      job.resolve(false)
    }
    this._pending.clear()
    this._drainingGeneration = null
  }

  cancel(clear = false) {
    this._cancelJobs()
    const snapshot = this._context.state.snapshot
    this._loaded.clear()
    this._overview = null
    this._ready = Promise.resolve(false)
    this._dependenciesReady = false
    this._cancelledPages.clear()
    if (clear) {
      this._loader.clear()
    }
    this._publish({
      ...snapshot,
      generation: snapshot.generation + 1,
      overview: clear ? null : snapshot.overview,
      overviewState: { ...snapshot.overviewState, status: 'idle', error: null, stale: true },
      pages: Object.fromEntries(
        Object.entries(snapshot.pages).map(([id, page]) => [
          id,
          {
            ...page,
            champion: clear ? null : page.champion,
            status: 'idle',
            error: null,
            stale: true
          }
        ])
      )
    })
  }

  cancelPage(id: number | null) {
    const snapshot = this._context.state.snapshot
    this._cancelledPages.add(id)
    if (id === null) {
      if (this._queue.hasTask('overview') && !snapshot.openedChampions.length) {
        this.cancel()
        return
      }
      this._queue.cancelById('overview-refresh')
      this._publish({
        ...snapshot,
        overviewState: {
          ...snapshot.overviewState,
          status: 'idle',
          stale: true,
          revision: ++this._sequence
        }
      })
      return
    }
    const page = snapshot.pages[id]
    if (!page) {
      return
    }
    this._queue.cancelById(`champion:${id}`)
    this._pending.get(id)?.resolve(false)
    this._pending.delete(id)
    this._publish({
      ...snapshot,
      pages: {
        ...snapshot.pages,
        [id]: {
          ...page,
          status: 'idle',
          error: null,
          stale: true,
          revision: ++this._sequence
        }
      }
    })
  }

  dispose() {
    this.cancel(true)
  }

  async update(
    update: OpggChampionDataQueryUpdate,
    force = false,
    follow = false
  ): Promise<boolean> {
    const { state, settingService, logger, windowManager } = this._context
    if (!state.enabled || !windowManager.championDataWindow.settings.enabled) {
      return false
    }
    const previous = state.snapshot
    const query = { ...previous.query, ...update }
    if (
      (query.mode !== previous.query.mode || query.region !== previous.query.region) &&
      update.version === undefined
    ) {
      query.version = null
    }
    if (update.championId !== undefined && update.championId !== null) {
      if (!this._open(update.championId)) {
        return false
      }
    } else if (update.championId === null) {
      this._publish({ ...state.snapshot, activePage: null })
    }
    if (follow) {
      this._publish({ ...state.snapshot, followSelectionId: state.snapshot.followSelectionId + 1 })
    }
    const changed =
      query.mode !== previous.query.mode ||
      query.region !== previous.query.region ||
      query.tier !== previous.query.tier ||
      query.position !== previous.query.position ||
      query.version !== previous.query.version
    if (!changed && !force && this._overview) {
      if (state.snapshot.activePage === null) {
        return true
      }
      const page = state.snapshot.pages[state.snapshot.activePage]
      return !page.stale || page.status === 'loading'
        ? true
        : this._requestPage(state.snapshot.activePage)
    }

    this._cancelJobs()
    this._cancelledPages.clear()
    this._dependenciesReady = false
    this._loaded.clear()
    const generation = state.snapshot.generation + 1
    const snapshot = state.snapshot
    this._publish({
      ...snapshot,
      generation,
      query,
      overviewState: {
        ...snapshot.overviewState,
        status: 'loading',
        error: null,
        stale: true,
        revision: ++this._sequence
      },
      pages: Object.fromEntries(
        Object.entries(snapshot.pages).map(([id, page]) => [
          id,
          { ...page, status: 'loading', error: null, stale: true, revision: ++this._sequence }
        ])
      )
    })
    const preferences: OpggChampionDataPreferences = {
      mode: query.mode,
      region: query.region,
      tier: query.tier,
      position: query.position
    }
    if (changed) {
      void settingService.set('opggPreferences', preferences).catch((error) => {
        logger.warn('Failed to save OP.GG preferences', formatError(error))
      })
    }
    this._ready = this._prepare(query, generation, force)
    if (!(await this._ready) || state.snapshot.generation !== generation) {
      return false
    }
    const ids = state.snapshot.openedChampions
      .filter((id) => !this._cancelledPages.has(id))
      .sort(
        (a, b) => Number(b === state.snapshot.activePage) - Number(a === state.snapshot.activePage)
      )
    const results = await Promise.all(ids.map((id) => this._requestPage(id)))
    return results.every(Boolean)
  }

  private async _prepare(query: OpggChampionDataQuery, generation: number, force: boolean) {
    try {
      const loaded = await this._queue.replace('read', 'overview', async ({ signal }) => {
        const resolved = await this._loader.resolveTarget(query, signal, force)
        signal.throwIfAborted()
        const overview =
          !force && this._overview && canReuseOverview(this._overview, resolved.target)
            ? this._overview
            : await this._loader.loadOverview(resolved.target, signal)
        signal.throwIfAborted()
        return { resolved, overview }
      })
      if (this._context.state.snapshot.generation !== generation) {
        return false
      }
      this._overview = loaded.overview
      this._dependenciesReady = true
      const snapshot = this._context.state.snapshot
      this._publish({
        ...snapshot,
        query: { ...snapshot.query, version: loaded.resolved.requestedVersion },
        version:
          loaded.resolved.target.mode === 'aram_mayhem' ? null : loaded.resolved.target.version,
        versions: loaded.resolved.versions,
        overview: this._cancelledPages.has(null)
          ? snapshot.overview
          : projectOverview(loaded.overview, query.position),
        overviewState: this._cancelledPages.has(null)
          ? snapshot.overviewState
          : { ...snapshot.overviewState, status: 'ready', error: null, stale: false }
      })
      return true
    } catch (error) {
      if (isAbortError(error) || this._context.state.snapshot.generation !== generation) {
        return false
      }
      const snapshot = this._context.state.snapshot
      const message = formatError(error)
      this._publish({
        ...snapshot,
        overviewState: { ...snapshot.overviewState, status: 'error', error: message, stale: true },
        pages: Object.fromEntries(
          Object.entries(snapshot.pages).map(([id, page]) => [
            id,
            { ...page, status: 'error', error: message, stale: true }
          ])
        )
      })
      this._context.logger.warn('OP.GG overview request failed', message)
      return false
    }
  }

  private async _requestPage(id: number): Promise<boolean> {
    const snapshot = this._context.state.snapshot
    const generation = snapshot.generation
    const page = snapshot.pages[id]
    if (!page) {
      return false
    }
    this._pending.get(id)?.resolve(false)
    const revision = ++this._sequence
    this._cancelledPages.delete(id)
    this._publish({
      ...snapshot,
      pages: {
        ...snapshot.pages,
        [id]: {
          ...page,
          status: 'loading',
          error: null,
          stale: true,
          revision
        }
      }
    })
    if (
      !(await this._ready) ||
      this._context.state.snapshot.generation !== generation ||
      this._context.state.snapshot.pages[id]?.revision !== revision
    ) {
      return false
    }
    const result = new Promise<boolean>((resolve) => {
      this._pending.set(id, { revision, resolve })
    })
    void this._drain(generation)
    return result
  }

  private async _drain(generation: number) {
    if (this._drainingGeneration === generation) {
      return
    }
    this._drainingGeneration = generation
    try {
      while (this._pending.size && this._context.state.snapshot.generation === generation) {
        const snapshot = this._context.state.snapshot
        const id =
          snapshot.activePage !== null && this._pending.has(snapshot.activePage)
            ? snapshot.activePage
            : snapshot.openedChampions.find((id) => this._pending.has(id))
        if (id === undefined) {
          break
        }
        const job = this._pending.get(id)!
        this._pending.delete(id)
        try {
          const overview = this._overview!
          const position = snapshot.query.position
          const champion = await this._queue.replace('read', `champion:${id}`, ({ signal }) =>
            this._loader.loadChampion(overview, id, position, signal)
          )
          const current = this._context.state.snapshot
          if (current.generation !== generation || current.pages[id]?.revision !== job.revision) {
            job.resolve(false)
            continue
          }
          if (champion) {
            this._loaded.set(id, { champion, position })
          } else {
            this._loaded.delete(id)
          }
          this._publish({
            ...current,
            pages: {
              ...current.pages,
              [id]: {
                ...current.pages[id],
                champion: champion ? this._project(champion, position) : null,
                status: 'ready',
                error: null,
                stale: false
              }
            }
          })
          job.resolve(true)
        } catch (error) {
          const current = this._context.state.snapshot
          if (
            !isAbortError(error) &&
            current.generation === generation &&
            current.pages[id]?.revision === job.revision
          ) {
            const message = formatError(error)
            this._publish({
              ...current,
              pages: {
                ...current.pages,
                [id]: {
                  ...current.pages[id],
                  status: 'error',
                  error: message,
                  stale: true
                }
              }
            })
            this._context.logger.warn('OP.GG champion request failed', message)
          }
          job.resolve(false)
        }
      }
    } finally {
      if (this._drainingGeneration === generation) {
        this._drainingGeneration = null
      }
    }
  }

  async refresh(id: number | null = this._context.state.snapshot.activePage): Promise<boolean> {
    if (!this._overview || !this._dependenciesReady) {
      return this.update({}, true)
    }
    this._cancelledPages.delete(id)
    if (id !== null) {
      this._queue.cancelById(`champion:${id}`)
      return this._requestPage(id)
    }
    const snapshot = this._context.state.snapshot
    const revision = ++this._sequence
    const generation = snapshot.generation
    this._publish({
      ...snapshot,
      overviewState: {
        ...snapshot.overviewState,
        status: 'loading',
        error: null,
        stale: true,
        revision
      }
    })
    try {
      const overview = await this._queue.replace('read', 'overview-refresh', ({ signal }) =>
        this._loader.loadOverview(this._overview!, signal)
      )
      const current = this._context.state.snapshot
      if (current.generation !== generation || current.overviewState.revision !== revision) {
        return false
      }
      this._overview = overview
      this._publish({
        ...current,
        overview: projectOverview(overview, current.query.position),
        overviewState: { ...current.overviewState, status: 'ready', error: null, stale: false }
      })
      return true
    } catch (error) {
      const current = this._context.state.snapshot
      if (
        !isAbortError(error) &&
        current.generation === generation &&
        current.overviewState.revision === revision
      ) {
        this._publish({
          ...current,
          overviewState: {
            ...current.overviewState,
            status: 'error',
            error: formatError(error),
            stale: true
          }
        })
      }
      return false
    }
  }

  private _project(champion: OpggLoadedChampion, position: OpggRankedPosition) {
    const { leagueClient, extraAssets, state } = this._context
    const resources: OpggProjectionResources = {
      aramBalance: state.aramBalance ?? [],
      augmentRarity: (id) => {
        let rarity: string | undefined = leagueClient.data.gameData.augments[id]?.rarity

        if (!rarity && extraAssets.gtimg.kiwiAugments) {
          rarity = extraAssets.gtimg.kiwiAugments.find((item) => item.augmentID === id)?.level
        }

        if (rarity === 'kSilver' || rarity === 'kGold' || rarity === 'kPrismatic') {
          return rarity
        }

        return null
      }
    }

    return projectDetails(champion, position, resources)
  }

  private _followQuery(): OpggChampionDataQueryUpdate | null {
    const { leagueClient } = this._context
    const session = leagueClient.data.champSelect.session
    const gameflow = leagueClient.data.gameflow.session
    if (!session || !gameflow) {
      return null
    }

    const self = session.myTeam.find((item) => item.cellId === session.localPlayerCellId)
    if (!self) {
      return null
    }

    const championId =
      session.actions
        .flat()
        .find(
          (action) =>
            action.actorCellId === self.cellId && action.type === 'pick' && action.championId
        )?.championId ?? self.championId
    if (
      !championId ||
      championId === -3 ||
      leagueClient.data.champSelect.disabledChampionIds.has(championId)
    ) {
      return null
    }

    const modes: Record<string, OpggChampionDataQuery['mode']> = {
      CLASSIC: 'ranked',
      ARAM: 'aram',
      KIWI: 'aram_mayhem',
      CHERRY: 'arena',
      NEXUSBLITZ: 'nexus_blitz',
      URF: 'urf',
      ARURF: 'urf'
    }
    const mode = modes[gameflow.gameData.queue.gameMode]
    if (!mode) {
      return null
    }

    const positions: Record<string, OpggChampionDataQuery['position']> = {
      top: 'top',
      jungle: 'jungle',
      middle: 'mid',
      bottom: 'adc',
      utility: 'support'
    }
    const position = positions[self.assignedPosition.toLowerCase()]
    if (mode === 'ranked' && position) {
      return { championId, mode, position }
    }

    return { championId, mode }
  }
}
