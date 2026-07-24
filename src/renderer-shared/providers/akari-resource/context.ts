import { type InjectionKey, inject, provide } from 'vue'

import type { AkariResourceProviderValue } from './types'

export const AkariResourceProviderKey: InjectionKey<AkariResourceProviderValue> =
  Symbol('AkariResourceProvider')

export function provideAkariResourceProvider(value: AkariResourceProviderValue) {
  provide(AkariResourceProviderKey, value)
}

export function useAkariResourceProvider() {
  const provider = inject(AkariResourceProviderKey)

  if (!provider) {
    throw new Error('AkariResourceProvider is not provided')
  }

  return provider
}
