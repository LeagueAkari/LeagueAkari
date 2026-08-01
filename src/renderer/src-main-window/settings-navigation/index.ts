import type { AkariNavigation } from '@renderer-shared/shards/akari-navigation'

import {
  type SettingsNavigationTargetId,
  createSettingsNavigationPath,
  getSettingsNavigationTarget
} from './registry'

const SETTINGS_NAVIGATION_DEADLINE_MS = 10_000

export interface NavigateToSettingOptions {
  readonly autoSelectGroupId?: string
}

export async function navigateToSetting(
  navigation: AkariNavigation,
  id: SettingsNavigationTargetId,
  options: NavigateToSettingOptions = {}
) {
  const deadlineAt = Date.now() + SETTINGS_NAVIGATION_DEADLINE_MS
  let currentTarget = getSettingsNavigationTarget(id)!

  while (true) {
    const result = await navigation.navigate(createSettingsNavigationPath(currentTarget, options), {
      deadlineAt
    })

    if (result.status !== 'unavailable' || !currentTarget.fallbackId) {
      return result
    }

    currentTarget = getSettingsNavigationTarget(currentTarget.fallbackId)!
  }
}

export * from './registry'
