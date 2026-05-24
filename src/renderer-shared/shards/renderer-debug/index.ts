import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { RadixEventEmitter } from '@shared/utils/event-emitter'

import { AkariIpcRenderer } from '../ipc'
import { LoggerRenderer } from '../logger'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { SetupInAppScopeRenderer } from '../setup-in-app-scope'
import {
  MAIN_SHARD_NAMESPACE,
  RENDERER_DEBUG_RENDERER_NAMESPACE,
  type RendererDebugRendererContext
} from './context'
import { RendererDebugWatcher } from './debug-watcher'
import { RendererDebugRuleManager } from './rule-manager'
import { useRendererDebugStore } from './store'

@Shard(RendererDebugRenderer.id)
export class RendererDebugRenderer implements IAkariShardInitDispose {
  static id = RENDERER_DEBUG_RENDERER_NAMESPACE

  private readonly _matcher = new RadixEventEmitter()
  private readonly _context: RendererDebugRendererContext
  private readonly _ruleManager: RendererDebugRuleManager
  private readonly _watcher: RendererDebugWatcher

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(LoggerRenderer) private readonly _logger: LoggerRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer
  ) {
    this._context = {
      namespace: RendererDebugRenderer.id,
      mainShardNamespace: MAIN_SHARD_NAMESPACE,
      ipc: this._ipc,
      piniaMobxUtils: this._piniaMobxUtils,
      logger: this._logger,
      settingUtils: this._settingUtils,
      setupInAppScope: this._setupInAppScope,
      matcher: this._matcher
    }
    this._ruleManager = new RendererDebugRuleManager(this._context)
    this._watcher = new RendererDebugWatcher(this._context, this._ruleManager)
  }

  async onInit() {
    const store = useRendererDebugStore()

    await this._piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'state', store)
    await this._watcher.init()
  }

  addRule(rule: string, enabled = true) {
    return this._ruleManager.addRule(rule, enabled)
  }

  enableRule(rule: string) {
    return this._ruleManager.enableRule(rule)
  }

  disableRule(rule: string) {
    return this._ruleManager.disableRule(rule)
  }

  removeRule(rule: string) {
    return this._ruleManager.removeRule(rule)
  }

  async onDispose() {}

  setSendAllNativeLcuEvents(value: boolean) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setSendAllNativeLcuEvents', value)
  }

  setLogAllLcuEvents(value: boolean) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setLogAllLcuEvents', value)
  }
}
