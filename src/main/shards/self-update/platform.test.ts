import { describe, expect, test } from 'vitest'

import {
  shouldApplyDownloadedUpdate,
  shouldDownloadUpdateArchive,
  shouldLaunchUpdaterOnQuit,
  shouldRunSelfUpdateLifecycle,
  shouldUninstallWithUpdater
} from './platform'

describe('self-update platform guards', () => {
  test('allows download, apply, lifecycle, and updater uninstall only on Windows', () => {
    expect(shouldDownloadUpdateArchive('win32')).toBe(true)
    expect(shouldApplyDownloadedUpdate('win32')).toBe(true)
    expect(shouldRunSelfUpdateLifecycle('win32')).toBe(true)
    expect(shouldUninstallWithUpdater('win32')).toBe(true)

    expect(shouldDownloadUpdateArchive('darwin')).toBe(false)
    expect(shouldApplyDownloadedUpdate('darwin')).toBe(false)
    expect(shouldRunSelfUpdateLifecycle('darwin')).toBe(false)
    expect(shouldUninstallWithUpdater('darwin')).toBe(false)

    expect(shouldDownloadUpdateArchive('linux')).toBe(false)
    expect(shouldApplyDownloadedUpdate('linux')).toBe(false)
    expect(shouldRunSelfUpdateLifecycle('linux')).toBe(false)
    expect(shouldUninstallWithUpdater('linux')).toBe(false)
  })

  test('launches the updater on quit only from a packaged Windows build', () => {
    expect(shouldLaunchUpdaterOnQuit(true, 'win32')).toBe(true)
    expect(shouldLaunchUpdaterOnQuit(false, 'win32')).toBe(false)
    expect(shouldLaunchUpdaterOnQuit(true, 'darwin')).toBe(false)
    expect(shouldLaunchUpdaterOnQuit(true, 'linux')).toBe(false)
  })
})
