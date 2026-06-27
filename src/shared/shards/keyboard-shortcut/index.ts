export interface ShortcutKeyDetails {
  keyId: string
  isModifier: boolean
  keyCode: number
}

export interface ShortcutDetails {
  keyCodes: number[]
  keys: ShortcutKeyDetails[]
  id: string
  unifiedId: string
  pressed: boolean
}

export interface KeyboardShortcutKeyState extends ShortcutKeyDetails {
  name: string
  standardName: string
  unifiedKeyId: string
  pressed: boolean
  scanCode?: number
}

export interface KeyboardShortcutsDebugState {
  available: boolean
  keyStates: KeyboardShortcutKeyState[]
  pressedOtherKeys: number[]
  pressedModifierKeys: number[]
  activeShortcut: ShortcutDetails | null
  lastActiveShortcut: ShortcutDetails | null
  activeStatefulShortcut: ShortcutDetails | null
}
