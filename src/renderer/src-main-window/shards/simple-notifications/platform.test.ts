import { describe, expect, it } from 'vitest'

import {
  shouldShowCannotGetUxCommandLineWarning,
  shouldShowWmiAdministratorPrompt
} from './platform'

describe('simple notification platform guards', () => {
  it('does not offer Windows administrator or WMI flows on macOS', () => {
    expect(shouldShowWmiAdministratorPrompt('darwin', true, false)).toBe(false)
    expect(shouldShowCannotGetUxCommandLineWarning('darwin', true, true)).toBe(false)
  })

  it('keeps the existing Windows warning conditions', () => {
    expect(shouldShowWmiAdministratorPrompt('win32', true, false)).toBe(true)
    expect(shouldShowWmiAdministratorPrompt('win32', true, true)).toBe(false)
    expect(shouldShowCannotGetUxCommandLineWarning('win32', true, true)).toBe(true)
    expect(shouldShowCannotGetUxCommandLineWarning('win32', false, true)).toBe(false)
  })
})
