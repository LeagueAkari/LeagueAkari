import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { resolveMagicAddonPath } from './magic'

describe('resolveMagicAddonPath', () => {
  const baseDir = path.join(os.tmpdir(), 'app.asar', 'out', 'main')

  it('selects only the Apple Silicon addon for an Apple Silicon macOS runtime', () => {
    expect(resolveMagicAddonPath('darwin', 'arm64', baseDir)).toBe(
      path
        .join(baseDir, '../../resources/magic/magic.darwin-arm64.node')
        .replace('app.asar', 'app.asar.unpacked')
    )
  })

  it('preserves the existing Win32 x64 addon selection', () => {
    expect(resolveMagicAddonPath('win32', 'x64', baseDir)).toBe(
      path
        .join(baseDir, '../../resources/magic/magic.win32-x64.node')
        .replace('app.asar', 'app.asar.unpacked')
    )
  })

  it('does not select a native addon for unsupported platform and architecture pairs', () => {
    expect(resolveMagicAddonPath('darwin', 'x64', baseDir)).toBeNull()
    expect(resolveMagicAddonPath('linux', 'arm64', baseDir)).toBeNull()
  })
})
