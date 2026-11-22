export const AKARI_NAVIGATION_MAIN_NAMESPACE = 'akari-navigation-main'

export interface AkariNavigationRequest<TPayload = unknown> {
  readonly window: 'main-window' | 'secondary-window'
  readonly targetId: string
  readonly payload?: TPayload
}
