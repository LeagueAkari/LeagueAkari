import { describe, expect, test } from 'vitest'

import {
  shouldAllowDefaultRiotClientLaunch,
  shouldAllowWindowsOnlyLaunch,
  shouldRegisterJumpList,
  shouldScanMacInstallations,
  shouldScanTencentInstallations,
  shouldWatchLiveStreamingClients
} from './platform'

describe('client-installation platform guards', () => {
  test('enables Tencent, Jump List, live streaming watch, and Windows launch only on Windows', () => {
    expect(shouldScanTencentInstallations('win32')).toBe(true)
    expect(shouldRegisterJumpList('win32')).toBe(true)
    expect(shouldWatchLiveStreamingClients('win32')).toBe(true)
    expect(shouldAllowWindowsOnlyLaunch('win32')).toBe(true)

    expect(shouldScanTencentInstallations('darwin')).toBe(false)
    expect(shouldRegisterJumpList('darwin')).toBe(false)
    expect(shouldWatchLiveStreamingClients('darwin')).toBe(false)
    expect(shouldAllowWindowsOnlyLaunch('darwin')).toBe(false)
  })

  test('enables macOS installation scan only on macOS', () => {
    expect(shouldScanMacInstallations('darwin')).toBe(true)
    expect(shouldScanMacInstallations('win32')).toBe(false)
    expect(shouldScanMacInstallations('linux')).toBe(false)
  })

  test('allows the default Riot Client launcher on Windows and macOS', () => {
    expect(shouldAllowDefaultRiotClientLaunch('win32')).toBe(true)
    expect(shouldAllowDefaultRiotClientLaunch('darwin')).toBe(true)
    expect(shouldAllowDefaultRiotClientLaunch('linux')).toBe(false)
  })
})
