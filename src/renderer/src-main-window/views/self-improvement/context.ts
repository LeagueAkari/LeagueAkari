import { type InjectionKey, inject } from 'vue'

import type { SelfImprovementPageContext } from './composables/useSelfImprovementPage'

export const SELF_IMPROVEMENT_PAGE_CONTEXT_KEY: InjectionKey<SelfImprovementPageContext> = Symbol(
  'SelfImprovementPageContext'
)

export function useSelfImprovementPageContext() {
  const context = inject(SELF_IMPROVEMENT_PAGE_CONTEXT_KEY)

  if (!context) {
    throw new Error('useSelfImprovementPageContext must be used within SelfImprovement')
  }

  return context
}
