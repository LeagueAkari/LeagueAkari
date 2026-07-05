import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./PlayerInfoCardHeader.vue', import.meta.url), 'utf8')

describe('PlayerInfoCardHeader', () => {
  it('anchors the tag edit popover to an invisible DOM layer over the action button', () => {
    expect(source).toContain('player-action-anchor')
    expect(source).toContain('pointer-events-none absolute inset-0')
    expect(source).toContain('trigger="click"')
    expect(source).not.toContain('trigger="manual"')
    expect(source).not.toContain('await nextTick()')
  })
})
