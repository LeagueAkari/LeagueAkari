import type { ChampionAugment, ChampionDataDetails } from '@shared/data-adapter/champion-data'
import type {
  HextechAugmentLabel,
  OcrFrame,
  RecognizedAugment
} from '@shared/types/hextech-augment'
import { reaction, runInAction } from 'mobx'

import type { ChampionDataMain } from '../champion-data'
import type { LeagueClientMain } from '../league-client'
import type { AkariLogger } from '../logger-factory'
import type { AkariHextechAugmentWindow } from '../window-manager/hextech-augment-window/window'
import { recognizeAugmentCards } from './card-recognition'
import {
  RecognitionWorkerController,
  type RecognitionWorkerMessage
} from './recognition-worker-controller'
import type { HextechAugmentSettings, HextechAugmentState } from './state'

const MAX_FRAME_AGE_MS = 3000
const DISPLAY_TIMEOUT_MS = 4000
const MAX_MISSED_FRAMES = 2
const RATINGS_TTL_MS = 10 * 60 * 1000
const TIER_NAMES = ['S', 'A', 'B', 'C', 'D', 'E', 'F']

export class HextechAugmentOverlayController {
  private readonly _worker: RecognitionWorkerController
  private _disposeReaction: (() => void) | null = null
  private _timer: ReturnType<typeof setInterval> | null = null
  private _captureTimer: ReturnType<typeof setTimeout> | null = null
  private _expiry: ReturnType<typeof setTimeout> | null = null
  private _ratingsAbort: AbortController | null = null
  private _championId = 0
  private _generation = 0
  private _details: ChampionDataDetails | null = null
  private _fetchedAt: number | null = null
  private _latest: { frame: OcrFrame; cards: RecognizedAugment[]; expiresAt: number } | null = null
  private _failed = false
  private _retryRatingsAt = 0
  private _absentFrames = 0
  private _missedFrames = 0

  constructor(
    private readonly _leagueClient: LeagueClientMain,
    private readonly _championData: ChampionDataMain,
    private readonly _window: AkariHextechAugmentWindow,
    private readonly _settings: HextechAugmentSettings,
    private readonly _state: HextechAugmentState,
    private readonly _logger: AkariLogger
  ) {
    this._worker = new RecognitionWorkerController((message) => this._handleMessage(message))
  }

  watch() {
    this._disposeReaction = reaction(
      () => {
        const session = this._leagueClient.data.gameflow.session
        const ownPuuid = this._leagueClient.data.summoner.me?.puuid
        const selections = session
          ? [
              ...session.gameData.playerChampionSelections,
              ...session.gameData.teamOne,
              ...session.gameData.teamTwo
            ]
          : []
        const championId = ownPuuid
          ? (selections.find(
              (selection) => selection.puuid === ownPuuid && selection.championId > 0
            )?.championId ?? 0)
          : 0
        return {
          enabled: this._settings.enabled,
          active:
            process.platform === 'win32' &&
            this._leagueClient.state.connectionState === 'connected' &&
            this._leagueClient.data.gameflow.phase === 'InProgress' &&
            (session?.gameData.queue.gameMode === 'KIWI' || session?.map.gameMode === 'KIWI'),
          championId,
          source: this._championData.settings.preferredSource,
          preferences: this._championData.settings.preferences
        }
      },
      ({ enabled, active, championId }) => {
        this._stop()
        if (!enabled || !active || !championId) {
          runInAction(() => {
            this._state.status = enabled ? 'waiting' : 'disabled'
            this._state.error = null
          })
          return
        }
        this._championId = championId
        this._failed = false
        runInAction(() => {
          this._state.status = 'starting'
          this._state.error = null
        })
        this._worker.start()
        void this._loadRatings(this._generation, championId)
        this._timer = setInterval(() => {
          if (this._failed) return
          if (
            !this._ratingsAbort &&
            Date.now() >= this._retryRatingsAt &&
            (!this._fetchedAt || Date.now() - this._fetchedAt > RATINGS_TTL_MS)
          ) {
            this._details = null
            this._publish()
            void this._loadRatings(this._generation, championId)
          }
        }, 300)
      },
      {
        fireImmediately: true,
        equals: (previous, next) =>
          previous.enabled === next.enabled &&
          previous.active === next.active &&
          previous.championId === next.championId &&
          previous.source === next.source &&
          previous.preferences === next.preferences
      }
    )
  }

  private _handleMessage(message: RecognitionWorkerMessage) {
    if (!this._championId || !this._settings.enabled) return
    if (this._captureTimer) clearTimeout(this._captureTimer)
    this._captureTimer = null
    if (message.type === 'ready') {
      runInAction(() => {
        this._state.status = 'scanning'
      })
      this._worker.capture(true)
      return
    }
    if (message.type === 'error') {
      this._failed = true
      this._clear()
      runInAction(() => {
        this._state.status = 'error'
        this._state.error = message.message
      })
      this._logger.warn('Augment recognition unavailable', { message: message.message })
      this._worker.stop()
      return
    }
    if (message.type === 'hidden') {
      this._clear()
      this._scheduleCapture(300)
      runInAction(() => {
        this._state.status = 'background'
      })
      return
    }
    if (Date.now() - message.capturedAt > MAX_FRAME_AGE_MS) {
      this._scheduleCapture(600)
      return
    }
    if (message.type === 'absent') {
      this._scheduleCapture(300)
      // Confirm disappearance twice without waiting for OCR miss retries.
      this._absentFrames += 1
      if (this._absentFrames >= 2) this._clear()
      return
    }
    this._absentFrames = 0
    const cards = recognizeAugmentCards(
      message,
      Object.values(this._leagueClient.data.gameData.augments).map((augment) => ({
        id: augment.id,
        name: augment.nameTRA,
        augmentNameId: augment.augmentNameId
      }))
    )
    if (cards.length < 2 && message.focused !== false) {
      this._worker.capture(false, [], true)
      return
    }
    this._scheduleCapture(message.reused ? 300 : 600)
    if (cards.length < 2) {
      this._missedFrames += 1
      if (this._missedFrames >= MAX_MISSED_FRAMES) this._clear()
      runInAction(() => {
        this._state.status = this._latest ? 'scanning' : 'unrecognized'
      })
      return
    }
    // Always replace the whole selection. A rerolled card cannot retain a previous card's score.
    this._missedFrames = 0
    const expiresAt = message.capturedAt + DISPLAY_TIMEOUT_MS
    this._latest = { frame: message, cards, expiresAt }
    this._publish()
    if (this._expiry) clearTimeout(this._expiry)
    this._expiry = setTimeout(() => this._clear(), Math.max(0, expiresAt - Date.now()))
  }

  private _scheduleCapture(delay: number) {
    this._captureTimer = setTimeout(() => {
      this._captureTimer = null
      if (this._failed || !this._championId || !this._settings.enabled) return
      const latest = this._latest
      const regions =
        latest && latest.cards.length === 3 && this._missedFrames === 0
          ? latest.cards.map((card) => {
              // Include longer replacement titles while excluding animated card borders.
              const width = Math.max(
                latest.frame.window.width * 0.18,
                card.width + latest.frame.window.width * 0.02
              )
              return {
                x: card.x + card.width / 2 - width / 2,
                y: card.y - latest.frame.window.height * 0.01,
                width,
                height: card.height + latest.frame.window.height * 0.02
              }
            })
          : []
      this._worker.capture(true, regions)
    }, delay)
  }

  private async _loadRatings(generation: number, championId: number) {
    const abort = new AbortController()
    this._retryRatingsAt = Date.now() + 30000
    this._ratingsAbort = abort
    try {
      const preferences = this._championData.settings.preferences
      const result = await this._championData.loadDetails(
        { ...preferences, mode: 'aram_mayhem', position: 'none' },
        championId,
        { signal: abort.signal }
      )
      if (
        abort.signal.aborted ||
        generation !== this._generation ||
        championId !== this._championId
      )
        return
      this._details =
        result.status === 'success' && result.data.championId === championId ? result.data : null
      this._fetchedAt = this._details ? Date.now() : null
      this._publish()
    } catch (error) {
      if (!abort.signal.aborted)
        this._logger.warn(
          'Augment ratings unavailable',
          error instanceof Error ? error.message : String(error)
        )
    } finally {
      if (this._ratingsAbort === abort) this._ratingsAbort = null
    }
  }

  private _publish() {
    const latest = this._latest
    if (!latest || Date.now() >= latest.expiresAt) return
    const details =
      this._details &&
      this._details.championId === this._championId &&
      this._fetchedAt &&
      Date.now() - this._fetchedAt <= RATINGS_TTL_MS
        ? this._details
        : null
    const ratings = new Map<number, ChampionAugment>(
      (details?.sections.augments ?? []).map((augment) => [augment.augmentId, augment])
    )
    const snapshot = {
      championId: this._championId,
      capturedAt: latest.frame.capturedAt,
      expiresAt: latest.expiresAt,
      window: latest.frame.window,
      labels: Array.from({ length: 3 }, (_, slot): HextechAugmentLabel => {
        const card = latest.cards.find((candidate, index) => (candidate.slot ?? index) === slot)
        if (!card) {
          return {
            id: null,
            name: '',
            slot: slot as 0 | 1 | 2,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            tier: null
          }
        }
        const rating = ratings.get(card.id)
        const performanceScore = rating?.performanceScore
        const scores = [...ratings.values()]
          .filter((candidate) => candidate.tier === rating?.tier)
          .map((candidate) => candidate.performanceScore)
          .filter((score): score is number => typeof score === 'number' && Number.isFinite(score))
        const tierRank =
          rating?.tier != null &&
          typeof performanceScore === 'number' &&
          Number.isFinite(performanceScore)
            ? 1 + scores.filter((score) => score > performanceScore).length
            : null
        return {
          ...card,
          tierRank,
          tierCount: scores.length,
          tier:
            rating?.tier === null || rating?.tier === undefined
              ? null
              : (TIER_NAMES[rating.tier] ?? null)
        }
      })
    }
    runInAction(() => {
      this._state.snapshot = snapshot
      this._state.status = 'cards'
    })
    this._window.present(snapshot)
  }

  private _clear() {
    this._latest = null
    this._absentFrames = 0
    this._missedFrames = 0
    if (this._expiry) clearTimeout(this._expiry)
    this._expiry = null
    runInAction(() => {
      this._state.snapshot = null
      if (this._state.status === 'cards') this._state.status = 'scanning'
    })
    this._window.present(null)
  }

  private _stop() {
    this._generation += 1
    this._championId = 0
    if (this._captureTimer) clearTimeout(this._captureTimer)
    this._captureTimer = null
    this._worker.stop()
    if (this._timer) clearInterval(this._timer)
    this._timer = null
    this._ratingsAbort?.abort()
    this._ratingsAbort = null
    this._details = null
    this._fetchedAt = null
    this._retryRatingsAt = 0
    this._clear()
  }

  dispose() {
    this._disposeReaction?.()
    this._disposeReaction = null
    this._stop()
    this._window.close(true)
  }
}
