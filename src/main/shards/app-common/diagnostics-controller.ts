import { app } from 'electron'

import type { AppCommonMainContext } from './context'

export class AppCommonDiagnosticsController {
  constructor(private readonly context: AppCommonMainContext) {}

  start() {
    this._logInstantiatedShards()

    app.on('browser-window-created', (_, window) => {
      this.context.logger.info('browser-window-created', window.id, window.title)
    })

    this._checkIfRunInTempDir()
  }

  private _checkIfRunInTempDir() {
    // 主程序是否目录在 temp 下
    const exePath = app.getPath('exe')
    const tempPath = app.getPath('temp')

    this.context.logger.info('exePath', exePath, tempPath)

    if (exePath.startsWith(tempPath)) {
      this.context.state.setRunInTempDir(true)
      this.context.logger.warn('run in temp dir warning', exePath, tempPath)
    }
  }

  private _logInstantiatedShards() {
    // @ts-ignore
    const loadedShards = this.context.shared.manager._instances.keys()

    const shards: string[] = []
    for (const shard of loadedShards) {
      if (typeof shard === 'symbol') {
        shards.push(shard.description || '[unknown]')
      } else {
        shards.push(shard)
      }
    }

    this.context.logger.info('instantiated shards', shards)
  }
}
