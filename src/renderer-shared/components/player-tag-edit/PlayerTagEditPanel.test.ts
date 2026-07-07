import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./PlayerTagEditPanel.vue', import.meta.url), 'utf8')

describe('PlayerTagEditPanel', () => {
  it('renders a styled shortcut hint and wires Shift+Enter through the shortcut helper', () => {
    expect(source).toContain('@keydown="handleInputKeydown"')
    expect(source).toContain('SAVE_TAG_SHORTCUT_KEYS')
    expect(source).toContain('shortcut-key')
    expect(source).not.toContain('Shift+Enter {{')
  })
})
