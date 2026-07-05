import { describe, expect, it, vi } from 'vitest'

import { focusTextInput } from './cursor'

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
