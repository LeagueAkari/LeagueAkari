import { type InjectionKey, inject, provide } from 'vue'

import type { OngoingGameProviderValue } from './types'

export const OngoingGameProviderKey: InjectionKey<OngoingGameProviderValue> =
  Symbol('OngoingGameProvider')

export function provideOngoingGameProvider(value: OngoingGameProviderValue) {
  provide(OngoingGameProviderKey, value)
}

export function useOngoingGameProvider() {
  const provider = inject(OngoingGameProviderKey)

  if (!provider) {
    throw new Error('OngoingGameProvider is not provided')
  }

  return provider
}
