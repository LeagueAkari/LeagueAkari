export const SETTINGS_MODAL_NAVIGATION_STEP_KEY = 'settings-modal'

export const APP_SETTINGS_NAVIGATION_STEP_KEY = 'settings-modal.basic.app'
export const MISC_SETTINGS_NAVIGATION_STEP_KEY = 'settings-modal.misc'

export type SettingsTabName =
  'basic' | 'player-tabs' | 'ongoing-game' | 'multi-window' | 'storage' | 'misc' | 'debug' | 'about'

export type AppSettingsNavigationPayload = 'windows-only' | 'forced-http-proxy'
export type MiscSettingsNavigationPayload = 'streamer-mode-enabled'
