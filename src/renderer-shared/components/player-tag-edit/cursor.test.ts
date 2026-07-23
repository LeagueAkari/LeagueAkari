import { describe, expect, it, vi } from 'vitest'

import { focusTextInput, insertTextAtSelection } from './cursor'

describe('focusTextInput', () => {
  it('focuses the textarea and moves the cursor to the requested position', () => {
    const textarea = {
      setSelectionRange: vi.fn()
    } as unknown as HTMLTextAreaElement
    const input = {
      focus: vi.fn(),
      textareaElRef: textarea,
      inputElRef: null
    }

    focusTextInput(input, 5)

    expect(input.focus).toHaveBeenCalledOnce()
    expect(textarea.setSelectionRange).toHaveBeenCalledWith(5, 5)
  })

  it('leaves the cursor untouched when no position is requested', () => {
    const textarea = {
      setSelectionRange: vi.fn()
    } as unknown as HTMLTextAreaElement
    const input = {
      focus: vi.fn(),
      textareaElRef: textarea,
      inputElRef: null
    }

    focusTextInput(input)

    expect(input.focus).toHaveBeenCalledOnce()
    expect(textarea.setSelectionRange).not.toHaveBeenCalled()
  })
})

describe('insertTextAtSelection', () => {
  it('inserts text at the current cursor position', () => {
    const textarea = {
      selectionStart: 1,
      selectionEnd: 1
    } as HTMLTextAreaElement

    expect(
      insertTextAtSelection(
        {
          focus: vi.fn(),
          textareaElRef: textarea
        },
        '前后',
        '中间'
      )
    ).toEqual({
      value: '前中间后',
      cursorPosition: 3
    })
  })

  it('replaces the selected text', () => {
    const textarea = {
      selectionStart: 1,
      selectionEnd: 3
    } as HTMLTextAreaElement

    expect(
      insertTextAtSelection(
        {
          focus: vi.fn(),
          textareaElRef: textarea
        },
        '1234',
        'ab'
      )
    ).toEqual({
      value: '1ab4',
      cursorPosition: 3
    })
  })

  it('falls back to appending when the input selection is unavailable', () => {
    expect(insertTextAtSelection(null, '已有', '短语')).toEqual({
      value: '已有短语',
      cursorPosition: 4
    })
  })
})
