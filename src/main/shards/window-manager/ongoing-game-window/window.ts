import { is } from '@electron-toolkit/utils'
import { NATIVE_SUPPORT } from '@main/native'
import { GameClientMain } from '@main/shards/game-client'
import icon from '@resources/LA_ICON.ico?asset'
import { comparer } from 'mobx'

import { BaseAkariWindow } from '../base-akari-window'
import type { WindowManagerMainContext } from '../context'
import { OngoingGameWindowSettings, OngoingGameWindowState } from './state'

export class AkariOngoingGameWindow extends BaseAkariWindow<
  OngoingGameWindowState,
  OngoingGameWindowSettings
> {
  static readonly NAMESPACE_SUFFIX = 'ongoing-game-window'
  static readonly HTML_ENTRY = 'ongoing-game-window.html'
  static readonly TITLE = 'Akari Ongoing Game Inspector'
  static readonly BASE_WIDTH = 1300
  static readonly BASE_HEIGHT = 840

  static readonly POLL_INTERVAL = 400

  public shortcutTargetId: string

  constructor(_context: WindowManagerMainContext) {
    const state = new OngoingGameWindowState()
    const settings = new OngoingGameWindowSettings()

    super(_context, AkariOngoingGameWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariOngoingGameWindow.BASE_WIDTH,
      baseHeight: AkariOngoingGameWindow.BASE_HEIGHT,
      minWidth: AkariOngoingGameWindow.BASE_WIDTH,
      minHeight: AkariOngoingGameWindow.BASE_HEIGHT,
      htmlEntry: AkariOngoingGameWindow.HTML_ENTRY,
      rememberPosition: false,
      rememberSize: false,
      repositionWindowIfInvisible: true,
      settingSchema: {
        pinned: {
          default: settings.pinned,
          transform: () => true
        },
        enabled: { default: settings.enabled },
        showShortcut: { default: settings.showShortcut }
      },
      browserWindowOptions: {
        title: AkariOngoingGameWindow.TITLE,
        icon: icon,
        show: false,
        frame: false,
        resizable: false,
        focusable: false,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        transparent: true,
        hasShadow: false,
        thickFrame: false,
        roundedCorners: false,
        skipTaskbar: true,
        autoHideMenuBar: true,
        backgroundColor: '#00000000',
        webPreferences: {
          backgroundThrottling: false // focusable 和 backgroundThrottling 一起使用, 会出现莫名其妙的 BUG
        }
      }
    })

    this.shortcutTargetId = `${this._namespace}/show`
  }

  private _watchOngoingGameWindow() {
    if (!this.settings.pinned) {
      this._settingService.set('pinned', true)
    }

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
      () => this.state.ready,
      (ready) => {
        if (!ready) {
          return
        }

        if (this._window) {
          this._window.setIgnoreMouseEvents(true)
          this.show()
        }
      }
    )

    this._mobxUtils.reaction(
      () => this.state.fakeShow,
      (fakeShow) => {
        if (fakeShow) {
          this._window?.setIgnoreMouseEvents(false)
        } else {
          this._window?.setIgnoreMouseEvents(true)
        }
      },
      { fireImmediately: true }
    )

    this._mobxUtils.reaction(
      () => this.settings.showShortcut,
      (shortcut) => {
        if (!shortcut) {
          this._logger.debug('Unregister ongoing-game window shortcut')
          this._keyboardShortcuts.unregisterByTargetId(this.shortcutTargetId)
          return
        }

        if (!NATIVE_SUPPORT.nativeInput.available) {
          return
        }

        try {
          this._keyboardShortcuts.register(
            this.shortcutTargetId,
            shortcut,
            'stateful',
            async (event) => {
              if (event.pressed) {
                if (is.dev || (await GameClientMain.isGameClientForeground())) {
                  if (!this.state.show) {
                    this.show()
                  }

                  this._window?.setIgnoreMouseEvents(false)
                  this.state.setFakeShow(true)
                }
              } else {
                this._window?.setIgnoreMouseEvents(true)
                this.state.setFakeShow(false)
              }
            }
          )
        } catch {
          this._logger.warn('Failed to register ongoing-game window shortcut')
          this._settingService.set('showShortcut', null)
        }
      },
      { fireImmediately: true }
    )
  }

  override hide() {
    this.state.setFakeShow(true)
  }

  override async onInit() {
    await super.onInit()

    this._watchOngoingGameWindow()
  }

  protected override getSettingPropKeys() {
    return ['enabled', 'showShortcut'] as const
  }

  protected override getStatePropKeys() {
    return ['fakeShow'] as const
  }
}
