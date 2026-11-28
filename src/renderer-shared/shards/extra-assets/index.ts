import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type { GtimgHeroListJs } from '@shared/data-sources/gtimg'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import {
  EXTRA_ASSETS_MAIN_NAMESPACE,
  EXTRA_ASSETS_RENDERER_NAMESPACE,
  type ExtraAssetsRendererContext
} from './context'
import { syncExtraAssetsState } from './state-sync'

@Shard(ExtraAssetsRenderer.id)
export class ExtraAssetsRenderer implements IAkariShardInitDispose {
  static id = EXTRA_ASSETS_RENDERER_NAMESPACE

  private readonly _context: ExtraAssetsRendererContext

  constructor(
    @Dep(PiniaMobxUtilsRenderer) piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer
  ) {
    this._context = {
      piniaMobxUtils
    }
  }

  async onInit() {
    await syncExtraAssetsState(this._context)
  }

  /**
   * 请求主进程强制刷新 gtimg 英雄列表（含大乱斗周免标记），成功时返回最新列表，失败返回 null
   */
  async refreshGtimgHeroList(): Promise<GtimgHeroListJs | null> {
    return this._ipc.call<GtimgHeroListJs | null>(
      EXTRA_ASSETS_MAIN_NAMESPACE,
      'refreshGtimgHeroList'
    )
  }

  /**
   * 请求主进程拉取官方大乱斗免费英雄名单（每周免费英雄页面数据源），
   * 失败时返回 null
   */
  async refreshAramFreeChampions(): Promise<number[] | null> {
    return this._ipc.call<number[] | null>(
      EXTRA_ASSETS_MAIN_NAMESPACE,
      'refreshAramFreeChampions'
    )
  }

  /**
   * 请求主进程拉取召唤师峡谷每周免费英雄名单（同一数据源），
   * 失败时返回 null
   */
  async refreshRiftFreeChampions(): Promise<number[] | null> {
    return this._ipc.call<number[] | null>(
      EXTRA_ASSETS_MAIN_NAMESPACE,
      'refreshRiftFreeChampions'
    )
  }
}
