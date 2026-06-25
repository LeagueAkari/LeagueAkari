import { describe, expect, it } from 'vitest'

import { restorePlayerCardTagsSetting } from './player-card-tags'

const defaultPlayerCardTags = {
  showSelfTag: true,
  showMetTag: true,
  showAverageTeamDamageTag: false
}

describe('restorePlayerCardTagsSetting', () => {
  it('fills missing tags from defaults while preserving stored booleans', () => {
    const defaultValue = defaultPlayerCardTags
    const restored = restorePlayerCardTagsSetting(
      {
        showSelfTag: false,
        showAverageTeamDamageTag: true
      },
      defaultValue
    )

    expect(restored).toEqual({
      ...defaultValue,
      showSelfTag: false,
      showAverageTeamDamageTag: true
    })
  })

  it('keeps unknown boolean tags for version compatibility', () => {
    const defaultValue = defaultPlayerCardTags
    const restored = restorePlayerCardTagsSetting(
      {
        futureTag: true
      },
      defaultValue
    ) as Record<string, boolean>

    expect(restored.futureTag).toBe(true)
    expect(restored.showSelfTag).toBe(defaultValue.showSelfTag)
  })

  it('falls back to defaults for invalid storage values', () => {
    const defaultValue = defaultPlayerCardTags

    expect(restorePlayerCardTagsSetting(null, defaultValue)).toEqual(defaultValue)
    expect(restorePlayerCardTagsSetting(['showSelfTag'], defaultValue)).toEqual(defaultValue)
  })

  it('ignores non-boolean tag values', () => {
    const defaultValue = defaultPlayerCardTags
    const restored = restorePlayerCardTagsSetting(
      {
        showSelfTag: 'false',
        showMetTag: false
      },
      defaultValue
    )

    expect(restored.showSelfTag).toBe(defaultValue.showSelfTag)
    expect(restored.showMetTag).toBe(false)
  })
})
