import { type InjectionKey, inject, provide } from 'vue'

import type { GameResourceProviderValue } from './types'

export const GameResourceProviderKey: InjectionKey<GameResourceProviderValue> =
  Symbol('GameResourceProvider')

export function provideGameResourceProvider(value: GameResourceProviderValue) {
  provide(GameResourceProviderKey, value)
}

export function useGameResourceProvider() {
  const provider = inject(GameResourceProviderKey)

  if (!provider) {
    throw new Error('GameResourceProvider is not provided')
  }

  return provider
}
