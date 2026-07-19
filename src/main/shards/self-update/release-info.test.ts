import type { AkariRelease, AkariReleaseArtifact } from '@shared/shards/akari-api'
import { describe, expect, it } from 'vitest'

import { isSupportedWin32X64Artifact, resolveSelfUpdateReleaseInfo } from './release-info'

const release: AkariRelease = {
  version: '1.6.0',
  publishedAt: '2026-07-19T00:00:00.000Z',
  description: 'Release notes',
  artifacts: [
    {
      platform: 'win32',
      arch: 'x64',
      fileName: 'LeagueAkari-1.6.0-win.7z',
      size: 1024,
      contentType: 'application/x-7z-compressed',
      sha256: null,
      downloadUrl: 'https://example.com/LeagueAkari-1.6.0-win.7z'
    }
  ]
}

describe('self-update release info', () => {
  it('accepts only supported Windows x64 7z artifacts', () => {
    const artifact = release.artifacts[0]

    expect(isSupportedWin32X64Artifact(artifact)).toBe(true)
    expect(
      isSupportedWin32X64Artifact({
        ...artifact,
        fileName: 'release.bin'
      })
    ).toBe(true)
    expect(
      isSupportedWin32X64Artifact({
        ...artifact,
        contentType: 'application/octet-stream',
        fileName: 'LeagueAkari-1.6.0-win.7Z'
      })
    ).toBe(true)
  })

  it.each<AkariReleaseArtifact>([
    {
      ...release.artifacts[0],
      contentType: 'application/octet-stream',
      fileName: 'LeagueAkari-1.6.0-win.zip'
    },
    {
      ...release.artifacts[0],
      contentType: 'application/x-7z-compressed; charset=binary'
    },
    { ...release.artifacts[0], platform: 'windows' },
    { ...release.artifacts[0], platform: 'darwin' },
    { ...release.artifacts[0], arch: 'arm64' }
  ])('rejects unsupported artifact %#', (artifact) => {
    expect(isSupportedWin32X64Artifact(artifact)).toBe(false)
  })

  it('projects only the selected update details for Windows x64', () => {
    const releaseInfo = resolveSelfUpdateReleaseInfo(release, '1.5.0', {
      platform: 'win32',
      arch: 'x64'
    })

    expect(releaseInfo).toEqual({
      version: '1.6.0',
      currentVersion: '1.5.0',
      publishedAt: '2026-07-19T00:00:00.000Z',
      description: 'Release notes',
      isNew: true,
      isUpdateSupported: true,
      artifact: release.artifacts[0]
    })
    expect(releaseInfo?.artifact).toBe(release.artifacts[0])
  })

  it('keeps release details but withholds the artifact on unsupported platforms', () => {
    expect(
      resolveSelfUpdateReleaseInfo(release, '1.6.0', { platform: 'darwin', arch: 'arm64' })
    ).toEqual({
      version: '1.6.0',
      currentVersion: '1.6.0',
      publishedAt: '2026-07-19T00:00:00.000Z',
      description: 'Release notes',
      isNew: false,
      isUpdateSupported: false,
      artifact: null
    })
  })

  it('returns null before a release has been loaded', () => {
    expect(
      resolveSelfUpdateReleaseInfo(null, '1.5.0', { platform: 'win32', arch: 'x64' })
    ).toBeNull()
  })
})
