import type { AkariNavigationRequest } from '@shared/shards/akari-navigation'

import {
  type MainWindowNavigationOptions,
  type MainWindowTargetId,
  mainWindowTargets
} from './main-window'
import { type SecondaryWindowTargetId, secondaryWindowTargets } from './secondary-window'
import type { NavigationTargetGroup } from './types'

export type MainWindowTarget = {
  window: 'main-window'
  targetId: MainWindowTargetId
  payload?: MainWindowNavigationOptions
}

export type NavigationTargetAddress =
  | MainWindowTarget
  | { window: 'secondary-window'; targetId: SecondaryWindowTargetId; payload?: never }

function searchableTargets<TWindow extends AkariNavigationRequest['window'], TId extends string>(
  window: TWindow,
  groups: readonly NavigationTargetGroup<TId>[],
  windowLabelKey?: string
) {
  return groups.flatMap(({ groupKeys, targets }) =>
    targets
      .filter((target) => target.searchable !== false)
      .map((target) => ({
        address: { window, targetId: target.id },
        groupKeys: windowLabelKey ? [windowLabelKey, ...groupKeys] : groupKeys,
        labelKey: target.labelKey,
        descriptionKey: target.descriptionKey,
        keywordKeys: target.keywordKeys
      }))
  )
}

const mainWindowSearchTargets = searchableTargets('main-window', mainWindowTargets)
const secondaryWindowSearchTargets = searchableTargets(
  'secondary-window',
  secondaryWindowTargets,
  'settings.multiWindow.secondaryWindow.title'
)

export function getSearchableNavigationTargets(secondaryWindowEnabled: boolean) {
  if (secondaryWindowEnabled) {
    return [...mainWindowSearchTargets, ...secondaryWindowSearchTargets]
  }

  return mainWindowSearchTargets
}

export type { MainWindowNavigationOptions, MainWindowTargetId, SecondaryWindowTargetId }
