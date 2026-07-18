import { describe, expect, it } from 'vitest'

import { canRelaunchAsAdministrator } from './platform'

describe('app-common platform guards', () => {
  it('only offers the Windows administrator relaunch flow on Windows', () => {
    expect(canRelaunchAsAdministrator('win32')).toBe(true)
    expect(canRelaunchAsAdministrator('darwin')).toBe(false)
    expect(canRelaunchAsAdministrator('linux')).toBe(false)
  })
})
