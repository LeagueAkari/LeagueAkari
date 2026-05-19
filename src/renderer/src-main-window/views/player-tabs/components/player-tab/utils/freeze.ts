import { MaybeRefOrGetter, Ref, ref, shallowRef, toValue, watchEffect } from 'vue'

export interface FreezeValueReturn<T> {
  isFrozen: Ref<boolean>
  value: Ref<T>
  freeze: () => void
  unfreeze: () => void
}

export interface UseFreezeValueOptions {
  initialFrozen: boolean
}

export function useFreezeValue<T>(
  source: MaybeRefOrGetter<T>,
  options: UseFreezeValueOptions = { initialFrozen: false }
): FreezeValueReturn<T> {
  const isFrozen = ref(options.initialFrozen)
  const value = shallowRef<T>(toValue(source))

  watchEffect(() => {
    if (!isFrozen.value) {
      value.value = toValue(source)
    }
  })

  const freeze = () => {
    if (isFrozen.value) return

    isFrozen.value = true
    value.value = toValue(source)
  }

  const unfreeze = () => {
    if (!isFrozen.value) return

    isFrozen.value = false
    value.value = toValue(source)
  }

  return {
    isFrozen,
    value: value,
    unfreeze,
    freeze
  }
}
