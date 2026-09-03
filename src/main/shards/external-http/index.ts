import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type { CreateAxiosDefaults } from 'axios'
import { session } from 'electron'

import { AppCommonMain } from '../app-common'
import { type AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { createExternalHttpAxiosClient } from './axios-client'
import {
  EXTERNAL_HTTP_MAIN_NAMESPACE,
  EXTERNAL_HTTP_SESSION_PARTITION,
  type ExternalHttpMainContext
} from './context'
import { ExternalHttpProxyController } from './proxy-controller'

@Shard(ExternalHttpMain.id)
export class ExternalHttpMain implements IAkariShardInitDispose {
  static id = EXTERNAL_HTTP_MAIN_NAMESPACE

  private readonly _logger: AkariLogger
  private readonly _context: ExternalHttpMainContext
  private readonly _proxyController: ExternalHttpProxyController

  constructor(
    private readonly _appCommon: AppCommonMain,
    loggerFactory: LoggerFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain
  ) {
    this._logger = loggerFactory.create(ExternalHttpMain.id)
    this._context = {
      namespace: ExternalHttpMain.id,
      appCommon: this._appCommon,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      electronSession: session.fromPartition(EXTERNAL_HTTP_SESSION_PARTITION, { cache: false })
    }
    this._proxyController = new ExternalHttpProxyController(this._context)
  }

  createAxiosClient(defaults: CreateAxiosDefaults = {}) {
    return createExternalHttpAxiosClient(
      this._context.electronSession,
      () => this._proxyController.waitUntilConfigured(),
      defaults
    )
  }

  resolveProxy(url: string) {
    return this._context.electronSession.resolveProxy(url)
  }

  async onInit() {
    this._proxyController.start()
  }

  async onDispose() {
    this._proxyController.dispose()
    try {
      await this._context.electronSession.closeAllConnections()
    } catch (error) {
      this._logger.warn('Failed to close external HTTP connections during disposal', error)
    }
  }
}
