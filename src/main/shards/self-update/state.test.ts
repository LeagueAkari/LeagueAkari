import type { SelfUpdateReleaseInfo } from '@shared/shards/self-update'
import { observable, reaction } from 'mobx'
import { describe, expect, it } from 'vitest'

import { SelfUpdateState } from './state'

describe('SelfUpdateState', () => {
  it('derives releaseInfo reactively from the release resolver', () => {
    const source = observable.box<SelfUpdateReleaseInfo | null>(null, { deep: false })
    const state = new SelfUpdateState(() => source.get(), true)
    const releaseInfo: SelfUpdateReleaseInfo = {
      version: '1.6.0',
      currentVersion: '1.5.0',
      publishedAt: '2026-07-19T00:00:00.000Z',
      description: 'Release notes',
      isNew: true,
      isUpdateSupported: true,
      artifact: {
        platform: 'win32',
        arch: 'x64',
        fileName: 'LeagueAkari-1.6.0-win.7z',
        size: 1024,
        contentType: 'application/x-7z-compressed',
        sha256: null,
        downloadUrl: 'https://example.com/LeagueAkari-1.6.0-win.7z'
      }
    }

    expect(state.releaseInfo).toBeNull()

    source.set(releaseInfo)

    expect(state.releaseInfo).toBe(releaseInfo)
  })

  it('does not publish a new release snapshot when projected data is unchanged', () => {
    const source = observable.box<SelfUpdateReleaseInfo | null>(null, { deep: false })
    const state = new SelfUpdateState(() => {
      const value = source.get()
      return value ? { ...value, artifact: value.artifact ? { ...value.artifact } : null } : null
    })
    const values: Array<SelfUpdateReleaseInfo | null> = []
    const dispose = reaction(
      () => state.releaseInfo,
      (value) => values.push(value)
    )
    const releaseInfo: SelfUpdateReleaseInfo = {
      version: '1.6.0',
      currentVersion: '1.5.0',
      publishedAt: '2026-07-19T00:00:00.000Z',
      description: 'Release notes',
      isNew: true,
      isUpdateSupported: true,
      artifact: {
        platform: 'win32',
        arch: 'x64',
        fileName: 'LeagueAkari-1.6.0-win.7z',
        size: 1024,
        contentType: 'application/x-7z-compressed',
        sha256: null,
        downloadUrl: 'https://example.com/LeagueAkari-1.6.0-win.7z'
      }
    }

    source.set(releaseInfo)
    source.set({ ...releaseInfo, artifact: { ...releaseInfo.artifact! } })

    expect(values).toHaveLength(1)
    dispose()
  })
})
