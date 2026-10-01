import { BaseAkariWindowRenderer } from './base-akari-window'
import {
  AUX_WINDOW_MAIN_NAMESPACE,
  CD_TIMER_WINDOW_MAIN_NAMESPACE,
  CHAMPION_DATA_WINDOW_MAIN_NAMESPACE,
  MAIN_WINDOW_MAIN_NAMESPACE,
  ONGOING_GAME_WINDOW_MAIN_NAMESPACE,
  type WindowManagerRendererContext
} from './context'
import {
  useAuxWindowStore,
  useCdTimerWindowStore,
  useChampionDataWindowStore,
  useMainWindowStore,
  useOngoingGameWindowStore
} from './store'

export class AkariMainWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useMainWindowStore>,
  ReturnType<typeof useMainWindowStore>['settings']
> {
  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      MAIN_WINDOW_MAIN_NAMESPACE,
      () => useMainWindowStore(),
      () => useMainWindowStore().settings
    )
  }

  onAskClose(fn: (...args: any[]) => void) {
    return this._context.ipc.onEventVue(MAIN_WINDOW_MAIN_NAMESPACE, 'close-asking', fn)
  }

  setCloseAction(value: string) {
    return this._context.setting.set(MAIN_WINDOW_MAIN_NAMESPACE, 'closeAction', value)
  }

  override close(strategy?: string) {
    return this._context.ipc.call(MAIN_WINDOW_MAIN_NAMESPACE, 'closeMainWindow', strategy)
  }

  closeForce() {
    return this._context.ipc.call(MAIN_WINDOW_MAIN_NAMESPACE, 'closeMainWindowForce')
  }

  setTrafficLightPosition(x: number, y: number) {
    return this._context.ipc.call(MAIN_WINDOW_MAIN_NAMESPACE, 'setTrafficLightPosition', x, y)
  }
}

export class AkariAuxWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useAuxWindowStore>,
  ReturnType<typeof useAuxWindowStore>['settings']
> {
  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      AUX_WINDOW_MAIN_NAMESPACE,
      () => useAuxWindowStore(),
      () => useAuxWindowStore().settings
    )
  }

  setAutoShow(value: boolean) {
    return this._context.setting.set(AUX_WINDOW_MAIN_NAMESPACE, 'autoShow', value)
  }

  setEnabled(value: boolean) {
    return this._context.setting.set(AUX_WINDOW_MAIN_NAMESPACE, 'enabled', value)
  }

  repositionToAlignLeagueClientUx() {
    return this._context.ipc.call(
      AUX_WINDOW_MAIN_NAMESPACE,
      'repositionToAlignLeagueClientUx',
      'top-right'
    )
  }
}

export class AkariChampionDataWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useChampionDataWindowStore>,
  ReturnType<typeof useChampionDataWindowStore>['settings']
> {
  static SHOW_WINDOW_SHORTCUT_TARGET_ID = `${CHAMPION_DATA_WINDOW_MAIN_NAMESPACE}/show`

  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      CHAMPION_DATA_WINDOW_MAIN_NAMESPACE,
      () => useChampionDataWindowStore(),
      () => useChampionDataWindowStore().settings
    )
  }

  setAutoShow(value: boolean) {
    return this._context.setting.set(CHAMPION_DATA_WINDOW_MAIN_NAMESPACE, 'autoShow', value)
  }

  setEnabled(value: boolean) {
    return this._context.setting.set(CHAMPION_DATA_WINDOW_MAIN_NAMESPACE, 'enabled', value)
  }

  setShowShortcut(value: string | null) {
    return this._context.setting.set(CHAMPION_DATA_WINDOW_MAIN_NAMESPACE, 'showShortcut', value)
  }

  setShowSkinSelector(value: boolean) {
    return this._context.setting.set(CHAMPION_DATA_WINDOW_MAIN_NAMESPACE, 'showSkinSelector', value)
  }

  repositionToAlignLeagueClientUx() {
    return this._context.ipc.call(
      CHAMPION_DATA_WINDOW_MAIN_NAMESPACE,
      'repositionToAlignLeagueClientUx',
      'top-left'
    )
  }
}

export class AkariOngoingGameWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useOngoingGameWindowStore>,
  ReturnType<typeof useOngoingGameWindowStore>['settings']
> {
  static SHOW_WINDOW_SHORTCUT_TARGET_ID = `${ONGOING_GAME_WINDOW_MAIN_NAMESPACE}/show`

  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      ONGOING_GAME_WINDOW_MAIN_NAMESPACE,
      () => useOngoingGameWindowStore(),
      () => useOngoingGameWindowStore().settings
    )
  }

  setEnabled(value: boolean) {
    return this._context.setting.set(ONGOING_GAME_WINDOW_MAIN_NAMESPACE, 'enabled', value)
  }

  setShowShortcut(value: string | null) {
    return this._context.setting.set(ONGOING_GAME_WINDOW_MAIN_NAMESPACE, 'showShortcut', value)
  }
}

export class AkariCdTimerWindow extends BaseAkariWindowRenderer<
  ReturnType<typeof useCdTimerWindowStore>,
  ReturnType<typeof useCdTimerWindowStore>['settings']
> {
  static SHOW_WINDOW_SHORTCUT_TARGET_ID = `${CD_TIMER_WINDOW_MAIN_NAMESPACE}/show`

  constructor(_context: WindowManagerRendererContext) {
    super(
      _context,
      CD_TIMER_WINDOW_MAIN_NAMESPACE,
      () => useCdTimerWindowStore(),
      () => useCdTimerWindowStore().settings
    )
  }

  setEnabled(value: boolean) {
    return this._context.setting.set(CD_TIMER_WINDOW_MAIN_NAMESPACE, 'enabled', value)
  }

  setShowShortcut(value: string | null) {
    return this._context.setting.set(CD_TIMER_WINDOW_MAIN_NAMESPACE, 'showShortcut', value)
  }

  setTimerType(value: 'countdown' | 'countup') {
    return this._context.setting.set(CD_TIMER_WINDOW_MAIN_NAMESPACE, 'timerType', value)
  }

  setReverseAdjustmentDirection(value: boolean) {
    return this._context.setting.set(
      CD_TIMER_WINDOW_MAIN_NAMESPACE,
      'reverseAdjustmentDirection',
      value
    )
  }

  // 一份复制后的逻辑, 嗯. 就这样吧
  sendInGame(text: string) {
    return this._context.ipc.call(CD_TIMER_WINDOW_MAIN_NAMESPACE, 'sendInGame', text)
  }
}
