import { NATIVE_SUPPORT, type NativeInputKeyEvent, nativeInput } from '@main/native'
import type {
  KeyboardShortcutKeyState,
  KeyboardShortcutsDebugState,
  ShortcutDetails
} from '@shared/shards/keyboard-shortcut'
import { isStandardKeyboardKeyCode } from '@shared/utils/keyboard-shortcuts'
import EventEmitter from 'node:events'

import {
  COMMON_MODIFIER_VARIANTS,
  DEBUG_STATEFUL_TEST_TARGET_ID,
  type KeyboardShortcutRegistrationType,
  type KeyboardShortcutsMainContext,
  MODIFIER_READING_ORDER
} from './context'
import { ShortcutRegistry } from './shortcut-registry'

export class ShortcutEventController {
  private readonly _registry: ShortcutRegistry

  /** 除了修饰键之外的其他按键 */
  private readonly _pressedOtherKeys = new Set<number>()
  /** 修饰键 */
  private readonly _pressedModifierKeys = new Set<number>()
  /** 最后一次激活的快捷键组合，用于 normal / last-active 逻辑 */
  private _lastActiveShortcut: number[] = []
  /**
   * stateful 类型：当前处于按下状态的快捷键组合，
   * 记录的组合为排序后的修饰键 + 最后按下的非修饰键
   */
  private _activeStatefulShortcut: number[] = []

  public readonly events = new EventEmitter<{
    /**
     * 普通快捷键：在任意有意义的快捷键按下时触发（无差别分发)
     */
    shortcut: [details: ShortcutDetails]
    /**
     * last-active：在所有按键松开后触发，用于规避模拟冲突的问题 （无差别分发)
     */
    'last-active-shortcut': [details: ShortcutDetails]
    /**
     * stateful 类型：按下时触发 (仅存在订阅时才会被分发)
     */
    'stateful-shortcut-pressed': [details: ShortcutDetails]
    /**
     * stateful 类型：松开时触发 (仅存在订阅时才会被分发)
     */
    'stateful-shortcut-released': [details: ShortcutDetails]
  }>()

  private _nativeKeyEventHandler: ((key: NativeInputKeyEvent) => void) | null = null

  constructor(private readonly _context: KeyboardShortcutsMainContext) {
    this._registry = new ShortcutRegistry(_context.logger)
  }

  // fast equal for two arrays (shallow)
  private _areArraysEqual(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length) return false
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false
    }
    return true
  }

  private _buildShortcutDetails(keyCodes: number[], pressed: boolean): ShortcutDetails {
    if (!NATIVE_SUPPORT.nativeInput.available) {
      return { keyCodes, keys: [], id: '', unifiedId: '', pressed }
    }

    const keys = keyCodes.map((k) => ({
      keyId: ShortcutEventController.getNativeKeyDefinition(k).keyId,
      keyCode: k,
      isModifier: nativeInput.isModifierKey(k)
    }))
    const id = keys.map((k) => k.keyId).join('+')
    const unifiedId = [
      ...new Set(
        keyCodes.map(
          (k) =>
            nativeInput.UNIFIED_KEY_ID[k] || ShortcutEventController.getNativeKeyDefinition(k).keyId
        )
      )
    ].join('+')
    return { keyCodes, keys, id, unifiedId, pressed }
  }

  private _buildShortcutDetailsOrNull(keyCodes: number[], pressed: boolean) {
    return keyCodes.length ? this._buildShortcutDetails(keyCodes, pressed) : null
  }

  private _getSortedPressedKeyCodes() {
    const modifiers = Array.from(this._pressedModifierKeys.values()).toSorted((a, b) => {
      return MODIFIER_READING_ORDER[a] - MODIFIER_READING_ORDER[b]
    })

    const otherKeys = Array.from(this._pressedOtherKeys.values()).toSorted((a, b) => a - b)
    return [...modifiers, ...otherKeys]
  }

  private _hasPressedKeys() {
    return this._pressedModifierKeys.size > 0 || this._pressedOtherKeys.size > 0
  }

  private _releaseActiveStatefulShortcut() {
    if (!this._activeStatefulShortcut.length) {
      return
    }

    const details = this._buildShortcutDetails(this._activeStatefulShortcut, false)
    this.events.emit('stateful-shortcut-released', details)
    const registration = this._registry.getActiveRegistration(details.id)
    if (registration && registration.type === 'stateful') {
      registration.cb(details)
    }
    this._activeStatefulShortcut = []
  }

  /**
   * Reconcile lazily at real keyboard-event boundaries. This is intentionally not a periodic
   * watchdog: unsupported virtual keys are filtered before entering the state machine, and stale
   * state only needs cleanup before the next supported shortcut decision.
   */
  private _reconcilePressedStateFromNative() {
    if (
      !NATIVE_SUPPORT.nativeInput.available ||
      !this._hasPressedKeys() ||
      !nativeInput.instance.getKeyStates
    ) {
      return
    }

    let pressedNativeKeys: Set<number>
    try {
      pressedNativeKeys = new Set(
        nativeInput.instance
          .getKeyStates()
          .filter((s) => s.pressed)
          .map((s) => s.vkCode)
      )
    } catch (error) {
      this._context.logger.warn('Failed to reconcile native keyboard state', error)
      return
    }

    for (const keyCode of this._pressedModifierKeys) {
      if (!pressedNativeKeys.has(keyCode)) {
        this._pressedModifierKeys.delete(keyCode)
      }
    }

    for (const keyCode of this._pressedOtherKeys) {
      if (!pressedNativeKeys.has(keyCode)) {
        this._pressedOtherKeys.delete(keyCode)
      }
    }

    if (
      this._activeStatefulShortcut.length &&
      this._activeStatefulShortcut.some((keyCode) => !pressedNativeKeys.has(keyCode))
    ) {
      this._releaseActiveStatefulShortcut()
    }

    this._emitLastActiveShortcutIfNeeded()
  }

  // 当所有按键松开时，发送 last-active 快捷键信息
  private _emitLastActiveShortcutIfNeeded(): void {
    if (
      this._pressedModifierKeys.size === 0 &&
      this._pressedOtherKeys.size === 0 &&
      this._lastActiveShortcut.length > 0
    ) {
      const details = this._buildShortcutDetails(this._lastActiveShortcut, false)
      this.events.emit('last-active-shortcut', details)
      this._context.ipc.sendEvent(this._context.namespace, 'last-active-shortcut', details)
      const registration = this._registry.getActiveRegistration(details.id)
      if (registration && registration.type === 'last-active') {
        registration.cb(details)
      }
      this._lastActiveShortcut = []
    }
  }

  // 处理修饰键的按下和释放
  private _processModifierKey(event: NativeInputKeyEvent): void {
    if (this._pressedModifierKeys.has(event.keyCode) === event.isDown) {
      if (!event.isDown && this._activeStatefulShortcut.includes(event.keyCode)) {
        this._releaseActiveStatefulShortcut()
      }
      return
    }

    if (event.isDown) {
      this._pressedModifierKeys.add(event.keyCode)
    } else {
      this._pressedModifierKeys.delete(event.keyCode)
      if (this._activeStatefulShortcut.includes(event.keyCode)) {
        this._releaseActiveStatefulShortcut()
      }
    }
  }

  private _processCommonModifierKey(event: NativeInputKeyEvent): void {
    if (event.isDown) {
      return
    }

    const variants = COMMON_MODIFIER_VARIANTS[event.keyCode] || [event.keyCode]
    let shouldReleaseStatefulShortcut = false

    for (const keyCode of variants) {
      this._pressedModifierKeys.delete(keyCode)
      if (this._activeStatefulShortcut.includes(keyCode)) {
        shouldReleaseStatefulShortcut = true
      }
    }

    if (shouldReleaseStatefulShortcut) {
      this._releaseActiveStatefulShortcut()
    }
  }

  // 处理非修饰键按下事件
  private _processNonModifierKeyDown(keyCode: number): void {
    if (this._pressedOtherKeys.has(keyCode)) {
      return
    }

    this._pressedOtherKeys.add(keyCode)
    const modifiers = Array.from(this._pressedModifierKeys.values())
    const sortedModifiers = modifiers.toSorted((a, b) => {
      return MODIFIER_READING_ORDER[a] - MODIFIER_READING_ORDER[b]
    })
    const keyCodes = [...sortedModifiers, keyCode]
    const details = this._buildShortcutDetails(keyCodes, true)

    // 更新 lastActive 用于 normal/last-active 逻辑
    this._lastActiveShortcut = keyCodes

    // 触发普通快捷键事件
    this.events.emit('shortcut', details)

    const registration = this._registry.getActiveRegistration(details.id)
    if (registration) {
      if (registration.type === 'normal') {
        registration.cb(details)
      } else if (registration.type === 'stateful') {
        // 如果 stateful 组合发生变化，则先触发之前的 released，再触发新的 pressed
        if (!this._areArraysEqual(this._activeStatefulShortcut, keyCodes)) {
          if (this._activeStatefulShortcut.length) {
            this._releaseActiveStatefulShortcut()
          }
          this._activeStatefulShortcut = keyCodes
          this.events.emit('stateful-shortcut-pressed', details)
          registration.cb(details)
        }
      }
    }

    // 通知 IPC 保持原有逻辑
    this._context.ipc.sendEvent(this._context.namespace, 'shortcut', details)
  }

  // 处理非修饰键释放事件
  private _processNonModifierKeyUp(keyCode: number): void {
    this._pressedOtherKeys.delete(keyCode)
    // 如果释放的键是当前 stateful 快捷键中的关键非修饰键，则发出 released 事件
    if (
      this._activeStatefulShortcut.length &&
      this._activeStatefulShortcut[this._activeStatefulShortcut.length - 1] === keyCode
    ) {
      this._releaseActiveStatefulShortcut()
    }
  }

  private _processNativeKeyEvent(event: NativeInputKeyEvent): void {
    if (!isStandardKeyboardKeyCode(event.keyCode)) {
      return
    }

    this._reconcilePressedStateFromNative()

    if (event.keyCode === 231) {
      return
    }

    // 如果是常见修饰键则不处理
    if (event.isCommonModifier) {
      this._processCommonModifierKey(event)
      this._emitLastActiveShortcutIfNeeded()
      return
    }

    if (event.isModifier) {
      this._processModifierKey(event)
    } else {
      if (event.isDown) {
        this._processNonModifierKeyDown(event.keyCode)
      } else {
        this._processNonModifierKeyUp(event.keyCode)
      }
    }

    // 检查是否所有按键都已释放，若是则发出 last-active 快捷键事件
    this._emitLastActiveShortcutIfNeeded()
  }

  start() {
    if (NATIVE_SUPPORT.nativeInput.available) {
      this._context.logger.info('Listening for key events')
      this._nativeKeyEventHandler = (key) => {
        this._processNativeKeyEvent(key)
      }
      nativeInput.instance.on('keyEvent', this._nativeKeyEventHandler)
    }
  }

  register(
    targetId: string,
    shortcutId: string,
    type: KeyboardShortcutRegistrationType,
    cb: (details: ShortcutDetails) => void
  ) {
    return this._registry.register(targetId, shortcutId, type, cb)
  }

  unregister(shortcutId: string) {
    return this._registry.unregister(shortcutId)
  }

  unregisterByTargetId(targetId: string) {
    return this._registry.unregisterByTargetId(targetId)
  }

  getRegistration(shortcutId: string) {
    return this._registry.getRegistration(shortcutId)
  }

  getRegistrationByTargetId(targetId: string) {
    return this._registry.getRegistrationByTargetId(targetId)
  }

  _getInternalVars() {
    return {
      _pressedOtherKeys: this._pressedOtherKeys,
      _pressedModifierKeys: this._pressedModifierKeys,
      _lastActiveShortcut: this._lastActiveShortcut,
      _activeStatefulShortcut: this._activeStatefulShortcut
    }
  }

  setDebugStatefulShortcut(shortcutId: string | null) {
    this.unregisterByTargetId(DEBUG_STATEFUL_TEST_TARGET_ID)

    if (!shortcutId) {
      return null
    }

    this.register(DEBUG_STATEFUL_TEST_TARGET_ID, shortcutId, 'stateful', () => {})

    return {
      type: 'stateful',
      targetId: DEBUG_STATEFUL_TEST_TARGET_ID,
      shortcutId
    }
  }

  getDebugState(): KeyboardShortcutsDebugState {
    if (!NATIVE_SUPPORT.nativeInput.available) {
      return {
        available: false,
        keyStates: [],
        pressedOtherKeys: [],
        pressedModifierKeys: [],
        activeShortcut: null,
        lastActiveShortcut: null,
        activeStatefulShortcut: null
      }
    }

    const nativeStatesByCode = new Map<number, { pressed: boolean; scanCode?: number }>()

    try {
      for (const state of nativeInput.instance.getKeyStates?.() ?? []) {
        nativeStatesByCode.set(state.vkCode, {
          pressed: state.pressed,
          scanCode: state.scanCode
        })
      }
    } catch {
      // Keep the debug page usable from the shard's own event-driven state.
    }

    const keyStates: KeyboardShortcutKeyState[] = []

    for (const [rawKeyCode, definition] of Object.entries(nativeInput.VKEY_MAP)) {
      const keyCode = Number(rawKeyCode)

      if (!definition || !Number.isFinite(keyCode) || !isStandardKeyboardKeyCode(keyCode)) {
        continue
      }

      const nativeState = nativeStatesByCode.get(keyCode)
      const state: KeyboardShortcutKeyState = {
        keyCode,
        keyId: ShortcutEventController.getNativeKeyDefinition(keyCode).keyId,
        unifiedKeyId:
          nativeInput.UNIFIED_KEY_ID[keyCode] ||
          ShortcutEventController.getNativeKeyDefinition(keyCode).keyId,
        name: ShortcutEventController.getNativeKeyDefinition(keyCode).name,
        standardName: ShortcutEventController.getNativeKeyDefinition(keyCode).standardName,
        isModifier: nativeInput.isModifierKey(keyCode),
        pressed:
          nativeState?.pressed ||
          this._pressedModifierKeys.has(keyCode) ||
          this._pressedOtherKeys.has(keyCode) ||
          false
      }

      if (nativeState?.scanCode !== undefined) {
        state.scanCode = nativeState.scanCode
      }

      keyStates.push(state)
    }

    keyStates.sort((a, b) => a.keyCode - b.keyCode)

    return {
      available: true,
      keyStates,
      pressedOtherKeys: Array.from(this._pressedOtherKeys.values()).toSorted((a, b) => a - b),
      pressedModifierKeys: Array.from(this._pressedModifierKeys.values()).toSorted((a, b) => a - b),
      activeShortcut: this._buildShortcutDetailsOrNull(this._getSortedPressedKeyCodes(), true),
      lastActiveShortcut: this._buildShortcutDetailsOrNull(this._lastActiveShortcut, false),
      activeStatefulShortcut: this._buildShortcutDetailsOrNull(this._activeStatefulShortcut, true)
    }
  }

  dispose() {
    if (this._nativeKeyEventHandler) {
      nativeInput.instance.off('keyEvent', this._nativeKeyEventHandler)
      this._nativeKeyEventHandler = null
    }
    this.events.removeAllListeners()
    this._registry.clear()
  }

  static getNativeKeyDefinition(keyCode: number) {
    const definition = nativeInput.VKEY_MAP[keyCode]

    if (!definition) {
      throw new Error(`Unknown native key code: ${keyCode}`)
    }

    return definition
  }
}
