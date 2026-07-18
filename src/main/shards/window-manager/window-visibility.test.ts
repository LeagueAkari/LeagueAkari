import { describe, expect, it, vi } from 'vitest'

import { showOrRestoreWindow } from './window-visibility'

function createWindow(options: { minimized?: boolean; visible?: boolean } = {}) {
  return {
    focus: vi.fn(),
    isMinimized: vi.fn(() => options.minimized ?? false),
    isVisible: vi.fn(() => options.visible ?? true),
    restore: vi.fn(),
    show: vi.fn(),
    showInactive: vi.fn()
  }
}

describe('showOrRestoreWindow', () => {
  it('restores a minimized hidden window before showing and focusing it', () => {
    const window = createWindow({ minimized: true, visible: false })

    showOrRestoreWindow(window as Parameters<typeof showOrRestoreWindow>[0])

    expect(window.restore).toHaveBeenCalledOnce()
    expect(window.show).toHaveBeenCalledOnce()
    expect(window.focus).toHaveBeenCalledOnce()
    expect(window.restore.mock.invocationCallOrder[0]).toBeLessThan(
      window.show.mock.invocationCallOrder[0]
    )
  })

  it('uses inactive display without stealing focus', () => {
    const window = createWindow({ visible: false })

    showOrRestoreWindow(window as Parameters<typeof showOrRestoreWindow>[0], true)

    expect(window.showInactive).toHaveBeenCalledOnce()
    expect(window.show).not.toHaveBeenCalled()
    expect(window.focus).not.toHaveBeenCalled()
  })

  it('focuses an already visible window without showing it again', () => {
    const window = createWindow()

    showOrRestoreWindow(window as Parameters<typeof showOrRestoreWindow>[0])

    expect(window.restore).not.toHaveBeenCalled()
    expect(window.show).not.toHaveBeenCalled()
    expect(window.focus).toHaveBeenCalledOnce()
  })
})
