import icon from '@resources/LA_ICON.ico?asset'
import macosTrayIcon from '@resources/iconTemplate.png?asset'
import { Menu, MenuItem, Tray, app, nativeImage } from 'electron'
import i18next from 'i18next'

import { AppCommonMain } from '../app-common'
import type { TrayMainContext } from './context'

export class TrayMenuController {
  private _trayIcon: Tray | null = null
  private _contextMenu: Menu | null = null

  mainWindowDevTrayItem!: MenuItem
  auxWindowTrayItem!: MenuItem
  auxWindowDevTrayItem!: MenuItem
  opggWindowTrayItem!: MenuItem
  opggWindowDevTrayItem!: MenuItem
  ongoingGameWindowDevTrayItem!: MenuItem
  cdTimerWindowDevTrayItem!: MenuItem
  quitTrayItem!: MenuItem
  adjustAllWindowPositionsTrayItem!: MenuItem

  constructor(private readonly context: TrayMainContext) {}

  build() {
    const { ipc, windowManager } = this.context
    this._trayIcon = new Tray(this._createTrayIcon())

    this.auxWindowTrayItem = new MenuItem({
      label: i18next.t('tray.auxWindow'),
      type: 'normal',
      click: () => windowManager.auxWindow.showOrRestore(),
      enabled: windowManager.auxWindow.settings.enabled
    })

    this.auxWindowDevTrayItem = new MenuItem({
      id: 'aux-window-dev',
      label: i18next.t('tray.dev.toggleAuxWindowDevtools'),
      type: 'normal',
      click: () => windowManager.auxWindow.toggleDevtools(),
      enabled: windowManager.auxWindow.settings.enabled
    })

    this.mainWindowDevTrayItem = new MenuItem({
      label: i18next.t('tray.dev.toggleMainWindowDevtools'),
      type: 'normal',
      click: () => windowManager.mainWindow.toggleDevtools()
    })

    this.opggWindowTrayItem = new MenuItem({
      label: i18next.t('tray.opggWindow'),
      type: 'normal',
      click: () => windowManager.opggWindow.showOrRestore(),
      enabled: windowManager.opggWindow.settings.enabled
    })

    this.opggWindowDevTrayItem = new MenuItem({
      label: i18next.t('tray.dev.toggleOpggWindowDevtools'),
      type: 'normal',
      click: () => windowManager.opggWindow.toggleDevtools(),
      enabled: windowManager.opggWindow.settings.enabled
    })

    this.ongoingGameWindowDevTrayItem = new MenuItem({
      label: i18next.t('tray.dev.toggleOngoingGameWindowDevtools'),
      type: 'normal',
      click: () => windowManager.ongoingGameWindow?.toggleDevtools(),
      enabled: windowManager.ongoingGameWindow.settings.enabled
    })

    this.cdTimerWindowDevTrayItem = new MenuItem({
      label: i18next.t('tray.dev.toggleCdTimerWindowDevtools'),
      type: 'normal',
      click: () => windowManager.cdTimerWindow.toggleDevtools(),
      enabled: windowManager.cdTimerWindow.settings.enabled
    })

    this.adjustAllWindowPositionsTrayItem = new MenuItem({
      label: i18next.t('tray.adjustAllWindowPositions'),
      type: 'normal',
      click: () => {
        windowManager.mainWindow.repositionWindowIfInvisible()
        windowManager.auxWindow.repositionWindowIfInvisible()
        windowManager.opggWindow.repositionWindowIfInvisible()
        windowManager.ongoingGameWindow.repositionWindowIfInvisible()
        windowManager.cdTimerWindow.repositionWindowIfInvisible()
      }
    })

    this.quitTrayItem = new MenuItem({
      label: i18next.t('tray.quit'),
      type: 'normal',
      click: () => windowManager.mainWindow.close(true)
    })

    this._contextMenu = Menu.buildFromTemplate([
      {
        label: 'League Akari',
        type: 'normal',
        click: () => windowManager.mainWindow.showOrRestore()
      },
      {
        type: 'separator'
      },
      {
        label: 'Dev',
        type: 'submenu',
        submenu: Menu.buildFromTemplate([
          this.mainWindowDevTrayItem,
          this.auxWindowDevTrayItem,
          this.opggWindowDevTrayItem,
          this.ongoingGameWindowDevTrayItem,
          this.cdTimerWindowDevTrayItem,
          {
            type: 'separator'
          },
          this.adjustAllWindowPositionsTrayItem
        ])
      },
      {
        type: 'separator'
      },
      this.auxWindowTrayItem,
      this.opggWindowTrayItem,
      this.quitTrayItem
    ])

    // 全局标题栏
    if (process.platform !== 'darwin') {
      this._trayIcon.setToolTip('League Akari')
    }

    this._trayIcon.addListener('click', () => windowManager.mainWindow.showOrRestore())
    this._trayIcon.addListener('right-click', () => {
      this._trayIcon?.popUpContextMenu(this._contextMenu!)
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
                ipc.sendEvent(AppCommonMain.id, 'show-about-akari')
                windowManager.mainWindow.showOrRestore()
              }
            },
            { type: 'separator' },
            {
              label: i18next.t('tray.settings'),
              accelerator: 'Cmd+,',
              click: () => {
                ipc.sendEvent(AppCommonMain.id, 'show-settings')
                windowManager.mainWindow.showOrRestore()
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

  rebuild() {
    this.destroyTrayIcon()
    this.build()
  }

  destroy() {
    this.destroyTrayIcon()
    Menu.setApplicationMenu(null)
  }

  destroyTrayIcon() {
    this._trayIcon?.destroy()
    this._trayIcon = null
  }

  private _createTrayIcon() {
    if (process.platform !== 'darwin') {
      return icon
    }

    const originalImage = nativeImage.createFromPath(macosTrayIcon)
    const size = originalImage.getSize()
    const aspectRatio = size.width / size.height
    const trayIcon = originalImage.resize({ width: Math.round(16 * aspectRatio), height: 16 })
    trayIcon.setTemplateImage(true)
    return trayIcon
  }
}
