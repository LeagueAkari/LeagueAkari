import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type { IpcMainInvokeEvent, WebContents } from 'electron'

import { AKARI_IPC_MAIN_NAMESPACE } from './context'
import { AkariIpcInvocationRouter } from './invocation-router'

export {
  AkariIpcError,
  type IpcMainDataType,
  type IpcMainErrorDataType,
  type IpcMainSuccessDataType
} from './types'

/**
 * League Akari 的 IPC 主进程实现
 */
@Shard(AkariIpcMain.id)
export class AkariIpcMain implements IAkariShardInitDispose {
  static id = AKARI_IPC_MAIN_NAMESPACE

  private readonly _router = new AkariIpcInvocationRouter()

  async onInit() {
    this._router.attach()
  }

  async onDispose() {
    this._router.detach()
  }

  /**
   * 发送到所有已注册的渲染进程, 事件名使用 kebab-case
   */
  sendEvent(namespace: string, eventName: string, ...args: any[]) {
    this._router.sendEvent(namespace, eventName, ...args)
  }

  sendEventToWebContents(w: number, namespace: string, eventName: string, ...args: any[]): void
  sendEventToWebContents(w: WebContents, namespace: string, eventName: string, ...args: any[]): void
  sendEventToWebContents(
    w: WebContents | number,
    namespace: string,
    eventName: string,
    ...args: any[]
  ) {
    if (typeof w === 'number') {
      this._router.sendEventToWebContents(w, namespace, eventName, ...args)
    } else {
      this._router.sendEventToWebContents(w, namespace, eventName, ...args)
    }
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
    this._router.onCall(namespace, fnName, cb)
  }

  /**
   * 获取已注册的渲染进程 ID 列表
   */
  getRegisteredRendererIds() {
    return this._router.getRegisteredRendererIds()
  }
}
