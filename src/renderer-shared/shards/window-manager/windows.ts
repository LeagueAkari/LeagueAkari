import { BaseAkariWindowRenderer } from './base-akari-window'
import {
  MAIN_SHARD_NAMESPACE_AUX_WINDOW,
  MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW,
  MAIN_SHARD_NAMESPACE_MAIN_WINDOW,
  MAIN_SHARD_NAMESPACE_ONGOING_GAME_WINDOW,
  MAIN_SHARD_NAMESPACE_OPGG_WINDOW,
  type WindowManagerRendererContext
} from './context'
import {
  useAuxWindowStore,
  useCdTimerWindowStore,
  useMainWindowStore,
  useOngoingGameWindowStore,
  useOpggWindowStore
} from './store'

export class AkariMainWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useMainWindowStore>,
  ReturnType<typeof useMainWindowStore>['settings']
> {
  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      MAIN_SHARD_NAMESPACE_MAIN_WINDOW,
      () => useMainWindowStore(),
      () => useMainWindowStore().settings
    )
  }

  onAskClose(fn: (...args: any[]) => void) {
    return this._context.ipc.onEventVue(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'close-asking', fn)
  }

  setCloseAction(value: string) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'closeAction', value)
  }

  override close(strategy?: string) {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'closeMainWindow', strategy)
  }

  closeForce() {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'closeMainWindowForce')
  }

  setTrafficLightPosition(x: number, y: number) {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_MAIN_WINDOW, 'setTrafficLightPosition', x, y)
  }
}

export class AkariAuxWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useAuxWindowStore>,
  ReturnType<typeof useAuxWindowStore>['settings']
> {
  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      MAIN_SHARD_NAMESPACE_AUX_WINDOW,
      () => useAuxWindowStore(),
      () => useAuxWindowStore().settings
    )
  }

  setAutoShow(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'autoShow', value)
  }

  setEnabled(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'enabled', value)
  }

  setShowSkinSelector(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_AUX_WINDOW, 'showSkinSelector', value)
  }

  repositionToAlignLeagueClientUx() {
    return this._context.ipc.call(
      MAIN_SHARD_NAMESPACE_AUX_WINDOW,
      'repositionToAlignLeagueClientUx',
      'top-right'
    )
  }
}

export class AkariOpggWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useOpggWindowStore>,
  ReturnType<typeof useOpggWindowStore>['settings']
> {
  static SHOW_WINDOW_SHORTCUT_TARGET_ID = `${MAIN_SHARD_NAMESPACE_OPGG_WINDOW}/show`

  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      MAIN_SHARD_NAMESPACE_OPGG_WINDOW,
      () => useOpggWindowStore(),
      () => useOpggWindowStore().settings
    )
  }

  setAutoShow(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'autoShow', value)
  }

  setEnabled(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'enabled', value)
  }

  setShowShortcut(value: string | null) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_OPGG_WINDOW, 'showShortcut', value)
  }

  repositionToAlignLeagueClientUx() {
    return this._context.ipc.call(
      MAIN_SHARD_NAMESPACE_OPGG_WINDOW,
      'repositionToAlignLeagueClientUx',
      'top-left'
    )
  }
}

export class AkariOngoingGameWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useOngoingGameWindowStore>,
  ReturnType<typeof useOngoingGameWindowStore>['settings']
> {
  static SHOW_WINDOW_SHORTCUT_TARGET_ID = `${MAIN_SHARD_NAMESPACE_ONGOING_GAME_WINDOW}/show`

  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      MAIN_SHARD_NAMESPACE_ONGOING_GAME_WINDOW,
      () => useOngoingGameWindowStore(),
      () => useOngoingGameWindowStore().settings
    )
  }

  setEnabled(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_ONGOING_GAME_WINDOW, 'enabled', value)
  }

  setShowShortcut(value: string | null) {
    return this._context.setting.set(
      MAIN_SHARD_NAMESPACE_ONGOING_GAME_WINDOW,
      'showShortcut',
      value
    )
  }
}

export class AkariCdTimerWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useCdTimerWindowStore>,
  ReturnType<typeof useCdTimerWindowStore>['settings']
> {
  static SHOW_WINDOW_SHORTCUT_TARGET_ID = `${MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW}/show`

  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW,
      () => useCdTimerWindowStore(),
      () => useCdTimerWindowStore().settings
    )
  }

  setEnabled(value: boolean) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW, 'enabled', value)
  }

  setShowShortcut(value: string | null) {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW, 'showShortcut', value)
  }

  setTimerType(value: 'countdown' | 'countup') {
    return this._context.setting.set(MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW, 'timerType', value)
  }

  setReverseAdjustmentDirection(value: boolean) {
    return this._context.setting.set(
      MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW,
      'reverseAdjustmentDirection',
      value
    )
  }

  // 一份复制后的逻辑, 嗯. 就这样吧
  sendInGame(text: string) {
    return this._context.ipc.call(MAIN_SHARD_NAMESPACE_CD_TIMER_WINDOW, 'sendInGame', text)
  }
}
