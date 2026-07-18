import type { BrowserWindow } from 'electron'

type RestorableWindow = Pick<
  BrowserWindow,
  'focus' | 'isMinimized' | 'isVisible' | 'restore' | 'show' | 'showInactive'
>

export function showOrRestoreWindow(window: RestorableWindow, inactive = false) {
  if (window.isMinimized()) {
    window.restore()
  }

  if (!window.isVisible()) {
    if (inactive) {
      window.showInactive()
    } else {
      window.show()
    }
  }

  if (!inactive) {
    window.focus()
  }
}
