import { NATIVE_SUPPORT, nativeInput } from '@main/native'
import { GameClientMain } from '@main/shards/game-client'
import { AkariIpcError } from '@main/shards/ipc'
import icon from '@resources/LA_ICON.ico?asset'
import { sleep } from '@shared/utils/sleep'
import { comparer, computed } from 'mobx'

import { BaseAkariWindow } from '../base-akari-window'
import type { WindowManagerMainContext } from '../context'
import { CdTimerWindowSettings, CdTimerWindowState } from './state'

export class AkariCdTimerWindow extends BaseAkariWindow<CdTimerWindowState, CdTimerWindowSettings> {
  static readonly NAMESPACE_SUFFIX = 'cd-timer-window'
  static readonly HTML_ENTRY = 'cd-timer-window.html'
  static readonly TITLE = 'Timer'
  static readonly BASE_WIDTH = 100 // 100 for auto resize
  static readonly BASE_HEIGHT = 220 // 220 for 5 players (as default)
  static readonly MIN_WIDTH = 100
  static readonly MIN_HEIGHT = 100
  static readonly GAME_STATS_POLL_INTERVAL = 4000

  static readonly ENTER_KEY_CODE = 13
  static readonly ENTER_KEY_INTERNAL_DELAY = 20
  static readonly INPUT_DELAY = 65

  public shortcutTargetId: string

  private _gameStatsPollTimer: NodeJS.Timeout | null = null

  private _applyOverlayWindowBehavior() {
    if (!this._window || this._window.isDestroyed()) {
      return
    }

    // 默认穿透给游戏；renderer 侧通过 mouseenter/mouseleave 动态切换 setIgnoreMouseEvents。
    // focusable: true + type:'panel' 保证点击时 Windows 走正常激活序列（游戏仅失活，不最小化）。
    this._window.setSkipTaskbar(true)
    this._window.setAlwaysOnTop(true, 'screen-saver', 1)
    this._window.setIgnoreMouseEvents(true, { forward: true })
  }

  constructor(_context: WindowManagerMainContext) {
    const state = new CdTimerWindowState()
    const settings = new CdTimerWindowSettings()

    super(_context, AkariCdTimerWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariCdTimerWindow.BASE_WIDTH,
      baseHeight: AkariCdTimerWindow.BASE_HEIGHT,
      minWidth: AkariCdTimerWindow.BASE_WIDTH,
      minHeight: AkariCdTimerWindow.BASE_HEIGHT,
      htmlEntry: AkariCdTimerWindow.HTML_ENTRY,
      rememberPosition: true,
      rememberSize: false,
      repositionWindowIfInvisible: true,
      settingSchema: {
        pinned: {
          default: settings.pinned,
          transform: () => true
        },
        enabled: { default: settings.enabled },
        showShortcut: { default: settings.showShortcut },
        timerType: { default: settings.timerType },
        reverseAdjustmentDirection: { default: settings.reverseAdjustmentDirection }
      },
      browserWindowOptions: {
        title: AkariCdTimerWindow.TITLE,
        icon: icon,
        show: false,
        frame: false,
        resizable: false,
        focusable: true, // true + type:'panel' 保证点击时游戏走正常失活流程，不会最小化
        type: 'panel',
        alwaysOnTop: true,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        transparent: true,
        skipTaskbar: true,
        roundedCorners: false,
        hasShadow: false,
        autoHideMenuBar: true,
        backgroundColor: '#00000000',
        webPreferences: {
          backgroundThrottling: false
        },
        titleBarStyle: 'hidden',
        trafficLightPosition: { x: 8, y: 8 }
      }
    })

    this.shortcutTargetId = `${this._namespace}/show`
  }

  private _watchCdTimerWindow() {
    if (!this.settings.pinned) {
      this._settingService.set('pinned', true)
    }

    this._mobxUtils.reaction(
      () => this.state.ready,
      (ready) => {
        if (ready) {
          this._applyOverlayWindowBehavior()

          this._window?.on('show', () => {
            this._applyOverlayWindowBehavior()
          })

          this._window?.on('focus', () => {
            // focusable: true 时可能正常获焦（如用户点击计时器区域），属预期行为
            this._logger.debug('cd-timer window focused')
          })

          this._window?.on('system-context-menu', (event) => {
            event.preventDefault()
          })
        }
      },
      { fireImmediately: true, equals: comparer.shallow }
    )

    this._mobxUtils.reaction(
      () => [this.settings.enabled, this._windowManager.state.isManagerFinishedInit],
      ([enabled, finishedInit]) => {
        if (!finishedInit) {
          return
        }

        if (enabled) {
          this.createWindow()
        } else {
          this.close(true)
        }
      },
      {
        fireImmediately: true,
        equals: comparer.shallow,
        delay: 500
      }
    )

    this._mobxUtils.reaction(
      () => this.settings.showShortcut,
      (shortcut) => {
        if (!shortcut) {
          this._logger.debug('Unregister cd-timer window shortcut')
          this._keyboardShortcuts.unregisterByTargetId(this.shortcutTargetId)
          return
        }

        if (!NATIVE_SUPPORT.nativeInput.available) {
          return
        }

        try {
          this._keyboardShortcuts.register(this.shortcutTargetId, shortcut, 'normal', () => {
            if (this.state.show) {
              this.hide()
            } else {
              this.show(true)
            }
          })
        } catch {
          this._logger.warn('Failed to register cd-timer window shortcut')
          this._settingService.set('showShortcut', null)
        }
      },
      { fireImmediately: true }
    )

    const shouldUseCdTimer = computed(() => {
      if (!this.state.ready || !this.settings.enabled) {
        return false
      }

      const session = this._leagueClient.data.gameflow.session

      if (
        session &&
        session.phase === 'InProgress' &&
        this.state.supportedGameModes.some(
          (mode) => mode.gameMode === session.gameData.queue.gameMode
        )
      ) {
        return true
      }

      return false
    })

    this._mobxUtils.reaction(
      () => shouldUseCdTimer.get(),
      (should) => {
        if (should) {
          this.show(true)
          this._applyOverlayWindowBehavior()
        } else {
          this.hide()
        }
      },
      { fireImmediately: true }
    )

    this._mobxUtils.reaction(
      () => shouldUseCdTimer.get(),
      (should) => {
        if (should) {
          this._logger.info('Game stats polling started')
          this._updateGameStats()
          this._gameStatsPollTimer = setInterval(
            () => this._updateGameStats(),
            AkariCdTimerWindow.GAME_STATS_POLL_INTERVAL
          )
        } else {
          if (this._gameStatsPollTimer) {
            this._logger.info('Game stats polling stopped')
            clearInterval(this._gameStatsPollTimer)
            this._gameStatsPollTimer = null
          }

          this.state.setGameTime(null)
        }
      },
      { fireImmediately: true }
    )
  }

  private _registerIpcHandlers() {
    let isSending = false
    this._ipc.onCall(this._namespace, 'sendInGame', async (_, text: string) => {
      if (!NATIVE_SUPPORT.nativeInput.available) {
        throw new AkariIpcError('native input not supported', 'NativeInputNotSupported')
      }

      if (isSending) {
        throw new AkariIpcError('cd-timer is sending', 'AlreadySending')
      }

      if (!(await GameClientMain.isGameClientForeground())) {
        throw new AkariIpcError('game client is not foreground', 'GameClientNotForeground')
      }

      const trimmed = typeof text === 'string' ? text.trim() : ''
      if (!trimmed) return

      isSending = true
      try {
        await nativeInput.instance.sendKey(AkariCdTimerWindow.ENTER_KEY_CODE, true)
        await sleep(AkariCdTimerWindow.ENTER_KEY_INTERNAL_DELAY)
        await nativeInput.instance.sendKey(AkariCdTimerWindow.ENTER_KEY_CODE, false)
        await sleep(AkariCdTimerWindow.INPUT_DELAY)
        await nativeInput.instance.sendString(trimmed)
        await sleep(AkariCdTimerWindow.INPUT_DELAY)
        await nativeInput.instance.sendKey(AkariCdTimerWindow.ENTER_KEY_CODE, true)
        await sleep(AkariCdTimerWindow.ENTER_KEY_INTERNAL_DELAY)
        await nativeInput.instance.sendKey(AkariCdTimerWindow.ENTER_KEY_CODE, false)
      } catch (error) {
        this._logger.warn('sendInGame failed', error)
        throw error
      } finally {
        isSending = false
      }
    })
  }

  private async _updateGameStats() {
    try {
      const { data } = await this._gameClient.api.getGameStats()
      this.state.setGameTime(data.gameTime)
    } catch (error) {
      this.state.setGameTime(null)
      this._logger.warn('Failed to get game data', error)
    }
  }

  override async onInit() {
    await super.onInit()

    if (NATIVE_SUPPORT.nativeInput.available) {
      this._registerIpcHandlers()
    }

    this._watchCdTimerWindow()
  }

  override showOrRestore(_inactive = false) {
    super.showOrRestore(true)
    this._applyOverlayWindowBehavior()
  }

  override show(_inactive = false) {
    super.show(true)
    this._applyOverlayWindowBehavior()
  }

  protected override getStatePropKeys() {
    return ['supportedGameModes', 'gameTime'] as const
  }

  protected override getSettingPropKeys() {
    return ['enabled', 'showShortcut', 'timerType', 'reverseAdjustmentDirection'] as const
  }
}
