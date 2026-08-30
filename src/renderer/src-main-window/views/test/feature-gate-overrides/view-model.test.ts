import type { AkariFeatureGateSnapshot } from '@shared/shards/akari-api'
import type { FeatureGateDevOverrides } from '@shared/shards/feature-gating'
import { describe, expect, it } from 'vitest'

import { buildFeatureGateGroups } from './view-model'

const cloudSnapshot: AkariFeatureGateSnapshot = {
  updatedAt: '2026-08-30T10:00:00.000Z',
  gates: {
    'cloud.enabled-z': {},
    'cloud.disabled-a': { platforms: ['darwin'] },
    'shared.disabled-z': {},
    'shared.enabled-a': { platforms: ['darwin'] }
  }
}

const devOverrides: FeatureGateDevOverrides = {
  'local.disabled-z': { mode: 'force-off' },
  'local.enabled-a': { mode: 'force-on' },
  'shared.disabled-z': { mode: 'force-off' },
  'shared.enabled-a': { mode: 'force-on' }
}

const enabled = new Set(['local.enabled-a', 'shared.enabled-a', 'cloud.enabled-z'])

describe('feature gate override list view model', () => {
  it('groups rows in local, overridden, and cloud order', () => {
    const groups = buildFeatureGateGroups({
      cloudSnapshot,
      devOverrides,
      query: '',
      isEnabled: (key) => enabled.has(key)
    })

    expect(groups.map((group) => group.id)).toEqual([
      'local-only',
      'overridden-cloud',
      'cloud-only'
    ])
    expect(groups.map((group) => group.rows.map((row) => row.key))).toEqual([
      ['local.enabled-a', 'local.disabled-z'],
      ['shared.enabled-a', 'shared.disabled-z'],
      ['cloud.enabled-z', 'cloud.disabled-a']
    ])
  })

  it('sorts enabled rows first and alphabetically within the same state', () => {
    const groups = buildFeatureGateGroups({
      cloudSnapshot: null,
      devOverrides: {
        'local.enabled-z': { mode: 'force-on' },
        'local.enabled-a': { mode: 'force-on' },
        'local.disabled-a': { mode: 'force-off' }
      },
      query: '',
      isEnabled: (key) => key.startsWith('local.enabled')
    })

    expect(groups[0].rows.map((row) => row.key)).toEqual([
      'local.enabled-a',
      'local.enabled-z',
      'local.disabled-a'
    ])
  })

  it('filters keys and removes empty groups', () => {
    const groups = buildFeatureGateGroups({
      cloudSnapshot,
      devOverrides,
      query: 'shared.enabled',
      isEnabled: (key) => enabled.has(key)
    })

    expect(groups).toHaveLength(1)
    expect(groups[0].id).toBe('overridden-cloud')
    expect(groups[0].rows.map((row) => row.key)).toEqual(['shared.enabled-a'])
  })
})
