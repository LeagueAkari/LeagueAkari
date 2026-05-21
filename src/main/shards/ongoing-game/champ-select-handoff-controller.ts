import { comparer } from 'mobx'

import {
  ChampSelectHandoffSnapshot,
  buildChampSelectHandoffSnapshot,
  isChampSelectHandoffSnapshot
} from './champ-select-handoff'
import type { OngoingGameMainContext } from './context'

const CHAMP_SELECT_HANDOFF_SNAPSHOT_KEY = 'champSelectHandoffSnapshot'

export class OngoingGameChampSelectHandoffController {
  constructor(private readonly _context: OngoingGameMainContext) {}

  async init() {
    const { logger, settingService, state } = this._context

    if (!this._isFeatureEnabled()) {
      await this._clearPersistedSnapshot()
      return
    }

    try {
      const snapshot: unknown = await settingService._getFromStorage(
        CHAMP_SELECT_HANDOFF_SNAPSHOT_KEY
      )

      if (!snapshot) {
        return
      }

      if (!isChampSelectHandoffSnapshot(snapshot)) {
        logger.warn('Invalid champ-select handoff snapshot in storage, clearing')
        await this._clearPersistedSnapshot()
        return
      }

      state.setChampSelectHandoffSnapshot(snapshot)
    } catch (error) {
      logger.warn('Failed to restore champ-select handoff snapshot', error)
    }
  }

  watch() {
    this._watchFeatureGate()
    this._watchSnapshotRecording()
    this._watchGameIdInvalidation()
  }

  private _watchFeatureGate() {
    const { mobxUtils } = this._context

    mobxUtils.reaction(
      () => this._isFeatureEnabled(),
      (enabled) => {
        if (!enabled) {
          this.clear()
        }
      },
      { fireImmediately: true }
    )
  }

  private _watchSnapshotRecording() {
    const { leagueClient, mobxUtils, remoteConfig, state } = this._context

    mobxUtils.reaction(
      () => {
        const config = remoteConfig.state.ongoingGameConfig

        if (!config.spotlight.deobfuscation || state.draft) {
          return null
        }

        if (state.queryStage.phase !== 'champ-select' || !leagueClient.data.champSelect.session) {
          return null
        }

        return buildChampSelectHandoffSnapshot(leagueClient.data.champSelect.session, config)
      },
      (snapshot) => {
        if (snapshot) {
          this._saveSnapshot(snapshot)
        }
      },
      { delay: 300, equals: comparer.structural, fireImmediately: true }
    )
  }

  private _watchGameIdInvalidation() {
    const { mobxUtils, state } = this._context

    mobxUtils.reaction(
      () => ({
        activeGameId:
          state.queryStage.gameInfo && 'gameId' in state.queryStage.gameInfo
            ? state.queryStage.gameInfo.gameId
            : null,
        snapshotGameId: state.champSelectHandoffSnapshot?.gameId ?? null
      }),
      ({ activeGameId, snapshotGameId }) => {
        if (activeGameId && snapshotGameId && activeGameId !== snapshotGameId) {
          this.clear()
        }
      },
      { equals: comparer.structural, fireImmediately: true }
    )
  }

  private async _saveSnapshot(snapshot: ChampSelectHandoffSnapshot) {
    const { logger, settingService, state } = this._context

    state.setChampSelectHandoffSnapshot(snapshot)

    try {
      await settingService._saveToStorage(CHAMP_SELECT_HANDOFF_SNAPSHOT_KEY, snapshot)
    } catch (error) {
      logger.warn('Failed to save champ-select handoff snapshot', error)
    }
  }

  async clear() {
    this._context.state.setChampSelectHandoffSnapshot(null)
    await this._clearPersistedSnapshot()
  }

  private async _clearPersistedSnapshot() {
    const { logger, settingService } = this._context

    try {
      await settingService._removeFromStorage(CHAMP_SELECT_HANDOFF_SNAPSHOT_KEY)
    } catch (error) {
      logger.warn('Failed to clear champ-select handoff snapshot', error)
    }
  }

  private _isFeatureEnabled() {
    return Boolean(this._context.remoteConfig.state.ongoingGameConfig.spotlight.deobfuscation)
  }
}
