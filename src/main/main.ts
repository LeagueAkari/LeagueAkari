import 'reflect-metadata'

import { app } from 'electron'

import { bootstrap } from './bootstrap'

const gotTheLock = app.requestSingleInstanceLock()

if (gotTheLock) {
  bootstrap()
} else {
  app.quit()
}
