import { describe, expect, test } from 'vitest'

import {
  shouldApplyDownloadedUpdate,
  shouldDownloadUpdateArchive,
  shouldLaunchUpdaterOnQuit,
  shouldRunSelfUpdateLifecycle,
  shouldUninstallWithUpdater
} from './platform'

describe('self-update platform guards', () => {
  test('allows download, apply, lifecycle, and updater uninstall only on Windows x64', () => {
    expect(shouldDownloadUpdateArchive('win32', 'x64')).toBe(true)
    expect(shouldApplyDownloadedUpdate('win32', 'x64')).toBe(true)
    expect(shouldRunSelfUpdateLifecycle('win32', 'x64')).toBe(true)
    expect(shouldUninstallWithUpdater('win32', 'x64')).toBe(true)

    expect(shouldDownloadUpdateArchive('win32', 'arm64')).toBe(false)
    expect(shouldApplyDownloadedUpdate('darwin', 'x64')).toBe(false)
    expect(shouldRunSelfUpdateLifecycle('darwin', 'arm64')).toBe(false)
    expect(shouldUninstallWithUpdater('darwin', 'x64')).toBe(false)

    expect(shouldDownloadUpdateArchive('linux', 'x64')).toBe(false)
    expect(shouldApplyDownloadedUpdate('linux', 'x64')).toBe(false)
    expect(shouldRunSelfUpdateLifecycle('linux', 'x64')).toBe(false)
    expect(shouldUninstallWithUpdater('linux', 'x64')).toBe(false)
  })

  test('launches the updater on quit only from a packaged Windows x64 build', () => {
    expect(shouldLaunchUpdaterOnQuit(true, 'win32', 'x64')).toBe(true)
    expect(shouldLaunchUpdaterOnQuit(false, 'win32', 'x64')).toBe(false)
    expect(shouldLaunchUpdaterOnQuit(true, 'win32', 'arm64')).toBe(false)
    expect(shouldLaunchUpdaterOnQuit(true, 'darwin', 'x64')).toBe(false)
    expect(shouldLaunchUpdaterOnQuit(true, 'linux', 'x64')).toBe(false)
  })
})
