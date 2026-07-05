import { describe, expect, it } from 'vitest'

import { appendTagText, clearTagText } from './text-editing'

describe('tag text editing', () => {
  it('appends a phrase and places the cursor after the inserted text', () => {
    expect(appendTagText('上路', '菜狗')).toEqual({
      text: '上路菜狗',
      cursorPosition: 4
    })
  })

  it('clears text and places the cursor at the beginning', () => {
    expect(clearTagText()).toEqual({
      text: '',
      cursorPosition: 0
    })
  })
})
