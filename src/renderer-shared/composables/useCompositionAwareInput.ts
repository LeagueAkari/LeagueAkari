import { readonly, ref } from 'vue'

export function useCompositionAwareInput(initialValue = '') {
  const inputValue = ref(initialValue)
  const committedValue = ref(initialValue)
  const isComposing = ref(false)

  const setValue = (value: string) => {
    isComposing.value = false
    inputValue.value = value
    committedValue.value = value
  }

  const handleUpdateValue = (value: string) => {
    inputValue.value = value

    if (!isComposing.value) {
      committedValue.value = value
    }
  }

  const handleCompositionStart = () => {
    isComposing.value = true
  }

  const handleCompositionEnd = (event: CompositionEvent) => {
    const targetValue = (event.target as { value?: unknown } | null)?.value
    setValue(typeof targetValue === 'string' ? targetValue : inputValue.value)
  }

  return {
    inputValue,
    committedValue,
    isComposing: readonly(isComposing),
    setValue,
    handleUpdateValue,
    handleCompositionStart,
    handleCompositionEnd
  }
}
