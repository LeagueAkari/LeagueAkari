import { ElectronAPI } from '@electron-toolkit/preload'
import { Dep, IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'
import { IpcRendererEvent } from 'electron'
import { getCurrentScope, onScopeDispose } from 'vue'

import { AkariIpcRendererCallService } from './call-service'
import { AKARI_IPC_RENDERER_NAMESPACE, type AkariIpcRendererContext } from './context'
import { AkariIpcRendererEventRegistry } from './event-registry'

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export type { IpcMainDataType, IpcMainErrorDataType, IpcMainSuccessDataType } from './types'

/**
 * 渲染进程 IPC 工具, 同时杂糅了一点 Vue 的支持
 */
@Shard(AkariIpcRenderer.id)
export class AkariIpcRenderer implements IAkariShardInitDispose {
  static id = AKARI_IPC_RENDERER_NAMESPACE

  private _cancelFn: (() => void) | null = null
  private readonly _eventRegistry = new AkariIpcRendererEventRegistry()
  private readonly _callService: AkariIpcRendererCallService

  private _dispatchEvent(
    _event: IpcRendererEvent,
    namespace: string,
    eventName: string,
    ...args: any[]
  ) {
    this._eventRegistry.dispatch(_event, namespace, eventName, ...args)
  }

  async onInit() {
    this._cancelFn = window.electron.ipcRenderer.on('akari-event', this._dispatchEvent)
    await window.electron.ipcRenderer.invoke('akariRendererRegister', 'register')
  }

  async onDispose() {
    this._cancelFn?.()
    this._cancelFn = null
    this._eventRegistry.clear()
    await window.electron.ipcRenderer.invoke('akariRendererRegister', 'unregister')
  }

  /**
   * 调用一个函数, 若不存在会抛出异常
   * @param namespace
   * @param fnName
   * @param args
   * @returns
   */
  async call<T = any>(namespace: string, fnName: string, ...args: any[]) {
    return this._callService.call<T>(namespace, fnName, ...args)
  }

  /**
   * 期待一个事件
   * @param namespace
   * @param eventName
   * @param fn
   * @returns 取消订阅函数
   */
  onEvent(namespace: string, eventName: string, fn: (...args: any[]) => void) {
    return this._eventRegistry.onEvent(namespace, eventName, fn)
  }

  /**
   * Vue 可自行解除订阅的事件
   */
  onEventVue(namespace: string, eventName: string, fn: (...args: any[]) => void) {
    const disposeFn = this.onEvent(namespace, eventName, fn)
    getCurrentScope() && onScopeDispose(() => disposeFn())
    return disposeFn
  }

  /**
   * 取消订阅一个事件
   * @param namespace
   * @param eventName
   * @param fn
   */
  offEvent(namespace: string, eventName: string, fn: (...args: any[]) => void) {
    this._eventRegistry.offEvent(namespace, eventName, fn)
  }

  constructor(@Dep(SharedGlobalShard) shared: SharedGlobalShard) {
    const context: AkariIpcRendererContext = { shared }
    this._callService = new AkariIpcRendererCallService(context)
    this._dispatchEvent = this._dispatchEvent.bind(this)
  }
}
