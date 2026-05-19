const numberKeyIds = Array.from({ length: 10 }, (_, i) => String(i))
const letterKeyIds = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
const functionKeyIds = Array.from({ length: 12 }, (_, i) => `F${i + 1}`)
const numpadKeyIds = Array.from({ length: 10 }, (_, i) => `Numpad${i}`)

export const STANDARD_KEYBOARD_KEY_CODES = new Set([
  8, // Backspace
  9, // Tab
  12, // Numpad Clear
  13, // Enter
  16, // Shift
  17, // Control
  18, // Alt
  19, // Pause
  20, // Caps Lock
  27, // Escape
  32, // Space
  ...Array.from({ length: 8 }, (_, i) => 33 + i), // PageUp..Down
  44, // Print Screen
  45, // Insert
  46, // Delete
  ...Array.from({ length: 10 }, (_, i) => 48 + i), // 0..9
  ...Array.from({ length: 26 }, (_, i) => 65 + i), // A..Z
  91, // Left Meta
  92, // Right Meta
  93, // Context Menu
  ...Array.from({ length: 16 }, (_, i) => 96 + i), // Numpad 0..9 and operators
  ...Array.from({ length: 12 }, (_, i) => 112 + i), // F1..F12
  144, // Num Lock
  145, // Scroll Lock
  ...Array.from({ length: 6 }, (_, i) => 160 + i), // Left/Right Shift/Control/Alt
  ...Array.from({ length: 7 }, (_, i) => 186 + i), // Common OEM punctuation
  ...Array.from({ length: 4 }, (_, i) => 219 + i), // Common OEM brackets/quotes
  226 // OEM 102
])

export const STANDARD_KEYBOARD_KEY_IDS = new Set([
  'Backspace',
  'Tab',
  'NumpadClear',
  'Enter',
  'Shift',
  'Control',
  'Alt',
  'Pause',
  'CapsLock',
  'Escape',
  'Space',
  'PageUp',
  'PageDown',
  'End',
  'Home',
  'LeftArrow',
  'UpArrow',
  'RightArrow',
  'DownArrow',
  'PrintScreen',
  'Insert',
  'Delete',
  ...numberKeyIds,
  ...letterKeyIds,
  'LeftMeta',
  'RightMeta',
  'Apps',
  ...numpadKeyIds,
  'NumpadMultiply',
  'NumpadPlus',
  'Separator',
  'NumpadMinus',
  'NumpadDot',
  'NumpadDivkeyIde',
  ...functionKeyIds,
  'NumLock',
  'ScrollLock',
  'LeftShift',
  'RightShift',
  'LeftControl',
  'RightControl',
  'LeftAlt',
  'RightAlt',
  'Semicolon',
  'Equals',
  'Comma',
  'Minus',
  'Dot',
  'ForwardSlash',
  'Section',
  'OpenBracket',
  'Backslash',
  'CloseBracket',
  'Quote',
  'Backtick'
])

export function isStandardKeyboardKeyCode(keyCode: number) {
  return STANDARD_KEYBOARD_KEY_CODES.has(keyCode)
}

export function isSupportedShortcutId(shortcutId: string) {
  if (!shortcutId) {
    return false
  }

  return shortcutId.split('+').every((keyId) => STANDARD_KEYBOARD_KEY_IDS.has(keyId))
}
