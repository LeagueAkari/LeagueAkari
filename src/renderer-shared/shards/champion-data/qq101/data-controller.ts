import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { formatError } from '@shared/utils/errors'
import { isAbortError } from '@shared/utils/queue-keeper'
import { type WatchStopHandle, watch } from 'vue'

import { CHAMPION_DATA_MAIN_NAMESPACE, type ChampionDataRendererContext } from '../context'
import { useChampionDataStore } from '../store'
import type { Qq101ChampionDataLoader } from './data-loader'

export class Qq101ChampionDataController {
  private _generation = 0
  private _stopWatching: WatchStopHandle | null = null
  private _abortController: AbortController | null = null
  private _preferencesWrite: Promise<void> = Promise.resolve()

  constructor(
    private readonly _context: ChampionDataRendererContext,
    private readonly _loader: Qq101ChampionDataLoader
  ) {}

  private get _state() {
    return useChampionDataStore().qq101
  }

  start() {
    this._stopWatching = watch(
      () => this._state.enabled,
      (enabled) => {
        if (!enabled) {
          this.cancel()
          Object.assign(this._state, {
            patches: [],
            overview: null,
            details: null,
            selectedChampionId: null,
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

  selectChampion(championId: number) {
    return this._load(undefined, championId)
  }

  cancel() {
    this._generation += 1
    this._abortController?.abort()
    this._abortController = null
    this._state.isLoading = false
  }

  private async _load(
    preferencesUpdate?: Partial<Qq101ChampionDataPreferences>,
    championId?: number
  ): Promise<boolean> {
    if (!this._state.enabled) {
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

      const selectedChampionId = championId ?? null
      const details = selectedChampionId
        ? await this._loader.loadDetails(
            preferences,
            loaded.overview,
            selectedChampionId,
            abortController.signal
          )
        : null

      abortController.signal.throwIfAborted()

      if (generation !== this._generation || !this._state.enabled) {
        return false
      }

      // Keep writes ordered too: a superseded IPC call may still be saving to storage.
      const write = this._preferencesWrite.then(async () => {
        if (generation !== this._generation || !this._state.enabled) {
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

      if (generation !== this._generation || !this._state.enabled) {
        return false
      }

      Object.assign(this._state, {
        patches: loaded.patches,
        overview: loaded.overview,
        details,
        selectedChampionId,
        loadedPreferences: preferences,
        requestedPreferences: preferences,
        error: null
      })

      return true
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
