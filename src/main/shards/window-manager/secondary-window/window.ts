import { GameClientMain } from '@main/shards/game-client'
import icon from '@resources/LA_ICON.ico?asset&asarUnpack'
import { compareShallow, computed } from 'mobx'
import { z } from 'zod'

import { BaseAkariWindow } from '../base-akari-window'
import type { WindowManagerMainContext } from '../context'
import { repositionToAlignLeagueClientUx } from '../window-position-service'
import { SecondaryWindowSettings, SecondaryWindowState } from './state'

export class AkariSecondaryWindow extends BaseAkariWindow<
  SecondaryWindowState,
  SecondaryWindowSettings
> {
  static readonly NAMESPACE_SUFFIX = 'secondary-window'
  static readonly HTML_ENTRY = 'secondary-window.html'
  static readonly TITLE = 'League Akari - Secondary'
  static readonly BASE_WIDTH = 530
  static readonly BASE_HEIGHT = 720
  static readonly MIN_WIDTH = 530
  static readonly MIN_HEIGHT = 530

  public shortcutTargetId: string

  constructor(_context: WindowManagerMainContext) {
    const state = new SecondaryWindowState()
    const settings = new SecondaryWindowSettings()

    super(_context, AkariSecondaryWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariSecondaryWindow.BASE_WIDTH,
      baseHeight: AkariSecondaryWindow.BASE_HEIGHT,
      minWidth: AkariSecondaryWindow.MIN_WIDTH,
      minHeight: AkariSecondaryWindow.MIN_HEIGHT,
      htmlEntry: AkariSecondaryWindow.HTML_ENTRY,
      rememberPosition: true,
      rememberSize: true,
      repositionWindowIfInvisible: true,
      settingSchema: {
        enabled: { default: settings.enabled, schema: z.boolean() },
        autoShowInLobby: { default: settings.autoShowInLobby, schema: z.boolean() },
        autoShowInChampSelect: { default: settings.autoShowInChampSelect, schema: z.boolean() },
        showShortcut: { default: settings.showShortcut, schema: z.string().nullable() },
        showSkinSelector: { default: settings.showSkinSelector, schema: z.boolean() }
      },
      browserWindowOptions: {
        title: AkariSecondaryWindow.TITLE,
        icon: icon,
        show: false,
        fullscreenable: false,
        frame: false,
        maximizable: false,
        titleBarStyle: 'hidden',
        trafficLightPosition: { x: 8, y: 8 }
      }
    })

    this.shortcutTargetId = `${this._namespace}/show`
  }

  private _watchSecondaryWindow() {
    const showTiming = computed(() => {
      if (!this.state.ready || this._leagueClient.state.connectionState !== 'connected') {
        return null
      }

      switch (this._context.leagueClient.data.gameflow.phase) {
        case 'Lobby':
        case 'Matchmaking':
        case 'ReadyCheck':
          return this.settings.autoShowInLobby ? 'lobby' : null

        case 'ChampSelect':
          return this.settings.autoShowInChampSelect &&
            !this._leagueClient.data.champSelect.session?.isSpectating
            ? 'champ-select'
            : null
      }

      return null
    })

    // 按阶段展示窗口；离开该阶段后保留用户正在浏览的页面。
    this._context.mobxUtils.reaction(
      () => showTiming.get(),
      (timing) => {
        if (timing) {
          this.showOrRestore()
        }
      },
      { fireImmediately: true }
    )

    this._context.mobxUtils.reaction(
      () =>
        [this.settings.enabled, this._context.windowManager.state.isManagerFinishedInit] as const,
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
      { fireImmediately: true, delay: 500, equals: compareShallow }
    )

    this._ipc.onCall(this._namespace, 'repositionToAlignLeagueClientUx', (_, placement) => {
      if (this._window) {
        repositionToAlignLeagueClientUx(this._window, placement)
      }
    })

    this._mobxUtils.reaction(
      () => this.settings.showShortcut,
      (shortcut) => {
        if (shortcut) {
          try {
            this._keyboardShortcuts.register(
              this.shortcutTargetId,
              shortcut,
              'normal',
              async () => {
                if (!this.state.show && (await GameClientMain.isGameClientForeground())) {
                  this.setPinned(true)
                }

                if (this.state.show) {
                  this.hide()
                } else {
                  this.show()
                }
              }
            )
          } catch {
            this._logger.warn('Failed to register secondary window shortcut')
            this._settingService.set('showShortcut', null)
          }
        } else {
          this._logger.debug('Unregister secondary window shortcut')
          this._keyboardShortcuts.unregisterByTargetId(this.shortcutTargetId)
        }
      },
      { fireImmediately: true }
    )
  }

  override async onInit() {
    await super.onInit()

    this._watchSecondaryWindow()
  }

  protected override getSettingPropKeys() {
    return [
      'enabled',
      'autoShowInLobby',
      'autoShowInChampSelect',
      'showShortcut',
      'showSkinSelector'
    ] as const
  }
}
