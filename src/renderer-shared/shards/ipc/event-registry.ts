import type { IpcRendererEvent } from 'electron'

export class AkariIpcRendererEventRegistry {
  private readonly _eventMap = new Map<string, Set<Function>>()

  dispatch(_event: IpcRendererEvent, namespace: string, eventName: string, ...args: any[]) {
    const key = `${namespace}:${eventName}`
    const functions = this._eventMap.get(key)

    if (functions) {
      for (const fn of functions) {
        fn(...args)
      }
    }
  }

  onEvent(namespace: string, eventName: string, fn: (...args: any[]) => void) {
    const key = `${namespace}:${eventName}`

    if (!this._eventMap.has(key)) {
      this._eventMap.set(key, new Set())
    }

    this._eventMap.get(key)!.add(fn)

    return () => {
      this.offEvent(namespace, eventName, fn)
    }
  }

  offEvent(namespace: string, eventName: string, fn: (...args: any[]) => void) {
    const key = `${namespace}:${eventName}`
    const functions = this._eventMap.get(key)

    if (functions) {
      functions.delete(fn)
    }
  }

  clear() {
    this._eventMap.clear()
  }
}
