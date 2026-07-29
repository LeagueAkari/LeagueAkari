import { describe, expect, it } from 'vitest'

import { useCompositionAwareInput } from './useCompositionAwareInput'

describe('useCompositionAwareInput', () => {
  it('commits ordinary input updates immediately', () => {
    const input = useCompositionAwareInput()

    input.handleUpdateValue('search')

    expect(input.inputValue.value).toBe('search')
    expect(input.committedValue.value).toBe('search')
  })

  it('keeps the committed value stable until composition ends', () => {
    const input = useCompositionAwareInput('previous')

    input.handleCompositionStart()
    input.handleUpdateValue('zh')
    input.handleUpdateValue('中文')

    expect(input.inputValue.value).toBe('中文')
    expect(input.committedValue.value).toBe('previous')

    input.handleCompositionEnd({ target: { value: '中文' } } as unknown as CompositionEvent)

    expect(input.isComposing.value).toBe(false)
    expect(input.inputValue.value).toBe('中文')
    expect(input.committedValue.value).toBe('中文')
  })

  it('resets both values and composition state programmatically', () => {
    const input = useCompositionAwareInput('initial')

    input.handleCompositionStart()
    input.handleUpdateValue('draft')
    input.setValue('')

    expect(input.isComposing.value).toBe(false)
    expect(input.inputValue.value).toBe('')
    expect(input.committedValue.value).toBe('')
  })
})
