export const MAIN_WINDOW_NAVIGATION_STEP_KEY = 'main-window'

export function createMainPageNavigationStepKey(routeName: string) {
  return `main-page.${routeName}`
}

export type MainWindowNavigationPayload =
  | {
      surface: 'settings-modal'
    }
  | {
      surface: 'route'
      route: {
        name: string
        section: string
      }
    }
