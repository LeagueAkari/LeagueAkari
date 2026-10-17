import {
  type OpggProjectionResources,
  projectDetails,
  projectOverview
} from '@shared/data-adapter/opgg/projection'
import type { OpggLoadedChampion, OpggLoadedOverview } from '@shared/data-adapter/opgg/types'
import { createOpggSnapshot } from '@shared/shards/champion-data'
import type {
  OpggChampionDataQuery,
  OpggChampionDataQueryUpdate,
  OpggChampionDataSnapshot
} from '@shared/types/champion-data/opgg'
import type { OpggFlashPosition } from '@shared/types/champion-data/opgg'
import type { OpggRankedPosition } from '@shared/types/opgg'
import { formatError } from '@shared/utils/errors'
import { QueueKeeper, isAbortError } from '@shared/utils/queue-keeper'
import { type WatchStopHandle, watch } from 'vue'

import type { OpggApplySelection, OpggRendererContext } from './context'
import type { OpggChampionDataLoader } from './data-loader'
import { OpggLoadoutExecutor } from './loadout-executor'

export class OpggChampionDataController {
  private readonly _queue = new QueueKeeper([{ id: 'read', options: { concurrency: 1 } }])
  private _sequence = 0
  private _pageSequence = 0
  private readonly _overviews = new Map<string, OpggLoadedOverview>()
  private readonly _loaded = new Map<
    number,
    { champion: OpggLoadedChampion; position: OpggRankedPosition }
  >()

  constructor(
    private readonly _context: OpggRendererContext,
    private readonly _loader: OpggChampionDataLoader
  ) {}

  private readonly _watchers: WatchStopHandle[] = []

  start() {
    const { state, settings, extraAssets, leagueClient } = this._context
    this._publish(createOpggSnapshot(settings.opggPreferences))
    this._watchers.push(
      watch(
        () => this._enabled(),
        (enabled) => {
          if (!enabled) {
            this.cancelAll(true)
            return
          }

          const follow = this._followQuery()
          void this.updateQuery(follow ?? {}, true, Boolean(follow))
        },
        { immediate: true, flush: 'sync' }
      )
    )
    this._watchers.push(
      watch(
        () => JSON.stringify(this._followQuery()),
        (serialized) => {
          const query = JSON.parse(serialized) as OpggChampionDataQueryUpdate | null
          if (query && this._enabled()) {
            void this.updateQuery(query, false, true)
          }
        },
        { flush: 'sync' }
      )
    )
    this._watchers.push(
      watch(
        () => [state.aramBalance, extraAssets.gtimg.kiwiAugments, leagueClient.gameData.augments],
        () => {
          const snapshot = state.snapshot
          const pages = { ...snapshot.pages }
          for (const [id, loaded] of this._loaded) {
            if (pages[id]?.status === 'ready' && !pages[id].stale) {
              pages[id] = {
                ...pages[id],
                champion: this._project(loaded.champion, loaded.position)
              }
            }
          }

          this._publish({ ...snapshot, pages })
        },
        { flush: 'sync' }
      )
    )
  }

  update(query: OpggChampionDataQueryUpdate, pageId?: number | null) {
    return this.updateQuery(query, false, false, pageId)
  }

  setFlashPosition(value: OpggFlashPosition): Promise<void> {
    return this._context.ipc.call('champion-data-main', 'setOpggFlashPosition', value)
  }

  apply(request: OpggApplySelection) {
    return new OpggLoadoutExecutor(this._context).apply(request)
  }

  cancel(id: number | null) {
    this.cancelPage(id)
  }

  private _publish(snapshot: OpggChampionDataSnapshot) {
    const active =
      snapshot.activePage === null ? snapshot.overviewState : snapshot.pages[snapshot.activePage]
    this._context.state.snapshot = {
      ...snapshot,
      query: active.query,
      version: active.version,
      versions: active.versions,
      status: active.status,
      error: active.error,
      champion: snapshot.activePage === null ? null : snapshot.pages[snapshot.activePage].champion
    }
  }

  private _page(id: number | null) {
    const snapshot = this._context.state.snapshot
    return id === null ? snapshot.overviewState : snapshot.pages[id]
  }

  private _setPage(
    id: number | null,
    patch: Partial<import('@shared/types/champion-data/opgg').OpggChampionPage>
  ) {
    const snapshot = this._context.state.snapshot
    if (id === null) {
      this._publish({ ...snapshot, overviewState: { ...snapshot.overviewState, ...patch } })
    } else if (snapshot.pages[id]) {
      this._publish({
        ...snapshot,
        pages: { ...snapshot.pages, [id]: { ...snapshot.pages[id], ...patch } }
      })
    }
  }

  private _enabled() {
    return this._context.state.enabled && this._context.settings.sourcePreferences.enabled.opgg
  }

  async open(
    championId: number,
    originId: number | null = this._context.state.snapshot.activePage,
    update: OpggChampionDataQueryUpdate = {}
  ) {
    if (!this._enabled()) return false
    if (!Number.isInteger(championId) || championId <= 0) throw new Error('Invalid champion ID')

    const origin = this._page(originId)
    if (!origin) return false

    const query = this._mergeQuery(origin.query, { ...update, championId })
    const snapshot = this._context.state.snapshot
    const existing = snapshot.openedPages.find((id) => sameQuery(snapshot.pages[id].query, query))
    if (existing !== undefined) return this.activate(existing)
    if (snapshot.openedPages.length >= 20) return false

    const id = ++this._pageSequence
    this._publish({
      ...snapshot,
      activePage: id,
      openedPages: [...snapshot.openedPages, id],
      pages: {
        ...snapshot.pages,
        [id]: {
          query,
          version: query.version,
          versions: [...origin.versions],
          champion: null,
          status: 'idle',
          error: null,
          revision: ++this._sequence,
          stale: true
        }
      }
    })

    return this._request(id)
  }

  activate(id: number | null): Promise<boolean> {
    if (!this._enabled() || !this._page(id)) return Promise.resolve(false)

    this._publish({ ...this._context.state.snapshot, activePage: id })
    const page = this._page(id)
    if (page.status === 'loading') return Promise.resolve(true)

    return page.stale ? this._request(id) : Promise.resolve(true)
  }

  async close(id: number) {
    const snapshot = this._context.state.snapshot
    const index = snapshot.openedPages.indexOf(id)
    if (index < 0) return

    this._queue.cancelById('page:' + id)
    this._loaded.delete(id)
    const openedPages = snapshot.openedPages.filter((value) => value !== id)
    const pages = { ...snapshot.pages }
    delete pages[id]
    this._publish({
      ...snapshot,
      openedPages,
      pages,
      activePage:
        snapshot.activePage === id
          ? (openedPages[index] ?? openedPages[index - 1] ?? null)
          : snapshot.activePage
    })
  }

  async reorder(ids: number[]) {
    const snapshot = this._context.state.snapshot
    if (
      ids.length !== snapshot.openedPages.length ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !snapshot.pages[id])
    )
      throw new Error('Invalid OP.GG tab order')

    this._publish({ ...snapshot, openedPages: [...ids] })
  }

  cancelAll(clear = false) {
    this._queue.cancelAll()
    this._loaded.clear()
    this._overviews.clear()
    if (clear) {
      this._loader.clear()
    }

    const snapshot = this._context.state.snapshot
    this._publish({
      ...snapshot,
      generation: snapshot.generation + 1,
      overview: clear ? null : snapshot.overview,
      overviewState: {
        ...snapshot.overviewState,
        status: 'idle',
        error: null,
        stale: true,
        revision: ++this._sequence
      },
      pages: Object.fromEntries(
        Object.entries(snapshot.pages).map(([id, page]) => [
          id,
          {
            ...page,
            champion: clear ? null : page.champion,
            status: 'idle',
            error: null,
            stale: true,
            revision: ++this._sequence
          }
        ])
      )
    })
  }

  cancelPage(id: number | null) {
    this._queue.cancelById('page:' + id)
    this._setPage(id, { status: 'idle', error: null, stale: true, revision: ++this._sequence })
  }

  dispose() {
    this._watchers.splice(0).forEach((stop) => stop())
    this.cancelAll(true)
  }

  private _mergeQuery(previous: OpggChampionDataQuery, update: OpggChampionDataQueryUpdate) {
    const query = { ...previous, ...update }
    if (
      (query.mode !== previous.mode || query.region !== previous.region) &&
      update.version === undefined
    ) {
      query.version = null
    }

    return query
  }

  async updateQuery(
    update: OpggChampionDataQueryUpdate,
    force = false,
    follow = false,
    id: number | null = this._context.state.snapshot.activePage
  ): Promise<boolean> {
    if (!this._enabled()) return false

    if (follow) {
      this._publish({
        ...this._context.state.snapshot,
        followSelectionId: this._context.state.snapshot.followSelectionId + 1
      })
    }

    if (update.championId != null) return this.open(update.championId, id, update)

    if (update.championId === null) {
      id = null
      this._publish({ ...this._context.state.snapshot, activePage: null })
    }

    const page = this._page(id)
    if (!page) return false

    const query = this._mergeQuery(page.query, update)
    const changed = !sameQuery(page.query, query)
    if (!changed && !force && !page.stale) return true

    this._setPage(id, { query, version: query.version })
    if (id === null && changed) {
      const { mode, region, tier, position } = query
      void this._context.ipc
        .call('champion-data-main', 'setOpggPreferences', { mode, region, tier, position })
        .catch((error) =>
          this._context.logger.warn('Failed to save OP.GG preferences', formatError(error))
        )
    }

    return this._request(id, force)
  }

  refresh(id: number | null = this._context.state.snapshot.activePage) {
    return this._request(id, true)
  }

  private _request(id: number | null, force = false): Promise<boolean> {
    if (!this._enabled() || !this._page(id)) return Promise.resolve(false)

    const revision = ++this._sequence
    const generation = this._context.state.snapshot.generation
    const query = { ...this._page(id).query }
    this._setPage(id, { status: 'loading', error: null, stale: true, revision })

    const current = () =>
      this._context.state.snapshot.generation === generation &&
      this._page(id)?.revision === revision

    const request = this._queue
      .replace('read', 'page:' + id, async ({ signal }) => {
        const resolved = await this._loader.resolveTarget(query, signal, force && id === null)
        signal.throwIfAborted()
        const key = JSON.stringify(resolved.target)
        let overview = this._overviews.get(key)
        if (!overview || (force && id === null)) {
          overview = await this._loader.loadOverview(resolved.target, signal)
          signal.throwIfAborted()
          if (!current()) return false

          this._overviews.set(key, overview)
          // Bound the session cache; open pages retain their rendered data.
          if (this._overviews.size > 24) {
            this._overviews.delete(this._overviews.keys().next().value!)
          }
        }

        const version = resolved.target.mode === 'aram_mayhem' ? null : resolved.target.version
        const champion =
          id === null
            ? null
            : await this._loader.loadChampion(overview, query.championId!, query.position, signal)
        signal.throwIfAborted()
        if (!current()) return false

        const patch = {
          query: { ...query, version },
          version,
          versions: resolved.versions,
          status: 'ready' as const,
          error: null,
          stale: false
        }
        if (id === null) {
          this._publish({
            ...this._context.state.snapshot,
            overview: projectOverview(overview, query.position),
            overviewState: { ...this._page(null), ...patch }
          })
        } else {
          if (champion) {
            this._loaded.set(id, { champion, position: query.position })
          } else {
            this._loaded.delete(id)
          }

          this._setPage(id, {
            ...patch,
            champion: champion ? this._project(champion, query.position) : null
          })
        }

        return true
      })
      .catch((error) => {
        if (!isAbortError(error) && current()) {
          this._setPage(id, { status: 'error', error: formatError(error), stale: true })
          this._context.logger.warn('OP.GG page request failed', formatError(error))
        }

        return false
      })

    return request
  }

  private _project(champion: OpggLoadedChampion, position: OpggRankedPosition) {
    const { leagueClient, extraAssets, state } = this._context
    const resources: OpggProjectionResources = {
      aramBalance: state.aramBalance ?? [],
      augmentRarity: (id) => {
        let rarity: string | undefined = leagueClient.gameData.augments[id]?.rarity

        if (!rarity && extraAssets.gtimg.kiwiAugments) {
          rarity =
            extraAssets.gtimg.kiwiAugments.find((item) => item.augmentID === id)?.level ?? undefined
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
    const session = leagueClient.champSelect.session
    const gameflow = leagueClient.gameflow.session
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
      leagueClient.champSelect.disabledChampionIds.has(championId)
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
    const mode =
      gameflow.gameData.queue.id === 440 ? 'flex' : modes[gameflow.gameData.queue.gameMode]
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
    if ((mode === 'ranked' || mode === 'flex') && position) {
      return { championId, mode, position }
    }

    return { championId, mode }
  }
}

function sameQuery(a: OpggChampionDataQuery, b: OpggChampionDataQuery) {
  return (
    a.championId === b.championId &&
    a.mode === b.mode &&
    a.region === b.region &&
    a.tier === b.tier &&
    a.position === b.position &&
    a.version === b.version
  )
}
