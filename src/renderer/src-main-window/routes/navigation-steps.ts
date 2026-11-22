export const MAIN_WINDOW_ROUTE_STEP_KEY = 'main-window.route'

export function createMainPageNavigationStepKey(routeName: string) {
  return `main-page.${routeName}`
}
