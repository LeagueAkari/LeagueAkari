import type { NavigationTargetGroup } from './types'

export const FLASH_POSITION_TARGET_ID = 'champion-data.flash-position'

export const secondaryWindowTargets = [
  {
    groupKeys: ['opgg.view.settings.sections.preferences'],
    targets: [{ id: FLASH_POSITION_TARGET_ID, labelKey: 'opgg.view.settings.flashPosition.label' }]
  }
] as const satisfies readonly NavigationTargetGroup[]

export type SecondaryWindowTargetId =
  (typeof secondaryWindowTargets)[number]['targets'][number]['id']
