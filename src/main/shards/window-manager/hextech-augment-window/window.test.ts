import type { HextechAugmentSnapshot } from '@shared/types/hextech-augment'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { WindowManagerMainContext } from '../context'
import { AkariHextechAugmentWindow } from './window'

const nativeWindow = vi.hoisted(() => ({
  bounds: { x: 0, y: 0, width: 600, height: 120 },
  isDestroyed: vi.fn(() => false),
  getBounds: vi.fn(),
  setBounds: vi.fn(),
  setContentProtection: vi.fn(),
  setAlwaysOnTop: vi.fn()
}))
vi.mock('electron', () => ({
  screen: {
    screenToDipRect: (_window: unknown, bounds: Record<string, number>) =>
      Object.fromEntries(Object.entries(bounds).map(([key, value]) => [key, value / 1.5]))
  }
}))
vi.mock('../base-akari-window', () => ({
  BaseAkariWindow: class {
    _window = nativeWindow
    state = { ready: true }
    hide = vi.fn()
    showOrRestore = vi.fn()
  }
}))

const snapshot = (): HextechAugmentSnapshot => ({
  championId: 1,
  capturedAt: Date.now(),
  expiresAt: Date.now() + 4000,
  labels: [],
  window: { id: 'game', x: 0, y: 0, width: 3840, height: 2160 }
})

describe('augment strip window placement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nativeWindow.bounds = { x: 0, y: 0, width: 600, height: 120 }
    nativeWindow.getBounds.mockImplementation(() => ({ ...nativeWindow.bounds }))
    nativeWindow.setBounds.mockImplementation((bounds) => {
      nativeWindow.bounds = bounds
    })
  })

  it('places the strip in game coordinates and retains a dragged position across recognition updates', () => {
    const window = new AkariHextechAugmentWindow({} as WindowManagerMainContext)
    window.present(snapshot())
    expect(nativeWindow.bounds).toEqual({ x: 980, y: 24, width: 600, height: 120 })
    nativeWindow.bounds = { x: 1100, y: 200, width: 600, height: 120 }
    window.present(snapshot())
    expect(nativeWindow.setBounds).toHaveBeenCalledOnce()
    expect(nativeWindow.bounds).toMatchObject({ x: 1100, y: 200 })
  })

  it('follows a moved game and clamps the strip inside a resized game', () => {
    const window = new AkariHextechAugmentWindow({} as WindowManagerMainContext)
    window.present(snapshot())
    nativeWindow.bounds = { x: 1100, y: 200, width: 600, height: 120 }
    const moved = snapshot()
    moved.window.x = 600
    moved.window.y = 300
    window.present(moved)
    expect(nativeWindow.bounds).toEqual({ x: 1500, y: 400, width: 600, height: 120 })
    moved.window.width = 750
    window.present(moved)
    expect(nativeWindow.bounds).toEqual({ x: 400, y: 400, width: 500, height: 120 })
    window.present(null)
    expect(window.hide).toHaveBeenCalledOnce()
  })
})
