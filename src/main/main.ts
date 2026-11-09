import 'reflect-metadata'

import { app, dialog } from 'electron'

import { waitForAdministratorRelaunchParent } from './administrator-relaunch'
import { bootstrap } from './bootstrap'

if (process.platform === 'win32') {
  app.setAppUserModelId('sugar.cocoa.league-akari')
}

function start() {
  try {
    waitForAdministratorRelaunchParent()
  } catch (error) {
    dialog.showErrorBox('League Akari: administrator relaunch failed', String(error))
    app.exit(1)
    return
  }

  if (app.requestSingleInstanceLock()) {
    bootstrap()
  } else {
    app.quit()
  }
}

start()
