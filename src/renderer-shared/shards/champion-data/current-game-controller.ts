import { i18next } from '@renderer-shared/i18n'
import type { ChampionRunesConfig } from '@shared/shards/auto-champ-config'
import { resolveChampionPresetKey } from '@shared/shards/auto-champ-config/preset'
import type { CurrentGameUnavailableReason } from '@shared/shards/champion-data/automation'
import type { ChampionDataSourceId } from '@shared/types/champion-data'
import type { OpggChampionDataQuery } from '@shared/types/champion-data/opgg'
import { formatError } from '@shared/utils/errors'
import _ from 'lodash'
import { type WatchStopHandle, computed, shallowReactive, watch } from 'vue'

import { useAutoChampConfigStore } from '../auto-champ-config/store'
import { useLeagueClientStore } from '../league-client/store'
import { useChampionDataWindowStore } from '../window-manager/store'
import type { ChampionDataRendererContext, RuneAutomationStatus } from './context'
import type { OpggChampionDataController } from './opgg/data-controller'
import type { Qq101PagesController } from './qq101/pages-controller'
import type { Qq101HeroQuery } from './qq101/types'
import { RuneApplicationCancelled, RuneExecutor } from './rune-executor'
import { useChampionDataStore } from './store'

const RETAIN_PHASES = new Set(['ChampSelect', 'GameStart', 'InProgress', 'Reconnect'])
const MODES: Record<string, OpggChampionDataQuery['mode']> = {
  CLASSIC: 'ranked',
  ARAM: 'aram',
  KIWI: 'aram_mayhem',
  CHERRY: 'arena',
  NEXUSBLITZ: 'nexus_blitz',
  URF: 'urf',
  ARURF: 'urf'
}
const POSITIONS: Record<string, OpggChampionDataQuery['position']> = {
  top: 'top',
  jungle: 'jungle',
  middle: 'mid',
  bottom: 'adc',
  utility: 'support'
}

interface GameTarget {
  championId: number
  position: string
  gameMode: string
  queueType: string
  queueId: number
}

interface SelectionState {
  target: GameTarget
  locked: boolean
}

interface GameState {
  phase: 'paused' | 'ended' | 'champSelect' | 'inGame'
  target: GameTarget | null
}

type PageState =
  | { action: 'keep' }
  | {
      action: 'sync'
      opgg: { query: OpggChampionDataQuery; reason: CurrentGameUnavailableReason | null } | null
      qq101: {
        championId: number
        query: Qq101HeroQuery
        reason: CurrentGameUnavailableReason | null
      } | null
    }

interface RuneRecommendation {
  status: RuneAutomationStatus
  runes?: ChampionRunesConfig
  error?: string
}

interface RuneTask {
  cycle: number
  source: ChampionDataSourceId
  query: OpggChampionDataQuery | Qq101HeroQuery
  runes: ChampionRunesConfig
}

interface ApplicationState {
  status: RuneAutomationStatus
  error?: string
  task?: RuneTask
}

export class CurrentGameController {
  private readonly _watchers: WatchStopHandle[] = []
  private readonly _runtime = shallowReactive({
    target: null as GameTarget | null,
    cycle: 0,
    applied: false,
    manual: false,
    running: false,
    failure: null as string | null,
    disposed: false
  })

  constructor(
    private readonly _context: ChampionDataRendererContext,
    private readonly _opgg: OpggChampionDataController,
    private readonly _qq101: Qq101PagesController,
    private readonly _runes: RuneExecutor
  ) {}

  start() {
    const store = useChampionDataStore()
    const client = useLeagueClientStore()

    // Raw selection -> lifecycle -> page queries. Timers, teammates and stale game IDs
    // do not change the derived state that reaches the side effects.
    const selection = computed(() =>
      client.gameflow.phase === 'ChampSelect' ? this._selection() : null
    )
    const game = computed<GameState>((previous) => {
      const current = this._readGame(selection.value?.target ?? null)
      return previous && _.isEqual(current, previous) ? previous : current
    })
    const pages = computed<PageState>((previous) => {
      const current = this._readPages(game.value)
      return previous && _.isEqual(current, previous) ? previous : current
    })

    // Only the available default source feeds automatic rune decisions.
    const defaultSource = computed(() => {
      const source = store.settings.sourcePreferences.defaultSource
      return source && store[source].enabled && store.settings.sourcePreferences.enabled[source]
        ? source
        : null
    })
    const blockedReason = computed(() =>
      this._baseStatus(selection.value, defaultSource.value, pages.value)
    )
    const recommendation = computed<RuneRecommendation>((previous) => {
      const current: RuneRecommendation = defaultSource.value
        ? this._recommendation(defaultSource.value, pages.value)
        : { status: 'sourceUnavailable' }
      return previous && _.isEqual(current, previous) ? previous : current
    })
    const runeTask = computed<RuneTask | null>((previous) => {
      if (blockedReason.value) return null

      const source = defaultSource.value
      const page = source && pages.value.action === 'sync' ? pages.value[source] : null
      const runes = recommendation.value.runes
      if (!source || !page || !runes) return null

      const current = { cycle: this._runtime.cycle, source, query: page.query, runes }
      return previous && _.isEqual(current, previous) ? previous : current
    })
    const application = computed<ApplicationState>(() => {
      if (blockedReason.value) return { status: blockedReason.value }
      if (this._runtime.failure) {
        return { status: 'applyError', error: this._runtime.failure }
      }
      if (this._runtime.running) return { status: 'applying' }

      const task = runeTask.value
      return task ? { status: 'applying', task } : recommendation.value
    })

    this._runes.onManualApplication = () => {
      if (store.currentGame.active) this._runtime.manual = true
    }

    // Each watcher owns one effect and consumes one final state.
    this._watchers.push(
      watch(game, (state) => this._syncGame(state), { immediate: true }),
      watch(pages, (state) => this._syncPages(state), { immediate: true }),
      watch(
        application,
        (state) => {
          store.currentGame.status = state.status
          store.currentGame.error = state.error ?? null
          if (state.task) this._applyRunes(state.task, () => runeTask.value === state.task)
        },
        { immediate: true }
      )
    )
  }

  dispose() {
    this._runtime.disposed = true
    this._watchers.splice(0).forEach((stop) => stop())
    this._runes.onManualApplication = null
    this._endGame()
    this._opgg.removeCurrentGamePage()
    this._qq101.removeCurrentGamePage()
  }

  retryApplication() {
    this._runtime.failure = null
  }

  private _selection(): SelectionState | null {
    const client = useLeagueClientStore()
    const session = client.champSelect.session
    const queue = client.gameflow.session?.gameData.queue
    if (!session || !queue || session.isSpectating) return null
    const self = (session.myTeam ?? []).find(
      (player) => player.cellId === session.localPlayerCellId
    )
    if (!self) return null

    const picks = (session.actions ?? [])
      .flat()
      .filter((action) => action.actorCellId === self.cellId && action.type === 'pick')
    // Match the client's pickAction/isDonePicking: unfinished actions take precedence,
    // and an assigned champion with no pick action is already determined by the system.
    const pick =
      picks.find((action) => !action.completed) ?? picks.find((action) => action.completed)

    return {
      target: {
        championId: self.championId,
        position: self.assignedPosition?.toLowerCase() ?? '',
        gameMode: queue.gameMode,
        queueType: queue.type,
        queueId: queue.id
      },
      locked: Array.isArray(session.actions) && (pick ? pick.completed : self.championId > 0)
    }
  }

  private _readGame(selection: GameTarget | null): GameState {
    const client = useLeagueClientStore()
    const phase = client.gameflow.phase
    if (!client.isConnected || !phase) {
      return { phase: 'paused', target: null }
    }

    // Only phases delimit the lifecycle: gameflow can retain the previous game's ID
    // until the current champion selection is about to enter GameStart.
    if (!RETAIN_PHASES.has(phase)) {
      return { phase: 'ended', target: null }
    }

    const game = client.gameflow.session?.gameData
    let target = phase === 'ChampSelect' ? selection : this._runtime.target
    if (!target && phase !== 'ChampSelect' && game?.queue) {
      const puuid = client.summoner.me?.puuid
      const self = [...(game.teamOne ?? []), ...(game.teamTwo ?? [])].find(
        (player) => player.puuid === puuid
      )
      const champion = (game.playerChampionSelections ?? []).find(
        (player) => player.puuid === puuid
      )
      if (self || champion)
        target = {
          championId: champion?.championId ?? self?.championId ?? 0,
          position: self?.selectedPosition?.toLowerCase() ?? '',
          gameMode: game.queue.gameMode,
          queueType: game.queue.type,
          queueId: game.queue.id
        }
    }

    return {
      phase: phase === 'ChampSelect' ? 'champSelect' : 'inGame',
      target
    }
  }

  private _syncGame(game: GameState) {
    if (game.phase === 'paused') return
    if (game.phase === 'ended') {
      this._endGame()
      return
    }

    const { target } = game
    if (!target) return

    const store = useChampionDataStore()
    const key = (value: GameTarget | null) =>
      value && `${value.championId}:${value.position}:${value.gameMode}:${value.queueId}`
    if (key(target) !== key(this._runtime.target)) {
      this._runtime.cycle++
      this._runtime.applied = false
      this._runtime.manual = false
      this._runtime.failure = null
    }
    this._runtime.target = target
    Object.assign(store.currentGame, {
      active: true,
      championId: Math.max(0, target.championId),
      position: target.position
    })
  }

  private _readPages(game: GameState): PageState {
    if (game.phase === 'ended') return { action: 'sync', opgg: null, qq101: null }
    const { target } = game
    if (game.phase === 'paused' || !target) return { action: 'keep' }
    if (target.championId <= 0) return { action: 'sync', opgg: null, qq101: null }

    const store = useChampionDataStore()
    const preferences = store.settings.automation
    const mode = target.queueId === 440 ? 'flex' : MODES[target.gameMode]
    const position = POSITIONS[target.position]
    const basicReason: CurrentGameUnavailableReason | null = !mode
      ? 'unsupportedMode'
      : (mode === 'ranked' || mode === 'flex') && !position
        ? 'missingPosition'
        : null

    const supportsQq101 = mode === 'ranked' || mode === 'flex' || mode === 'aram_mayhem'

    return {
      action: 'sync',
      opgg:
        store.opgg.enabled && store.settings.sourcePreferences.enabled.opgg
          ? {
              query: {
                championId: target.championId,
                mode: mode ?? 'ranked',
                position: position ?? 'top',
                version: null,
                ...preferences.opgg
              },
              reason: basicReason
            }
          : null,
      qq101:
        store.qq101.enabled && store.settings.sourcePreferences.enabled.qq101
          ? {
              championId: target.championId,
              query:
                mode === 'aram_mayhem'
                  ? { mode: 'aram_mayhem' }
                  : {
                      mode: 'ranked',
                      patch: '',
                      tier: preferences.qq101.tier,
                      position: position
                        ? target.position === 'utility'
                          ? 'SUPPORT'
                          : target.position.toUpperCase()
                        : null
                    },
              reason: supportsQq101 ? basicReason : 'unsupportedMode'
            }
          : null
    }
  }

  private _syncPages(pages: PageState) {
    if (pages.action === 'keep') return

    if (pages.opgg) {
      void this._opgg.syncCurrentGamePage(pages.opgg.query, pages.opgg.reason)
    } else this._opgg.removeCurrentGamePage()

    if (pages.qq101) {
      void this._qq101.syncCurrentGamePage(
        pages.qq101.championId,
        pages.qq101.query,
        pages.qq101.reason
      )
    } else this._qq101.removeCurrentGamePage()
  }

  private _endGame() {
    this._runtime.cycle++
    this._runtime.target = null
    this._runtime.applied = false
    this._runtime.manual = false
    this._runtime.failure = null
    Object.assign(useChampionDataStore().currentGame, {
      active: false,
      championId: 0,
      position: '',
      status: 'disabled',
      error: null
    })
  }

  private _baseStatus(
    selection: SelectionState | null,
    source: ChampionDataSourceId | null,
    pages: PageState
  ): RuneAutomationStatus | null {
    const target = this._runtime.target
    if (!target || this._runtime.disposed) return 'disabled'

    const store = useChampionDataStore()
    const client = useLeagueClientStore()
    const window = useChampionDataWindowStore()
    if (!client.isConnected) return 'disconnected'
    if (client.gameflow.phase !== 'ChampSelect') return 'inGame'
    if (target.championId <= 0) return 'waitingChampion'
    if (this._runtime.manual) return 'manual'
    if (this._runtime.applied) return 'applied'

    const presetStore = useAutoChampConfigStore()
    if (store.settings.automation.enabled && !presetStore.isReady) return 'loading'
    const presets = presetStore.settings
    const saved = presets.runesV2[target.championId]
    const presetKey = resolveChampionPresetKey(
      saved,
      target.gameMode,
      target.queueType,
      target.position
    )
    if (presets.enabled && presetKey && saved?.[presetKey]) return 'preset'

    if (!source) return 'sourceUnavailable'
    const page = pages.action === 'sync' ? pages[source] : null
    if (page?.reason) return page.reason
    if (!['CLASSIC', 'ARAM', 'URF', 'ARURF', 'NEXUSBLITZ'].includes(target.gameMode))
      return 'unsupportedMode'
    if (!store.settings.automation.enabled) return 'disabled'
    // Minimizing preserves show; an explicit hide clears it even while status is minimized.
    if (!window.show) return 'paused'
    if (
      !selection ||
      selection.target.championId !== target.championId ||
      selection.target.position !== target.position ||
      selection.target.gameMode !== target.gameMode ||
      selection.target.queueId !== target.queueId ||
      !selection.locked
    )
      return 'waitingLock'
    return null
  }

  private _recommendation(source: ChampionDataSourceId, pages: PageState): RuneRecommendation {
    if (pages.action === 'keep') return { status: 'loading' }

    if (source === 'opgg') {
      const page = this._opgg.currentGamePage
      const query = pages.opgg?.query
      // The loaded page resolves the latest version; the managed query keeps it implicit.
      if (!page || !query || !_.isEqual({ ...page.query, version: null }, query))
        return { status: 'loading' }
      if (page.status === 'error') return { status: 'loadError', error: page.error ?? undefined }
      if (page.stale || page.status !== 'ready') return { status: 'loading' }
      if (!page.champion || !('runes' in page.champion)) return { status: 'empty' }
      const runes = this._opgg.getRecommendedRunes()
      return { status: 'empty', runes }
    }

    const page = this._qq101.currentGamePage
    const target = pages.qq101
    const query = page?.query.mode === 'ranked' ? { ...page.query, patch: '' } : page?.query
    if (
      !page ||
      !target ||
      page.championId !== target.championId ||
      !_.isEqual(query, target.query)
    )
      return { status: 'loading' }
    if (page.modeChange.status === 'error')
      return { status: 'loadError', error: page.modeChange.message }
    const section = page.view?.mode === 'ranked' ? page.view.sections.runes : null
    if (section?.status === 'error') return { status: 'loadError', error: section.message }
    if (!section || section.status === 'loading' || section.status === 'idle')
      return { status: 'loading' }
    const runes = this._qq101.getRecommendedRunes()
    return { status: 'empty', runes }
  }

  private _applyRunes(task: RuneTask, isCurrent: () => boolean) {
    const name = `[${i18next.t('appName', { ns: 'common' })}] ${useLeagueClientStore().gameData.championName(this._runtime.target!.championId)}`
    this._runtime.running = true
    void this._runes
      .apply(task.runes, name, { automatic: true, isCurrent })
      .then(() => {
        if (task.cycle === this._runtime.cycle) this._runtime.applied = true
      })
      .catch((error) => {
        if (!(error instanceof RuneApplicationCancelled) && isCurrent()) {
          this._runtime.failure = formatError(error)
          this._context.logger.warn('Automatic rune application failed', this._runtime.failure)
        }
      })
      .finally(() => {
        this._runtime.running = false
      })
  }
}
