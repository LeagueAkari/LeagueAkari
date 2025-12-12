export class TimeoutTask {
  private _timerId: NodeJS.Timeout | null = null
  private _isStarted = false
  private readonly _callback: () => void
  private _delay: number

  /**
   * @param callback 回调函数（不可变）
   * @param config 可选配置
   */
  constructor(callback: () => void, config?: { delay?: number }) {
    this._callback = callback
    this._delay = config?.delay ?? 0
  }

  /**
   * 是否已经启动
   */
  get isStarted(): boolean {
    return this._isStarted
  }

  /**
   * 本次任务的时间
   */
  get delay(): number {
    return this._delay
  }

  /**
   * 取消定时任务
   * @returns 是否成功取消（如果当前未启动则返回 false）
   */
  cancel(): boolean {
    if (!this._isStarted || !this._timerId) {
      return false
    }
    clearTimeout(this._timerId)
    this._timerId = null
    this._isStarted = false
    return true
  }

  /**
   * 启动定时器，或刷新计时器
   * @param config 可选配置；不传则使用当前预设的延时
   */
  start(config?: { delay?: number }): void {
    if (config?.delay !== undefined) {
      this._delay = config.delay
    }

    this.cancel()

    this._isStarted = true
    this._timerId = setTimeout(() => {
      this._callback()
      this._isStarted = false
      this._timerId = null
    }, this._delay)
  }

  /**
   * 触发回调并立即取消定时器
   */
  triggerCompletion(): void {
    if (this._isStarted) {
      this._callback()
      this.cancel()
    }
  }
}

export interface IntervalTaskStartOptions {
  /**
   * 间隔时间
   */
  interval?: number

  /**
   * 是否立即执行
   */
  runImmediately?: boolean
}

export class IntervalTask {
  private _intervalId: NodeJS.Timeout | null = null
  private _isStarted = false
  private readonly _callback: () => void
  private _interval: number

  /**
   * @param callback 回调函数（不可变）
   * @param config 可选配置
   */
  constructor(callback: () => void, config?: IntervalTaskStartOptions & { start?: boolean }) {
    this._callback = callback
    this._interval = config?.interval ?? 0
    if (config?.start) {
      this.start({ runImmediately: config.runImmediately })
    }
  }

  /** 是否已经启动 */
  get isStarted(): boolean {
    return this._isStarted
  }

  /** 取消周期任务 */
  cancel(): boolean {
    if (!this._isStarted || !this._intervalId) return false
    clearInterval(this._intervalId)
    this._intervalId = null
    this._isStarted = false
    return true
  }

  /**
   * 启动周期任务
   * @param config 可选配置
   */
  start(config?: IntervalTaskStartOptions): void {
    if (config?.interval !== undefined) this._interval = config.interval

    this.cancel() // 避免重复

    if (config?.runImmediately) {
      this._callback()
    }

    this._isStarted = true
    this._intervalId = setInterval(() => {
      this._callback()
    }, this._interval)
  }
}
