import 'reflect-metadata'

import { app } from 'electron'

import { bootstrap } from './bootstrap'

if (process.platform === 'win32') {
  app.setAppUserModelId('sugar.cocoa.league-akari')
}

const gotTheLock = app.requestSingleInstanceLock()

if (gotTheLock) {
  bootstrap()
} else {
  app.quit()
}
