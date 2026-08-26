export class ChampionDataRequestController {
  private readonly _requests = new Map<string, AbortController>()

  async run<T>(
    rendererId: number,
    requestId: string,
    load: (signal: AbortSignal) => Promise<T>
  ): Promise<T> {
    const key = this._key(rendererId, requestId)
    this._requests.get(key)?.abort()

    const controller = new AbortController()
    this._requests.set(key, controller)

    try {
      return await load(controller.signal)
    } finally {
      if (this._requests.get(key) === controller) {
        this._requests.delete(key)
      }
    }
  }

  cancel(rendererId: number, requestId: string) {
    const key = this._key(rendererId, requestId)
    const controller = this._requests.get(key)
    if (!controller) return false

    controller.abort()
    this._requests.delete(key)
    return true
  }

  cancelAll() {
    for (const controller of this._requests.values()) controller.abort()
    this._requests.clear()
  }

  private _key(rendererId: number, requestId: string) {
    return `${rendererId}:${requestId}`
  }
}
