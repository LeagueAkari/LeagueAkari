import { describe, expect, it } from 'vitest'

import { getGameClientProcessName } from './platform'

describe('game-client process names', () => {
  it('uses the actual macOS Mach-O process name', () => {
    expect(getGameClientProcessName('darwin')).toBe('LeagueofLegends')
  })

  it('preserves the Win32 process name', () => {
    expect(getGameClientProcessName('win32')).toBe('League of Legends.exe')
  })
})
