import { i18next } from '@main/i18n'
import icon from '@resources/LA_ICON.ico?asset'
import { Notification } from 'electron'
import { comparer, computed } from 'mobx'

import { WindowManagerMainContext } from '..'
import { BaseAkariWindow } from '../base-akari-window'
import { getLeagueClientUxBounds, repositionToAlignLeagueClientUx } from '../position-utils'
import { AuxWindowSettings, AuxWindowState } from './state'

const SNAP_CHECK_INTERVAL = 500
const POSITION_THRESHOLD = 5

function hasClientBoundsChanged(
  previous: ReturnType<typeof getLeagueClientUxBounds>,
  next: NonNullable<ReturnType<typeof getLeagueClientUxBounds>>
) {
  if (!previous) {
    return true
  }

  return (
    Math.abs(previous.x - next.x) > POSITION_THRESHOLD ||
    Math.abs(previous.y - next.y) > POSITION_THRESHOLD ||
    Math.abs(previous.width - next.width) > POSITION_THRESHOLD ||
    Math.abs(previous.height - next.height) > POSITION_THRESHOLD
  )
}

export class AkariAuxWindow extends BaseAkariWindow<AuxWindowState, AuxWindowSettings> {
  static readonly NAMESPACE_SUFFIX = 'aux-window'
  static readonly HTML_ENTRY = 'aux-window.html'
  static readonly TITLE = 'Mini Akari'
  static readonly BASE_WIDTH = 340
  static readonly BASE_HEIGHT = 420
  static readonly MIN_WIDTH = 340
  static readonly MIN_HEIGHT = 420

  static readonly QUICK_CLOSE_TIP_STORAGE_KEY = 'quickCloseTip'

  constructor(_context: WindowManagerMainContext) {
    const state = new AuxWindowState()
    const settings = new AuxWindowSettings()

    super(_context, AkariAuxWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariAuxWindow.BASE_WIDTH,
      baseHeight: AkariAuxWindow.BASE_HEIGHT,
      minWidth: AkariAuxWindow.MIN_WIDTH,
      minHeight: AkariAuxWindow.MIN_HEIGHT,
      htmlEntry: AkariAuxWindow.HTML_ENTRY,
      rememberPosition: true,
      rememberSize: true,
      repositionWindowIfInvisible: true,
      settingSchema: {
        enabled: { default: settings.enabled },
        autoShow: { default: settings.autoShow },
        showSkinSelector: { default: settings.showSkinSelector },
        snapToGame: { default: settings.snapToGame }
      },
      browserWindowOptions: {
        title: AkariAuxWindow.TITLE,
        icon: icon,
        show: false,
        frame: false,
        fullscreenable: false,
        maximizable: false
      }
    })
  }

  private _handleAuxWindowLogics() {
    let snapIntervalId: NodeJS.Timeout | null = null
    let lastClientBounds: ReturnType<typeof getLeagueClientUxBounds> = null

    const stopSnap = () => {
      if (snapIntervalId) {
        clearInterval(snapIntervalId)
        snapIntervalId = null
      }
    }

    const snapToLeagueClient = () => {
      if (!this._window || this._window.isDestroyed() || !this.settings.snapToGame || !this.state.show) {
        return
      }

      const clientBounds = getLeagueClientUxBounds()
      if (!clientBounds || !hasClientBoundsChanged(lastClientBounds, clientBounds)) {
        return
      }

      lastClientBounds = clientBounds
      repositionToAlignLeagueClientUx(this._window, 'top-left')
    }

    const showTiming = computed(() => {
      if (!this.settings.autoShow) {
        return 'ignore'
      }

      if (!this.state.ready) {
        return 'ignore'
      }

      switch (this._leagueClient.data.gameflow.phase) {
        case 'ChampSelect':
          if (this._leagueClient.data.champSelect.session?.isSpectating) {
            return 'ignore'
          }
        case 'Lobby':
        case 'Matchmaking':
        case 'ReadyCheck':
          return 'show'
      }

      return 'hide'
    })

    // normally show & hide
    this._mobx.reaction(
      () => showTiming.get(),
      (timing) => {
        if (timing === 'ignore') {
          return
        }

        if (timing === 'show') {
          this.showOrRestore()
        } else {
          this.hide()
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => [this.settings.enabled, this._windowManager.state.isManagerFinishedInit] as const,
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
      { fireImmediately: true, delay: 500, equals: comparer.shallow }
    )

    this._mobx.reaction(
      () => this._leagueClient.state.connectionState,
      (state) => {
        if (state !== 'connected') {
          this.hide()
        }
      }
    )

    this._mobx.reaction(
      () => [this.state.show, this.state.ready, this.state.status, this.settings.snapToGame] as const,
      ([show, ready, status, snapToGame]) => {
        stopSnap()

        if (show && ready && status !== 'minimized' && snapToGame) {
          lastClientBounds = null
          snapToLeagueClient()
          snapIntervalId = setInterval(snapToLeagueClient, SNAP_CHECK_INTERVAL)
        }
      },
      { fireImmediately: true, equals: comparer.shallow }
    )

    this._mobx.reaction(
      () => this._window,
      (window) => {
        if (window) {
          window.once('closed', stopSnap)
        } else {
          stopSnap()
        }
      }
    )

    // 快速关闭会提供提示
    this._setting._getFromStorage(AkariAuxWindow.QUICK_CLOSE_TIP_STORAGE_KEY).then((tip) => {
      if (!tip) {
        let _lastShow = -Infinity
        let inARow = 0
        let cb: Function | null = null
        cb = this._mobx.reaction(
          () => this.state.show,
          (show) => {
            if (show) {
              _lastShow = Date.now()
            } else {
              if (Date.now() - _lastShow < 1000) {
                inARow++

                if (inARow < 5) {
                  return
                }

                new Notification({
                  title: i18next.t('window-manager-main.aux-window.quickClose.title'),
                  body: i18next.t('window-manager-main.aux-window.quickClose.body'),
                  icon: icon
                }).show()

                this._setting._saveToStorage(AkariAuxWindow.QUICK_CLOSE_TIP_STORAGE_KEY, true)
                cb?.()
              } else {
                inARow = 0
              }
            }
          }
        )
      }
    })

    this._ipc.onCall(this._namespace, 'repositionToAlignLeagueClientUx', (_, placement) => {
      if (this._window) {
        repositionToAlignLeagueClientUx(this._window, placement)
      }
    })
  }

  override async onInit() {
    await super.onInit()

    this._handleAuxWindowLogics()
  }

  protected override getSettingPropKeys() {
    return ['enabled', 'autoShow', 'showSkinSelector', 'snapToGame'] as const
  }
}
