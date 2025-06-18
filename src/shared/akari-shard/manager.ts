import { Constructor, Shard } from './decorators'
import { AkariSharedGlobal } from './interface'

export type ExternalShardConstructor = {
  new (...args: any[]): any
  id: string | symbol
  priority: number
  dependencies: (string | symbol)[]
}

export interface ShardMetadata {
  id: string | symbol

  /**
   * 数值越高, 优先级越高
   */
  priority: number

  /**
   * 其中一个参数可以被标记为配置项, 只能有一个配置项参数
   */
  configParamIndex?: number

  /**
   * 一些参数可以被强覆盖为其他模块, 而不是按照 TypeScript 的类型反射
   */
  depOverrides?: Map<number, string | Constructor>

  /**
   * 基于 TypeScript 反射获取的构造函数参数依赖 ID 列表. 若不是某个模块则为 null (它必须在 depOverrides 中被覆盖)
   */
  ctorParamDepIds: (string | symbol | null)[]
}

export type CtorParamType =
  | {
      type: 'depId'
      depId: string | symbol
    }
  | {
      type: 'config'
    }
  | {
      type: 'empty'
    }

export class AkariManager {
  private _registry: Map<
    string | symbol,
    {
      id: string | symbol
      priority: number
      ctorParamArr: CtorParamType[]
      ctor: Constructor
      config?: object
    }
  > = new Map()

  private _instances: Map<string | symbol, any> = new Map()

  private _isSetup = false
  private _initializationOrder: string[] = []

  // @ts-ignore
  public readonly global: AkariSharedGlobal = {}

  public static readonly SHARED_GLOBAL_ID = Symbol('<akari-shared-global>')
  public static readonly INTERNAL_RUNNER_ID = Symbol('<akari-shard-runner~(∠・ω<)⌒★>')

  use(shard: Constructor, config?: object) {
    const { id, priority } = this._extractMetadata(shard)

    if (this._registry.has(id)) {
      throw new Error(`Shard with id "${id.toString()}" already exists`)
    }

    const arr = this._getCtorParamTypeList(shard)

    this._registry.set(id, { id, priority, ctorParamArr: arr, ctor: shard, config })
  }

  /**
   * for external shards
   */
  useExternal(shard: ExternalShardConstructor, config?: object) {
    const id = shard.id
    const deps = shard.dependencies || []

    if (!id) {
      throw new Error('External shard id is required')
    }

    if (this._registry.has(id)) {
      throw new Error(`Shard with id "${id.toString()}" already exists`)
    }

    const priority = shard.priority || 0

    this._registry.set(shard.id, {
      id,
      priority,
      ctorParamArr: deps.map((dep) => ({ type: 'depId', depId: dep })),
      ctor: shard,
      config
    })
  }

  /**
   * 启用所有注册的模块，进行依赖解析、实例化和生命周期钩子调用
   */
  async setup() {
    if (this._isSetup) {
      throw new Error('Already setup')
    }

    this._registry.set(AkariManager.SHARED_GLOBAL_ID, {
      id: AkariManager.SHARED_GLOBAL_ID,
      priority: -Infinity,
      ctorParamArr: [],
      ctor: SharedGlobalShard
    })

    // internal runner references all shards except itself
    this._registry.set(AkariManager.INTERNAL_RUNNER_ID, {
      id: AkariManager.INTERNAL_RUNNER_ID,
      priority: -Infinity,
      ctorParamArr: Array.from(this._registry.values())
        .filter((d) => d.id !== AkariManager.INTERNAL_RUNNER_ID)
        .map((r) => ({ type: 'depId', depId: r.id })),
      ctor: __InternalRunner
    })

    // shared global shard is a singleton
    this._instances.set(AkariManager.SHARED_GLOBAL_ID, new SharedGlobalShard(this))

    this._initializationOrder = []
    this._initializeShard(
      AkariManager.INTERNAL_RUNNER_ID,
      new Set<string>(),
      this._initializationOrder
    )

    for (const id of this._initializationOrder) {
      const instance = this._instances.get(id)
      if (instance && instance.onInit) {
        await instance.onInit()
      }
    }

    for (const id of this._initializationOrder) {
      const instance = this._instances.get(id)
      if (instance && instance.onFinish) {
        await instance.onFinish()
      }
    }

    this._isSetup = true
  }

  async dispose() {
    if (!this._isSetup) {
      throw new Error('Not setup yet')
    }

    const reversed = this._initializationOrder.toReversed()
    for (const id of reversed) {
      const instance = this._instances.get(id)
      if (instance && instance.onDispose) {
        await instance.onDispose()
      }
    }

    this._instances.clear()
    this._initializationOrder = []
    this._isSetup = false
  }

  /**
   * 获取某个模块的实例
   * @param id 模块 ID 或构造函数
   * @returns 模块实例（可能为 undefined）
   */
  getInstance(id: string | symbol): any | undefined
  getInstance<T extends new (...args: any[]) => any>(ctor: T): InstanceType<T> | undefined
  getInstance(idOrCtor: string | symbol | Constructor) {
    if (typeof idOrCtor === 'string' || typeof idOrCtor === 'symbol') {
      return this._instances.get(idOrCtor)
    }

    return this.getInstance(this._extractMetadata(idOrCtor).id)
  }

  /**
   * 仅用于调试：返回模块初始化顺序
   * 仅在 setup 后有效
   */
  _getInitializationOrder() {
    return this._initializationOrder
  }

  private _initializeShard(
    id: string | symbol,
    visited: Set<string | symbol>,
    order: (string | symbol)[]
  ) {
    const c = this._registry.get(id)
    if (!c) {
      throw new Error(`Shard not registered: "${id.toString()}"`)
    }

    const depCtorParamArr = c.ctorParamArr.filter((p) => p.type === 'depId')
    for (const dep of depCtorParamArr) {
      if (!this._registry.has(dep.depId)) {
        throw new Error(`Shard not registered: "${dep.depId.toString()}"`)
      }
    }

    const instances = new Map<string | symbol, any>()

    if (depCtorParamArr.length) {
      const sortedDepIds = depCtorParamArr.toSorted((a, b) => {
        const aM = this._registry.get(a.depId)!
        const bM = this._registry.get(b.depId)!
        return bM.priority - aM.priority
      })

      for (const { depId } of sortedDepIds) {
        if (visited.has(depId)) {
          throw new Error(`Circular dependency detected: ${[...visited, depId].join(' -> ')}`)
        }

        if (this._instances.has(depId)) {
          instances.set(depId, this._instances.get(depId)!)
        } else {
          visited.add(depId)
          instances.set(depId, this._initializeShard(depId, visited, order))
          visited.delete(depId)
        }
      }
    }

    order.push(id)

    const params = c.ctorParamArr.map((p) => {
      if (p.type === 'depId') {
        return instances.get(p.depId)
      } else if (p.type === 'config') {
        return c.config
      } else {
        return undefined
      }
    })

    const instance = new c.ctor(...params)
    this._instances.set(id, instance)

    return instance
  }

  private _extractMetadata(target: Constructor): ShardMetadata {
    const id = Reflect.getMetadata('akari:id', target)
    const priority = Reflect.getMetadata('akari:priority', target)

    if (!id || priority === undefined) {
      throw new Error(`Shard metadata not found on ${target.name}`)
    }

    const configParamIndex = Reflect.getMetadata('akari:configParamIndex', target) || -1
    const depOverrides = Reflect.getMetadata('akari:depOverrides', target) as
      | Map<number, string | Constructor>
      | undefined

    const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', target) || []
    const ctorParamDepIds = paramTypes.map((p: Function) => {
      if (this._isShard(p)) {
        return Reflect.getMetadata('akari:id', p)
      }

      return null
    })

    return { id, priority, configParamIndex, depOverrides, ctorParamDepIds }
  }

  private _getCtorParamTypeList(target: Constructor): CtorParamType[] {
    const { depOverrides, configParamIndex = -1, ctorParamDepIds } = this._extractMetadata(target)

    const maxDepOverridesIndex = depOverrides ? Math.max(...Array.from(depOverrides.keys())) : -1
    const length = Math.max(ctorParamDepIds.length, configParamIndex + 1, maxDepOverridesIndex + 1)
    const ctorParamArr: CtorParamType[] = []

    for (let i = 0; i < length; i++) {
      if (depOverrides && depOverrides.has(i)) {
        const dep = depOverrides.get(i)!

        if (typeof dep === 'function') {
          ctorParamArr.push({ type: 'depId', depId: this._extractMetadata(dep).id })
        } else {
          ctorParamArr.push({ type: 'depId', depId: dep })
        }
      } else if (i === configParamIndex) {
        ctorParamArr.push({ type: 'config' })
      } else if (ctorParamDepIds[i]) {
        ctorParamArr.push({ type: 'depId', depId: ctorParamDepIds[i]! })
      } else {
        ctorParamArr.push({ type: 'empty' })
      }
    }

    return ctorParamArr
  }

  private _isShard(target: any): target is Constructor {
    if (typeof target !== 'function' || !target.prototype) {
      return false
    }

    return Reflect.hasMetadata('akari:id', target)
  }
}

/**
 * should not be instantiated directly, managed by AkariManager
 */
@Shard(AkariManager.SHARED_GLOBAL_ID, -Infinity)
export class SharedGlobalShard {
  /** an alias for AkariManager.global */
  public global: AkariSharedGlobal

  constructor(public manager: AkariManager) {
    this.global = manager.global
  }
}

@Shard(AkariManager.INTERNAL_RUNNER_ID, -Infinity)
class __InternalRunner {}
