import type { Qq101PairQuery } from '@shared/http-api-axios-helper/qq101'
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { formatError } from '@shared/utils/errors'
import { isAbortError } from '@shared/utils/queue-keeper'
import { type WatchStopHandle, watch } from 'vue'

import { CHAMPION_DATA_MAIN_NAMESPACE, type ChampionDataRendererContext } from '../context'
import { useChampionDataStore } from '../store'
import type { Qq101ChampionDataLoader } from './data-loader'
import { Qq101PagesController } from './pages-controller'

export class Qq101ChampionDataController {
  readonly pages: Qq101PagesController
  private _generation = 0
  private _stopWatching: WatchStopHandle | null = null
  private _abortController: AbortController | null = null
  private _preferencesWrite: Promise<void> = Promise.resolve()

  constructor(
    private readonly _context: ChampionDataRendererContext,
    private readonly _loader: Qq101ChampionDataLoader
  ) {
    this.pages = new Qq101PagesController(_context, _loader)
  }

  private get _state() {
    return useChampionDataStore().qq101
  }

  private get _enabled() {
    return this._state.enabled && useChampionDataStore().settings.sourcePreferences.enabled.qq101
  }

  start() {
    this._stopWatching = watch(
      () => this._enabled,
      (enabled) => {
        if (!enabled) {
          this.cancel()
          Object.assign(this._state, {
            patches: [],
            overview: null,

            requestedPreferences: null,
            loadedPreferences: null,
            error: null
          })

          return
        }

        void this.refresh()
      },
      { flush: 'sync', immediate: true }
    )
  }

  dispose() {
    this._stopWatching?.()
    this.cancel()
  }

  refresh() {
    return this._load()
  }

  changePreferences(update: Partial<Qq101ChampionDataPreferences>) {
    return this._load(update)
  }

  changeMode(mode: Qq101ChampionDataPreferences['mode']) {
    return this._load({ mode, patch: null, position: 'all' })
  }

  changePosition(position: Qq101ChampionDataPreferences['position']) {
    return this._load({ position })
  }

  changePatch(patch: string | null) {
    return this._load({ patch })
  }

  changeTier(tier: number) {
    return this._load({ tier })
  }

  selectChampion(championId: number, position?: string, originId?: string) {
    return this.pages.openChampion(championId, position, originId)
  }

  queryPairs(query: Qq101PairQuery) {
    return this.pages.openPairs(query)
  }

  cancel() {
    this.pages.clear()
    this._generation += 1
    this._abortController?.abort()
    this._abortController = null
    this._state.isLoading = false
  }

  private async _load(preferencesUpdate?: Partial<Qq101ChampionDataPreferences>): Promise<boolean> {
    if (!this._enabled) {
      return false
    }

    const generation = ++this._generation
    this._abortController?.abort()

    const abortController = new AbortController()
    this._abortController = abortController

    this._state.isLoading = true
    this._state.error = null

    let preferences = {
      ...(this._state.requestedPreferences ?? useChampionDataStore().settings.qq101Preferences),
      ...preferencesUpdate
    }
    this._state.requestedPreferences = preferences

    try {
      const loaded = await this._loader.loadOverview(preferences, abortController.signal)
      preferences = { ...preferences, patch: loaded.patch }

      abortController.signal.throwIfAborted()

      if (generation !== this._generation || !this._enabled) {
        return false
      }

      // Keep writes ordered too: a superseded IPC call may still be saving to storage.
      const write = this._preferencesWrite.then(async () => {
        if (generation !== this._generation || !this._enabled) {
          return
        }

        await this._context.ipc.call(
          CHAMPION_DATA_MAIN_NAMESPACE,
          'setQq101Preferences',
          preferences
        )
      })
      this._preferencesWrite = write.catch(() => {})
      await write

      if (generation !== this._generation || !this._enabled) {
        return false
      }

      Object.assign(this._state, {
        patches: loaded.patches.length ? loaded.patches : this._state.patches,
        overview: loaded.overview,

        loadedPreferences: preferences,
        requestedPreferences: preferences,
        error: null
      })

      if (preferences.mode === 'classic') {
        // The ranking refresh already exposes loading. Keep the last lane labels
        // visible until their replacement arrives instead of collapsing every row.
        if (this._state.classicLanes.status !== 'ready') {
          this._state.classicLanes = { status: 'loading' }
        }

        await this._loader
          .loadClassicLanes(abortController.signal)
          .then((data) => {
            if (generation === this._generation && this._enabled) {
              this._state.classicLanes = data.champions.length
                ? { status: 'ready', data }
                : { status: 'empty' }
            }
          })
          .catch((error) => {
            if (generation === this._generation && !isAbortError(error)) {
              this._state.classicLanes = { status: 'error', message: formatError(error) }
              this._context.logger.warn('QQ101 classic lanes failed', formatError(error))
            }
          })
      }

      abortController.signal.throwIfAborted()
      return generation === this._generation
    } catch (error) {
      if (generation !== this._generation || isAbortError(error)) {
        return false
      }

      const message = formatError(error)
      this._state.error = message
      this._context.logger.warn('QQ101 champion data request failed', message)

      return false
    } finally {
      if (generation === this._generation) {
        this._abortController = null
        this._state.isLoading = false
      }
    }
  }
}
