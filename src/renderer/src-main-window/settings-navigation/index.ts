import type { MainWindowNavigationOptions } from '@renderer-shared/components/settings-navigation/targets'
import { useInstance } from '@renderer-shared/shards'
import {
  AKARI_NAVIGATION_DEFAULT_DEADLINE_MS,
  type AkariNavigation,
  AkariNavigationRenderer
} from '@renderer-shared/shards/akari-navigation'

import { createSettingsNavigationPath, getSettingsNavigationTarget } from './registry'

export async function activateRegisteredTarget(
  navigation: AkariNavigation,
  id: string,
  options: MainWindowNavigationOptions = {}
) {
  const target = getSettingsNavigationTarget(id)
  if (!target) {
    return
  }

  const deadlineAt = Date.now() + AKARI_NAVIGATION_DEFAULT_DEADLINE_MS
  const result = await navigation.navigate(createSettingsNavigationPath(target, options), {
    deadlineAt
  })

  if (result.status !== 'unavailable' || !target.fallbackId) {
    return result
  }

  const fallback = getSettingsNavigationTarget(target.fallbackId)!
  return navigation.navigate(createSettingsNavigationPath(fallback, options), { deadlineAt })
}

export function useSettingsNavigationReceiver() {
  const navigation = useInstance(AkariNavigationRenderer)

  navigation.onNavigationRequest<MainWindowNavigationOptions>(({ targetId, payload }) => {
    void activateRegisteredTarget(navigation.runtime, targetId, payload)
  })
}

export * from './registry'
