import { GameClientMain } from '@main/shards/game-client'
import icon from '@resources/LA_ICON.ico?asset&asarUnpack'
import { compareShallow, computed } from 'mobx'
import { z } from 'zod'

import { BaseAkariWindow } from '../base-akari-window'
import type { WindowManagerMainContext } from '../context'
import { repositionToAlignLeagueClientUx } from '../window-position-service'
import { ChampionDataWindowSettings, ChampionDataWindowState } from './state'

export class AkariChampionDataWindow extends BaseAkariWindow<
  ChampionDataWindowState,
  ChampionDataWindowSettings
> {
  static readonly NAMESPACE_SUFFIX = 'champion-data-window'
  static readonly HTML_ENTRY = 'champion-data-window.html'
  static readonly TITLE = 'League Akari - Champion Data'
  static readonly BASE_WIDTH = 480
  static readonly BASE_HEIGHT = 720
  static readonly MIN_WIDTH = 530
  static readonly MIN_HEIGHT = 530

  public shortcutTargetId: string

  constructor(_context: WindowManagerMainContext) {
    const state = new ChampionDataWindowState()
    const settings = new ChampionDataWindowSettings()

    super(_context, AkariChampionDataWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariChampionDataWindow.BASE_WIDTH,
      baseHeight: AkariChampionDataWindow.BASE_HEIGHT,
      minWidth: AkariChampionDataWindow.MIN_WIDTH,
      minHeight: AkariChampionDataWindow.MIN_HEIGHT,
      htmlEntry: AkariChampionDataWindow.HTML_ENTRY,
      rememberPosition: true,
      rememberSize: true,
      repositionWindowIfInvisible: true,
      settingSchema: {
        enabled: { default: settings.enabled, schema: z.boolean() },
        autoShow: { default: settings.autoShow, schema: z.boolean() },
        showShortcut: { default: settings.showShortcut, schema: z.string().nullable() },
        showSkinSelector: { default: settings.showSkinSelector, schema: z.boolean() }
      },
      browserWindowOptions: {
        title: AkariChampionDataWindow.TITLE,
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

  private _watchChampionDataWindow() {
    const showTiming = computed(() => {
      if (!this.settings.autoShow) {
        return 'ignore'
      }

      if (!this.state.ready) {
        return 'ignore'
      }

      switch (this._context.leagueClient.data.gameflow.phase) {
        case 'ChampSelect':
          return 'show'
      }

      return 'normal'
    })

    // 在英雄选择阶段会主动展示, 其他阶段不会主动关闭
    this._context.mobxUtils.reaction(
      () => showTiming.get(),
      (timing) => {
        if (timing === 'show') {
          this.showOrRestore()
        }
      }
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
            this._logger.warn('Failed to register champion data window shortcut')
            this._settingService.set('showShortcut', null)
          }
        } else {
          this._logger.debug('Unregister champion data window shortcut')
          this._keyboardShortcuts.unregisterByTargetId(this.shortcutTargetId)
        }
      },
      { fireImmediately: true }
    )
  }

  override async onInit() {
    await super.onInit()

    this._watchChampionDataWindow()
  }

  protected override getSettingPropKeys() {
    return ['enabled', 'autoShow', 'showShortcut', 'showSkinSelector'] as const
  }
}
