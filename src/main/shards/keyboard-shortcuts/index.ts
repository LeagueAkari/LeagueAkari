import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type { KeyboardShortcutsDebugState, ShortcutDetails } from '@shared/shards/keyboard-shortcut'

import { AkariIpcMain } from '../ipc'
import { LoggerFactoryMain } from '../logger-factory'
import {
  DEBUG_STATEFUL_TEST_TARGET_ID,
  DISABLED_KEYS,
  DISABLED_KEYS_TARGET_ID,
  KEYBOARD_SHORTCUTS_MAIN_NAMESPACE,
  type KeyboardShortcutRegistrationType,
  MODIFIER_READING_ORDER,
  VK_CODE_F22
} from './context'
import { KeyboardShortcutsIpcHandlers } from './ipc-handlers'
import { ShortcutEventController } from './shortcut-event-controller'

@Shard(KeyboardShortcutsMain.id)
export class KeyboardShortcutsMain implements IAkariShardInitDispose {
  static id = KEYBOARD_SHORTCUTS_MAIN_NAMESPACE
  static readonly MODIFIER_READING_ORDER = MODIFIER_READING_ORDER
  static readonly VK_CODE_F22 = VK_CODE_F22
  static DISABLED_KEYS_TARGET_ID = DISABLED_KEYS_TARGET_ID
  static DEBUG_STATEFUL_TEST_TARGET_ID = DEBUG_STATEFUL_TEST_TARGET_ID
  static DISABLED_KEYS = DISABLED_KEYS

  private readonly _eventController: ShortcutEventController
  private readonly _ipcHandlers: KeyboardShortcutsIpcHandlers

  constructor(
    ipc: AkariIpcMain,
    readonly _loggerFactory: LoggerFactoryMain
  ) {
    const context = {
      namespace: KEYBOARD_SHORTCUTS_MAIN_NAMESPACE,
      ipc,
      logger: _loggerFactory.create(KEYBOARD_SHORTCUTS_MAIN_NAMESPACE)
    }
    this._eventController = new ShortcutEventController(context)
    this._ipcHandlers = new KeyboardShortcutsIpcHandlers(context, this)
  }

  get events() {
    return this._eventController.events
  }

  async onInit() {
    this._eventController.start()
    this._ipcHandlers.register()
  }

  async onDispose() {
    this._eventController.dispose()
  }

  register(
    targetId: string,
    shortcutId: string,
    type: KeyboardShortcutRegistrationType,
    cb: (details: ShortcutDetails) => void
  ) {
    return this._eventController.register(targetId, shortcutId, type, cb)
  }

  unregister(shortcutId: string) {
    return this._eventController.unregister(shortcutId)
  }

  unregisterByTargetId(targetId: string) {
    return this._eventController.unregisterByTargetId(targetId)
  }

  getRegistration(shortcutId: string) {
    return this._eventController.getRegistration(shortcutId)
  }

  getRegistrationByTargetId(targetId: string) {
    return this._eventController.getRegistrationByTargetId(targetId)
  }

  _getInternalVars() {
    return this._eventController._getInternalVars()
  }

  setDebugStatefulShortcut(shortcutId: string | null) {
    return this._eventController.setDebugStatefulShortcut(shortcutId)
  }

  getDebugState(): KeyboardShortcutsDebugState {
    return this._eventController.getDebugState()
  }

  static getNativeKeyDefinition(keyCode: number) {
    return ShortcutEventController.getNativeKeyDefinition(keyCode)
  }
}
