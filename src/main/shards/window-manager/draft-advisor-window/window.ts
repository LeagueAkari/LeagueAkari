import icon from '@resources/LA_ICON.ico?asset&asarUnpack'
import { compareShallow } from 'mobx'

import { BaseAkariWindow } from '../base-akari-window'
import type { WindowManagerMainContext } from '../context'
import { DraftAdvisorWindowSettings, DraftAdvisorWindowState } from './state'

/**
 * 选人推荐窗口。它只应该在英雄选择阶段出现, 因此显示与否由 LCU 的 champ-select
 * 会话驱动, 而不是像其他窗口那样依赖用户手动开关。
 */
export class AkariDraftAdvisorWindow extends BaseAkariWindow<
  DraftAdvisorWindowState,
  DraftAdvisorWindowSettings
> {
  static readonly NAMESPACE_SUFFIX = 'draft-advisor-window'
  static readonly HTML_ENTRY = 'draft-advisor-window.html'
  static readonly TITLE = 'Akari Draft Advisor'

  // 三栏布局：双方阵容各占一栏, 中间留给候选榜, 因此比其他小窗口宽得多。
  static readonly BASE_WIDTH = 900
  static readonly BASE_HEIGHT = 560
  static readonly MIN_WIDTH = 760
  static readonly MIN_HEIGHT = 360

  constructor(_context: WindowManagerMainContext) {
    const state = new DraftAdvisorWindowState()
    const settings = new DraftAdvisorWindowSettings()

    super(_context, AkariDraftAdvisorWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariDraftAdvisorWindow.BASE_WIDTH,
      baseHeight: AkariDraftAdvisorWindow.BASE_HEIGHT,
      minWidth: AkariDraftAdvisorWindow.MIN_WIDTH,
      minHeight: AkariDraftAdvisorWindow.MIN_HEIGHT,
      htmlEntry: AkariDraftAdvisorWindow.HTML_ENTRY,
      rememberPosition: true,
      rememberSize: true,
      repositionWindowIfInvisible: true,
      browserWindowOptions: {
        title: AkariDraftAdvisorWindow.TITLE,
        icon: icon,
        show: false,
        frame: true,
        resizable: true,
        maximizable: false,
        fullscreenable: false,
        autoHideMenuBar: true,
        skipTaskbar: false
      }
    })
  }

  private _watchChampSelect() {
    // 必须把 `ready` 一起纳入表达式: 窗口只在首次选人时创建, 之后进入选人阶段
    // `createWindow()` 已经是空操作, 若只监听会话变化, 第二次选人就再也不会显示了。
    this._mobxUtils.reaction(
      () => ({
        inChampSelect: this._leagueClient.data.champSelect.session !== null,
        finishedInit: this._windowManager.state.isManagerFinishedInit,
        ready: this.state.ready
      }),
      ({ inChampSelect, finishedInit, ready }) => {
        if (!finishedInit) {
          return
        }

        if (!inChampSelect) {
          this.hide()
          return
        }

        // 未就绪时先建窗, 等 `ready` 变化后这一分支会再跑一次并显示,
        // 避免把尚未渲染完成的空窗口闪出来。
        if (!ready) {
          this.createWindow()
          return
        }

        // 用户正在游戏客户端里操作, 窗口不应抢走焦点。
        this.show(true)
      },
      { fireImmediately: true, equals: compareShallow }
    )
  }

  override async onInit() {
    await super.onInit()

    this._watchChampSelect()
  }

  // 该窗口没有超出基类的设置项, 而基类已经同步了 `pinned` 与 `opacity`,
  // 这里再列一次会被 propSync 判定为重复路径。
  protected override getSettingPropKeys() {
    return [] as const
  }

  protected override getStatePropKeys() {
    return [] as const
  }
}
