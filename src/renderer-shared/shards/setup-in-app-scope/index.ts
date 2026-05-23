import { Shard } from '@shared/akari-shard'
import { VNode } from 'vue'

import { SETUP_IN_APP_SCOPE_RENDERER_NAMESPACE } from './context'
import { SetupInAppScopeRegistry } from './scope-registry'

/**
 * 用于处理作用域问题
 *
 * 必须是同步函数, 且需将组件 <SetupInAppScope /> 放置于应用范围中
 */
@Shard(SetupInAppScopeRenderer.id)
export class SetupInAppScopeRenderer {
  static id = SETUP_IN_APP_SCOPE_RENDERER_NAMESPACE

  private readonly _registry = new SetupInAppScopeRegistry()

  runSetupFns() {
    this._registry.runSetupFns()
  }

  get renderVNodes() {
    return this._registry.renderVNodes
  }

  addRenderVNode(comp: () => VNode) {
    this._registry.addRenderVNode(comp)
  }

  addSetupFn(fn: () => void) {
    this._registry.addSetupFn(fn)
  }

  removeSetupFn(fn: () => void) {
    this._registry.removeSetupFn(fn)
  }

  removeRenderVNode(comp: () => VNode) {
    this._registry.removeRenderVNode(comp)
  }

  clearSetupFns() {
    this._registry.clearSetupFns()
  }

  clearRenderVNodes() {
    this._registry.clearRenderVNodes()
  }
}
