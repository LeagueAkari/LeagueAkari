export const AUTO_SELECT_NAVIGATION_STEP_KEY = 'automation.auto-select'

export interface AutoSelectNavigationPayload {
  readonly tab: 'pick' | 'ban'
  readonly groupId?: string
}
