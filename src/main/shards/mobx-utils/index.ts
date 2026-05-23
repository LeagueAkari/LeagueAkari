import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { Paths } from '@shared/utils/types'
import type { WebContents } from 'electron'
import _ from 'lodash'
import { IReactionOptions, IReactionPublic, isObservable, reaction, toJS } from 'mobx'

import { AkariIpcMain } from '../ipc'
import { MOBX_UTILS_MAIN_NAMESPACE, type MobxUtilsMainContext } from './context'
import { MobxUtilsIpcHandlers } from './ipc-handlers'

interface PropConfig {
  /**
   * 用于指示渲染进程此 key 是否应该被 markRaw, 默认情况下为 true
   *
   * **在 `update-state-prop` 事件中, 如果 `raw` 为 true, 则需要将值 markRaw**
   */
  raw: boolean
}

interface RegisteredState {
  object: object
  props: Map<string, PropConfig>
}

/**
 * 封装的 Mobx 工具方法, 负责状态同步
 */
@Shard(MobxUtilsMain.id)
export class MobxUtilsMain implements IAkariShardInitDispose {
  static id = MOBX_UTILS_MAIN_NAMESPACE

  private readonly _disposables = new Set<Function>()
  protected readonly _registeredStates = new Map<string, RegisteredState>()

  /**
   * 为减少同步开销, 仅在被订阅时才会推送事件
   * uniqueId (namespace:stateId) -> webContentsIds
   */
  private readonly _rendererSubscription = new Map<string, Set<number>>()
  private readonly _context: MobxUtilsMainContext
  private readonly _ipcHandlers: MobxUtilsIpcHandlers

  constructor(private readonly _ipc: AkariIpcMain) {
    this._context = {
      namespace: MobxUtilsMain.id,
      ipc: this._ipc,
      mobxUtils: this
    }
    this._ipcHandlers = new MobxUtilsIpcHandlers(this._context)
  }

  async onInit() {
    this._ipcHandlers.register()
  }

  async onDispose() {
    this._disposables.forEach((dispose) => dispose())
    this._disposables.clear()
    this._registeredStates.clear()
    this._rendererSubscription.clear()
  }

  /**
   * 在本地的 Mobx 状态对象上注册任意个属性, 当发生变化时, 推送一个事件
   * @param namespace 命名空间
   * @param stateId 状态 ID
   * @param obj Mobx 状态对象
   * @param propPath 属性路径
   */
  propSync<T extends object>(
    namespace: string,
    stateId: string,
    obj: T,
    propPath: Paths<T> | Paths<T>[],
    config: Partial<PropConfig> = {}
  ) {
    const key = `${namespace}:${stateId}`

    if (!this._rendererSubscription.has(key)) {
      this._rendererSubscription.set(key, new Set())
    }

    if (!this._registeredStates.has(key)) {
      this._registeredStates.set(key, {
        object: obj,
        props: new Map()
      })
    }

    const state = this._registeredStates.get(key)!

    if (state.object !== obj) {
      throw new Error(`State ${key} already registered with different object`)
    }

    const { raw = true } = config
    const paths = Array.isArray(propPath) ? propPath : [propPath]

    for (const path of paths) {
      if (state.props.has(path)) {
        throw new Error(`Prop path ${path} already registered for ${stateId}`)
      }

      state.props.set(path, { raw })

      const fn = reaction(
        () => _.get(obj, path),
        (newValue) => {
          this._rendererSubscription.get(key)?.forEach((wcId) => {
            this._ipc.sendEventToWebContents(
              wcId,
              MobxUtilsMain.id,
              `update-state-prop/${key}`,
              path,
              isObservable(newValue) ? toJS(newValue) : newValue,
              { action: 'update', raw }
            )
          })
        }
      )

      this._disposables.add(fn)
    }
  }

  /**
   * 手动推送子层级的状态更新, 必须被用在深层属性上
   */
  notifyStatePropChange(
    namespace: string,
    stateId: string,
    propPath: string,
    newValue: any,
    config: Partial<PropConfig & { action: 'update' | 'delete' }> = {}
  ) {
    const key = `${namespace}:${stateId}`

    if (!this._rendererSubscription.has(key)) {
      return
    }

    if (!this._registeredStates.has(key)) {
      throw new Error(`State ${key} not found`)
    }

    const { action = 'update', raw = true } = config

    this._rendererSubscription.get(key)?.forEach((wcId) => {
      this._ipc.sendEventToWebContents(
        wcId,
        MobxUtilsMain.id,
        `update-state-prop/${key}`,
        propPath,
        isObservable(newValue) ? toJS(newValue) : newValue,
        { action, raw }
      )
    })
  }

  subscribeAndGetInitialState(sender: WebContents, namespace: string, stateId: string) {
    const key = `${namespace}:${stateId}`
    if (!this._registeredStates.has(key) || !this._rendererSubscription.has(key)) {
      throw new Error(`State ${key} not found`)
    }

    const subs = this._rendererSubscription.get(key)!
    if (!subs.has(sender.id)) {
      subs.add(sender.id)
      sender.on('destroyed', () => subs.delete(sender.id))
    }

    const state = this._registeredStates.get(key)!
    const props = Array.from(state.props.entries()).map(([path, config]) => ({
      path,
      config
    }))

    return props.reduce(
      (acc, { path, config }) => {
        const _value = _.get(state.object, path)
        acc[path] = {
          value: isObservable(_value) ? toJS(_value) : _value,
          config
        }
        return acc
      },
      {} as Record<string, { value: any; config: PropConfig }>
    )
  }

  /**
   * 和 Mobx 的 reaction 方法类似, 但是会管理 reaction 的销毁
   */
  reaction<T, FireImmediately extends boolean = false>(
    expression: (r: IReactionPublic) => T,
    effect: (
      arg: T,
      prev: FireImmediately extends true ? T | undefined : T,
      r: IReactionPublic
    ) => void,
    opts?: IReactionOptions<T, FireImmediately>
  ): () => void {
    const disposer = reaction(expression, effect, opts)
    this._disposables.add(disposer)

    return () => {
      if (this._disposables.has(disposer)) {
        this._disposables.delete(disposer)
        disposer()
      }
    }
  }
}
