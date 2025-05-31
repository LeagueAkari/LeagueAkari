import { Shard } from '@shared/akari-shard'
import { VNode } from 'vue'

/**
 * 用于处理作用域问题
 *
 * 必须是同步函数, 且需将组件 <SetupInAppScope /> 放置于应用范围中
 */
@Shard(SetupInAppScopeRenderer.id)
export class SetupInAppScopeRenderer {
  static id = 'setup-in-app-scope-renderer'

  private _renderVNodes: (() => VNode)[] = []
  private _setupFns: (() => void)[] = []

  setup() {
    this._setupFns.forEach((fn) => fn())
  }

  get renderVNodes() {
    return this._renderVNodes
  }

  addRenderVNode(comp: () => VNode) {
    this._renderVNodes.push(comp)
  }

  addSetupFn(fn: () => void) {
    this._setupFns.push(fn)
  }

  removeSetupFn(fn: () => void) {
    const index = this._setupFns.indexOf(fn)
    if (index !== -1) {
      this._setupFns.splice(index, 1)
    }
  }

  removeRenderVNode(comp: () => VNode) {
    const index = this._renderVNodes.indexOf(comp)
    if (index !== -1) {
      this._renderVNodes.splice(index, 1)
    }
  }

  clearSetupFns() {
    this._setupFns = []
  }

  clearRenderVNodes() {
    this._renderVNodes = []
  }
}
