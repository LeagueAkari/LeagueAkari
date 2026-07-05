import { describe, expect, it } from 'vitest'

import {
  getNextSuggestionPanelExpanded,
  isSuggestionPanelInitiallyExpanded
} from './suggestion-panel'

describe('suggestion panel state', () => {
  it('is collapsed by default', () => {
    expect(isSuggestionPanelInitiallyExpanded).toBe(false)
  })

  it('toggles between expanded and collapsed', () => {
    expect(getNextSuggestionPanelExpanded(false)).toBe(true)
    expect(getNextSuggestionPanelExpanded(true)).toBe(false)
  })
})
