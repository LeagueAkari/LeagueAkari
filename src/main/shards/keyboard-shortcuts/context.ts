import type { ShortcutDetails } from '@shared/types/shards/keyboard-shortcut'

import type { AkariIpcMain } from '../ipc'
import type { AkariLogger } from '../logger-factory'

export const KEYBOARD_SHORTCUTS_MAIN_NAMESPACE = 'keyboard-shortcuts-main'

export const MODIFIER_READING_ORDER: Record<number, number> = {
  162: 0,
  163: 1,
  16: 2,
  160: 3,
  161: 4,
  18: 5,
  164: 6,
  165: 7,
  91: 8,
  92: 9
}

export const VK_CODE_F22 = 133
export const DISABLED_KEYS_TARGET_ID = 'akari-disabled-keys'
export const DEBUG_STATEFUL_TEST_TARGET_ID = 'keyboard-shortcuts-main/debug-stateful-test'
export const DISABLED_KEYS = [
  133, // F22
  13 // Enter
]

export const COMMON_MODIFIER_VARIANTS: Record<number, number[]> = {
  16: [16, 160, 161],
  17: [17, 162, 163],
  18: [18, 164, 165]
}

export type KeyboardShortcutRegistrationType = 'last-active' | 'normal' | 'stateful'

export interface KeyboardShortcutRegistration {
  type: KeyboardShortcutRegistrationType
  targetId: string
  shortcutId: string
  cb: (details: ShortcutDetails) => void
}

export interface KeyboardShortcutsMainContext {
  namespace: string
  ipc: AkariIpcMain
  logger: AkariLogger
}
