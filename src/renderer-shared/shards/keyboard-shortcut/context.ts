import type { AkariIpcRenderer } from '../ipc'

export const KEYBOARD_SHORTCUTS_MAIN_NAMESPACE = 'keyboard-shortcuts-main'
export const KEYBOARD_SHORTCUTS_RENDERER_NAMESPACE = 'keyboard-shortcuts-renderer'

export interface KeyboardShortcutsRendererContext {
  ipc: AkariIpcRenderer
}
