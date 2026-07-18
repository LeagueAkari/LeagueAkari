const ELECTRON_MODIFIER_BY_KEY_ID: Record<string, string> = {
  Control: 'Control',
  LeftControl: 'Control',
  RightControl: 'Control',
  Shift: 'Shift',
  LeftShift: 'Shift',
  RightShift: 'Shift',
  Alt: 'Alt',
  LeftAlt: 'Alt',
  RightAlt: 'Alt',
  LeftMeta: 'Command',
  RightMeta: 'Command'
}

const ELECTRON_KEY_BY_KEY_ID: Record<string, string> = {
  Backspace: 'Backspace',
  Tab: 'Tab',
  Enter: 'Enter',
  Pause: 'Pause',
  CapsLock: 'CapsLock',
  Escape: 'Escape',
  Space: 'Space',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  End: 'End',
  Home: 'Home',
  LeftArrow: 'Left',
  UpArrow: 'Up',
  RightArrow: 'Right',
  DownArrow: 'Down',
  PrintScreen: 'PrintScreen',
  Insert: 'Insert',
  Delete: 'Delete',
  Semicolon: ';',
  Equals: '=',
  Comma: ',',
  Minus: '-',
  Dot: '.',
  ForwardSlash: '/',
  OpenBracket: '[',
  Backslash: '\\',
  CloseBracket: ']',
  Quote: "'",
  Backtick: '`'
}

const KEY_ID_BY_KEYBOARD_CODE: Record<string, string> = {
  Backspace: 'Backspace',
  Tab: 'Tab',
  Enter: 'Enter',
  Pause: 'Pause',
  CapsLock: 'CapsLock',
  Escape: 'Escape',
  Space: 'Space',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  End: 'End',
  Home: 'Home',
  ArrowLeft: 'LeftArrow',
  ArrowUp: 'UpArrow',
  ArrowRight: 'RightArrow',
  ArrowDown: 'DownArrow',
  PrintScreen: 'PrintScreen',
  Insert: 'Insert',
  Delete: 'Delete',
  Semicolon: 'Semicolon',
  Equal: 'Equals',
  Comma: 'Comma',
  Minus: 'Minus',
  Period: 'Dot',
  Slash: 'ForwardSlash',
  BracketLeft: 'OpenBracket',
  Backslash: 'Backslash',
  BracketRight: 'CloseBracket',
  Quote: 'Quote',
  Backquote: 'Backtick'
}

export const ACTIVATION_SHORTCUT_MODIFIER_KEY_IDS = new Set(
  Object.keys(ELECTRON_MODIFIER_BY_KEY_ID)
)

function keyboardCodeToKeyId(code: string) {
  if (/^Key[A-Z]$/.test(code)) {
    return code.slice(3)
  }

  if (/^Digit[0-9]$/.test(code)) {
    return code.slice(5)
  }

  if (/^F(?:[1-9]|1[0-2])$/.test(code)) {
    return code
  }

  return KEY_ID_BY_KEYBOARD_CODE[code] ?? null
}

function keyIdToElectronKey(keyId: string) {
  if (/^[A-Z0-9]$/.test(keyId) || /^F(?:[1-9]|1[0-2])$/.test(keyId)) {
    return keyId
  }

  return ELECTRON_KEY_BY_KEY_ID[keyId] ?? null
}

export function shortcutIdToElectronAccelerator(shortcutId: string) {
  const modifiers = new Set<string>()
  let key: string | null = null

  for (const keyId of shortcutId.split('+')) {
    const modifier = ELECTRON_MODIFIER_BY_KEY_ID[keyId]
    if (modifier) {
      modifiers.add(modifier)
      continue
    }

    const electronKey = keyIdToElectronKey(keyId)
    if (!electronKey || key) {
      return null
    }

    key = electronKey
  }

  if (!key) {
    return null
  }

  return [...modifiers, key].join('+')
}

export function isActivationShortcutIdSupported(shortcutId: string) {
  return shortcutIdToElectronAccelerator(shortcutId) !== null
}

export interface ShortcutKeyboardEventLike {
  code: string
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  repeat?: boolean
}

export function keyboardEventToActivationShortcutId(event: ShortcutKeyboardEventLike) {
  if (event.repeat) {
    return null
  }

  const keyId = keyboardCodeToKeyId(event.code)
  if (!keyId) {
    return null
  }

  const modifiers: string[] = []
  if (event.metaKey) modifiers.push('LeftMeta')
  if (event.ctrlKey) modifiers.push('Control')
  if (event.shiftKey) modifiers.push('Shift')
  if (event.altKey) modifiers.push('Alt')

  const shortcutId = [...modifiers, keyId].join('+')
  return isActivationShortcutIdSupported(shortcutId) ? shortcutId : null
}
