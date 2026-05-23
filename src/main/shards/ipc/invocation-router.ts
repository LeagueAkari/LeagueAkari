import { IpcMainInvokeEvent, WebContents, ipcMain, webContents } from 'electron'

import { toIpcErrorResponse } from './error-response'

export class AkariIpcInvocationRouter {
  /**
   * 调用映射, 对应不同 namespace:key 的调用
   */
  private _callMap = new Map<string, Function>()
  private _renderers = new Set<number>()

  constructor() {
    this._processRendererInvocation = this._processRendererInvocation.bind(this)
    this._processRendererRegister = this._processRendererRegister.bind(this)
  }

  attach() {
    ipcMain.handle('akariCall', this._processRendererInvocation)
    ipcMain.handle('akariRendererRegister', this._processRendererRegister)
  }

  detach() {
    ipcMain.removeHandler('akariCall')
    ipcMain.removeHandler('akariRendererRegister')
    this._callMap.clear()
  }

  /**
   * 发送到所有已注册的渲染进程, 事件名使用 kebab-case
   */
  sendEvent(namespace: string, eventName: string, ...args: any[]) {
    this._renderers.forEach((id) =>
      webContents.fromId(id)?.send('akari-event', namespace, eventName, ...args)
    )
  }

  sendEventToWebContents(w: number, namespace: string, eventName: string, ...args: any[]): void
  sendEventToWebContents(w: WebContents, namespace: string, eventName: string, ...args: any[]): void
  sendEventToWebContents(
    w: WebContents | number,
    namespace: string,
    eventName: string,
    ...args: any[]
  ) {
    const wc = typeof w === 'number' ? webContents.fromId(w) : w
    wc?.send('akari-event', namespace, eventName, ...args)
  }

  /**
   * 处理来自渲染进程的调用, 方法名使用 camelCase
   * @param cb
   */
  onCall(
    namespace: string,
    fnName: string,
    cb: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any> | any
  ) {
    const key = `${namespace}:${fnName}`
    if (this._callMap.has(key)) {
      throw new Error(`Function "${fnName}" in namespace "${namespace}" already exists`)
    }

    this._callMap.set(key, cb)
  }

  /**
   * 获取已注册的渲染进程 ID 列表
   */
  getRegisteredRendererIds() {
    return Array.from(this._renderers)
  }

  private _processRendererInvocation(
    event: IpcMainInvokeEvent,
    namespace: string,
    fnName: string,
    ...args: any[]
  ) {
    const key = `${namespace}:${fnName}`
    const fn = this._callMap.get(key)

    if (!fn) {
      throw new Error(`No function "${fnName}" in namespace "${namespace}"`)
    }

    return AkariIpcInvocationRouter._standardizeIpcData(() => fn(event, ...args))
  }

  /**
   * 处理来自渲染进程的事件订阅
   * @param event
   * @param action 可选值 register / unregister
   */
  private _processRendererRegister(event: IpcMainInvokeEvent, action = 'register') {
    const id = event.sender.id

    if (action === 'register' && !this._renderers.has(id)) {
      this._renderers.add(id)
      event.sender.on('destroyed', () => this._renderers.delete(id))
      return { success: true }
    } else if (action === 'unregister' && this._renderers.has(id)) {
      this._renderers.delete(id)
      return { success: true }
    }

    return { success: false, error: { message: `invalid action "${action}"` } }
  }

  private static _standardizeIpcData(wrappedFn: Function) {
    try {
      const result = wrappedFn()
      if (result instanceof Promise) {
        return result
          .then((res) => ({ success: true, data: res }))
          .catch((error: any) => toIpcErrorResponse(error))
      } else {
        return { success: true, data: result }
      }
    } catch (error) {
      return toIpcErrorResponse(error)
    }
  }
}
