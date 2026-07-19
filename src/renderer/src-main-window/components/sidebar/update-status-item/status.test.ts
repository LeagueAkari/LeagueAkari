import type { SelfUpdateReleaseInfo, UpdateProgressInfo } from '@shared/shards/self-update'
import { describe, expect, it } from 'vitest'

import { resolveUpdateStatusDisplay } from './status'

const release: SelfUpdateReleaseInfo = {
  version: 'v1.6.0',
  currentVersion: 'v1.5.0',
  publishedAt: '2026-07-19T00:00:00.000Z',
  description: '',
  isNew: true,
  isUpdateSupported: true,
  artifact: {
    platform: 'win32',
    arch: 'x64',
    fileName: 'LeagueAkari-v1.6.0-win.7z',
    size: 1024,
    downloadUrl: 'https://example.com/LeagueAkari-v1.6.0-win.7z',
    contentType: 'application/x-7z-compressed',
    sha256: null
  }
}

function createProgressInfo(
  phase: UpdateProgressInfo['phase'],
  downloadingProgress = 0
): UpdateProgressInfo {
  return {
    phase,
    downloadingProgress,
    averageDownloadSpeed: 0,
    downloadTimeLeft: -1,
    fileSize: release.artifact!.size
  }
}

describe('resolveUpdateStatusDisplay', () => {
  it('shows a supported new release unless that version is ignored', () => {
    expect(resolveUpdateStatusDisplay(release, null, null)).toEqual({
      kind: 'available',
      phase: 'available',
      progress: 100
    })
    expect(resolveUpdateStatusDisplay(release, null, release.version)).toBeNull()
    expect(
      resolveUpdateStatusDisplay({ ...release, isUpdateSupported: false }, null, null)
    ).toBeNull()
  })

  it('maps active update progress ahead of release visibility', () => {
    expect(
      resolveUpdateStatusDisplay(release, createProgressInfo('downloading', 0.42), release.version)
    ).toEqual({
      kind: 'downloading',
      phase: 'downloading',
      progress: 42
    })

    expect(
      resolveUpdateStatusDisplay(release, createProgressInfo('waiting-for-restart'), null)
    ).toEqual({
      kind: 'waiting-for-restart',
      phase: 'ready',
      progress: 100
    })
  })

  it('exposes a failed download as an actionable retry state', () => {
    expect(
      resolveUpdateStatusDisplay(release, createProgressInfo('download-failed'), null)
    ).toEqual({
      kind: 'download-failed',
      phase: 'available',
      progress: 100
    })
  })

  it('clamps download progress to the display range', () => {
    expect(
      resolveUpdateStatusDisplay(release, createProgressInfo('downloading', 1.5), null)?.progress
    ).toBe(100)
    expect(
      resolveUpdateStatusDisplay(release, createProgressInfo('downloading', -0.5), null)?.progress
    ).toBe(0)
  })
})
