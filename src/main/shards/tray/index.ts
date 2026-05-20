import icon from '@resources/LA_ICON.ico?asset'
import macosTrayIcon from '@resources/iconTemplate.png?asset'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { Menu, MenuItem, Tray, app, nativeImage } from 'electron'
import i18next from 'i18next'
import { comparer } from 'mobx'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { MobxUtilsMain } from '../mobx-utils'
import { WindowManagerMain } from '../window-manager'

/**
 * 有关托盘区那里的逻辑
 */
@Shard(TrayMain.id)
export class TrayMain implements IAkariShardInitDispose {
  static id = 'tray-main'

  private _trayIcon: Tray | null = null
  private _mainWindowDevTrayItem: MenuItem
  private _auxWindowTrayItem: MenuItem
  private _auxWindowDevTrayItem: MenuItem
  private _opggWindowTrayItem: MenuItem
  private _opggWindowDevTrayItem: MenuItem
  private _ongoingGameWindowDevTrayItem: MenuItem
  private _cdTimerWindowDevTrayItem: MenuItem
  private _quitTrayItem: MenuItem
  private _contextMenu: Menu
  private _adjustAllWindowPositionsTrayItem: MenuItem

  constructor(
    private readonly _windowManager: WindowManagerMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _appCommon: AppCommonMain,
    private readonly _ipc: AkariIpcMain
  ) {}

  private _buildMenus() {
    let trayIcon: string | Electron.NativeImage = icon
    if (process.platform === 'darwin') {
      const originalImage = nativeImage.createFromPath(macosTrayIcon)
      const size = originalImage.getSize()
      const aspectRatio = size.width / size.height
      trayIcon = originalImage.resize({ width: Math.round(16 * aspectRatio), height: 16 })
      trayIcon.setTemplateImage(true)
    }
    this._trayIcon = new Tray(trayIcon)

    this._auxWindowTrayItem = new MenuItem({
      label: i18next.t('tray.auxWindow'),
      type: 'normal',
      click: () => this._windowManager.auxWindow.showOrRestore(),
      enabled: this._windowManager.auxWindow.settings.enabled
    })

    this._auxWindowDevTrayItem = new MenuItem({
      id: 'aux-window-dev',
      label: i18next.t('tray.dev.toggleAuxWindowDevtools'),
      type: 'normal',
      click: () => this._windowManager.auxWindow.toggleDevtools(),
      enabled: this._windowManager.auxWindow.settings.enabled
    })

    this._mainWindowDevTrayItem = new MenuItem({
      label: i18next.t('tray.dev.toggleMainWindowDevtools'),
      type: 'normal',
      click: () => this._windowManager.mainWindow.toggleDevtools()
    })

    this._opggWindowTrayItem = new MenuItem({
      label: i18next.t('tray.opggWindow'),
      type: 'normal',
      click: () => this._windowManager.opggWindow.showOrRestore(),
      enabled: this._windowManager.opggWindow.settings.enabled
    })

    this._opggWindowDevTrayItem = new MenuItem({
      label: i18next.t('tray.dev.toggleOpggWindowDevtools'),
      type: 'normal',
      click: () => this._windowManager.opggWindow.toggleDevtools(),
      enabled: this._windowManager.opggWindow.settings.enabled
    })

    this._ongoingGameWindowDevTrayItem = new MenuItem({
      label: i18next.t('tray.dev.toggleOngoingGameWindowDevtools'),
      type: 'normal',
      click: () => this._windowManager.ongoingGameWindow?.toggleDevtools(),
      enabled: this._windowManager.ongoingGameWindow.settings.enabled
    })

    this._cdTimerWindowDevTrayItem = new MenuItem({
      label: i18next.t('tray.dev.toggleCdTimerWindowDevtools'),
      type: 'normal',
      click: () => this._windowManager.cdTimerWindow.toggleDevtools(),
      enabled: this._windowManager.cdTimerWindow.settings.enabled
    })

    this._adjustAllWindowPositionsTrayItem = new MenuItem({
      label: i18next.t('tray.adjustAllWindowPositions'),
      type: 'normal',
      click: () => {
        this._windowManager.mainWindow.repositionWindowIfInvisible()
        this._windowManager.auxWindow.repositionWindowIfInvisible()
        this._windowManager.opggWindow.repositionWindowIfInvisible()
        this._windowManager.ongoingGameWindow.repositionWindowIfInvisible()
        this._windowManager.cdTimerWindow.repositionWindowIfInvisible()
      }
    })

    this._quitTrayItem = new MenuItem({
      label: i18next.t('tray.quit'),
      type: 'normal',
      click: () => this._windowManager.mainWindow.close(true)
    })

    this._contextMenu = Menu.buildFromTemplate([
      {
        label: 'League Akari',
        type: 'normal',
        click: () => this._windowManager.mainWindow.showOrRestore()
      },
      {
        type: 'separator'
      },
      {
        label: 'Dev',
        type: 'submenu',
        submenu: Menu.buildFromTemplate([
          this._mainWindowDevTrayItem,
          this._auxWindowDevTrayItem,
          this._opggWindowDevTrayItem,
          this._ongoingGameWindowDevTrayItem,
          this._cdTimerWindowDevTrayItem,
          {
            type: 'separator'
          },
          this._adjustAllWindowPositionsTrayItem
        ])
      },
      {
        type: 'separator'
      },
      this._auxWindowTrayItem,
      this._opggWindowTrayItem,
      this._quitTrayItem
    ])

    // 全局标题栏
    if (process.platform !== 'darwin') {
      this._trayIcon.setToolTip('League Akari')
    }

    this._trayIcon.addListener('click', () => this._windowManager.mainWindow.showOrRestore())
    this._trayIcon.addListener('right-click', () => {
      this._trayIcon?.popUpContextMenu(this._contextMenu)
    })

    if (process.platform === 'darwin') {
      const template = [
        new MenuItem({
          label: app.name,
          submenu: [
            {
              label: i18next.t('tray.about'),
              accelerator: 'Cmd+i',
              click: () => {
                // 这里的名称空间借用了 app-common-main
                this._ipc.sendEvent(AppCommonMain.id, 'show-about-akari')
                this._windowManager.mainWindow.showOrRestore()
              }
            },
            { type: 'separator' },
            {
              label: i18next.t('tray.settings'),
              accelerator: 'Cmd+,',
              click: () => {
                this._ipc.sendEvent(AppCommonMain.id, 'show-settings')
                this._windowManager.mainWindow.showOrRestore()
              }
            },
            { type: 'separator' },
            { role: 'quit' }
          ]
        }),
        new MenuItem({ role: 'editMenu' }),
        new MenuItem({ role: 'windowMenu' })
      ]

      Menu.setApplicationMenu(Menu.buildFromTemplate(template))
    }
  }

  async onInit() {
    this._buildMenus()

    this._mobxUtils.reaction(
      () => [
        this._windowManager.auxWindow.settings.enabled,
        this._windowManager.auxWindow.state.ready
      ],
      ([enabled, ready]) => {
        if (enabled && ready) {
          this._auxWindowDevTrayItem.enabled = true
          this._auxWindowTrayItem.enabled = true
        } else {
          this._auxWindowDevTrayItem.enabled = false
          this._auxWindowTrayItem.enabled = false
        }
      },
      { fireImmediately: true, equals: comparer.shallow }
    )

    this._mobxUtils.reaction(
      () => [
        this._windowManager.opggWindow.settings.enabled,
        this._windowManager.opggWindow.state.ready
      ],
      ([enabled, ready]) => {
        if (enabled && ready) {
          this._opggWindowDevTrayItem.enabled = true
          this._opggWindowTrayItem.enabled = true
        } else {
          this._opggWindowDevTrayItem.enabled = false
          this._opggWindowTrayItem.enabled = false
        }
      },
      { fireImmediately: true, equals: comparer.shallow }
    )

    this._mobxUtils.reaction(
      () => [
        this._windowManager.ongoingGameWindow.settings.enabled,
        this._windowManager.ongoingGameWindow.state.ready
      ],
      ([enabled, ready]) => {
        if (enabled && ready) {
          this._ongoingGameWindowDevTrayItem.enabled = true
        } else {
          this._ongoingGameWindowDevTrayItem.enabled = false
        }
      },
      { fireImmediately: true, equals: comparer.shallow }
    )

    this._mobxUtils.reaction(
      () => [
        this._windowManager.cdTimerWindow.settings.enabled,
        this._windowManager.cdTimerWindow.state.ready
      ],
      ([enabled, ready]) => {
        if (enabled && ready) {
          this._cdTimerWindowDevTrayItem.enabled = true
        } else {
          this._cdTimerWindowDevTrayItem.enabled = false
        }
      },
      { fireImmediately: true }
    )

    this._mobxUtils.reaction(
      () => this._appCommon.settings.locale,
      (_locale) => {
        if (this._trayIcon) {
          this._trayIcon.destroy()
        }

        this._buildMenus()
      }
    )
  }

  async onDispose() {
    this._trayIcon?.destroy()
    Menu.setApplicationMenu(null)
  }
}
