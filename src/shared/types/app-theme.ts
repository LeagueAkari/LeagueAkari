export const APP_THEME_VALUES = [
  'default',
  'light',
  'dark',
  'graphite',
  'sakura',
  'mint',
  'aurora',
  'butter'
] as const

export const APP_THEME_IDS = [
  'light',
  'dark',
  'graphite',
  'sakura',
  'mint',
  'aurora',
  'butter'
] as const

export type AppThemeSetting = (typeof APP_THEME_VALUES)[number]
export type AppThemeId = (typeof APP_THEME_IDS)[number]
export type AppColorTheme = 'light' | 'dark'

export function isAppThemeSetting(value: unknown): value is AppThemeSetting {
  return typeof value === 'string' && APP_THEME_VALUES.includes(value as AppThemeSetting)
}

export interface ResolvedThemeSetting {
  colorTheme: AppColorTheme
  themeId: AppThemeId
}

export function resolveThemeSetting(
  theme: AppThemeSetting,
  systemColorTheme: AppColorTheme
): ResolvedThemeSetting {
  switch (theme) {
    case 'default':
      return {
        colorTheme: systemColorTheme,
        themeId: systemColorTheme
      }
    case 'light':
      return {
        colorTheme: 'light',
        themeId: 'light'
      }
    case 'dark':
      return {
        colorTheme: 'dark',
        themeId: 'dark'
      }
    case 'graphite':
      return {
        colorTheme: 'dark',
        themeId: 'graphite'
      }
    case 'sakura':
      return {
        colorTheme: 'light',
        themeId: 'sakura'
      }
    case 'mint':
      return {
        colorTheme: 'light',
        themeId: 'mint'
      }
    case 'aurora':
      return {
        colorTheme: 'dark',
        themeId: 'aurora'
      }
    case 'butter':
      return {
        colorTheme: 'light',
        themeId: 'butter'
      }
    default:
      return {
        colorTheme: 'dark',
        themeId: 'graphite'
      }
  }
}
