export const BUILTIN_LIGHT_THEME_IDS = ['light', 'sakura', 'butter', 'mint'] as const

export const BUILTIN_DARK_THEME_IDS = ['dark', 'graphite', 'cyber', 'aurora'] as const

const APP_THEME_IDS = [...BUILTIN_LIGHT_THEME_IDS, ...BUILTIN_DARK_THEME_IDS] as const

const APP_THEME_VALUES = ['default', ...APP_THEME_IDS] as const

export type AppThemeSetting = (typeof APP_THEME_VALUES)[number]
export type AppThemeId = (typeof APP_THEME_IDS)[number]
export type AppColorTheme = 'light' | 'dark'

const toColorThemeMap = <T extends readonly string[]>(ids: T, colorTheme: AppColorTheme) => {
  return Object.fromEntries(ids.map((id) => [id, colorTheme])) as Record<T[number], AppColorTheme>
}

const THEME_COLOR_THEME_MAP: Record<AppThemeId, AppColorTheme> = {
  ...toColorThemeMap(BUILTIN_LIGHT_THEME_IDS, 'light'),
  ...toColorThemeMap(BUILTIN_DARK_THEME_IDS, 'dark')
}

export function isAppThemeSetting(value: unknown): value is AppThemeSetting {
  return typeof value === 'string' && APP_THEME_VALUES.includes(value as AppThemeSetting)
}

export function getThemeColorTheme(themeId: AppThemeId): AppColorTheme {
  return THEME_COLOR_THEME_MAP[themeId]
}

export interface ResolvedThemeSetting {
  colorTheme: AppColorTheme
  themeId: AppThemeId
}

export function resolveThemeSetting(
  theme: AppThemeSetting,
  systemColorTheme: AppColorTheme
): ResolvedThemeSetting {
  if (theme === 'default') {
    return {
      colorTheme: systemColorTheme,
      themeId: systemColorTheme
    }
  }

  if (theme in THEME_COLOR_THEME_MAP) {
    const themeId = theme as AppThemeId
    return {
      colorTheme: THEME_COLOR_THEME_MAP[themeId],
      themeId
    }
  }

  return {
    colorTheme: 'dark',
    themeId: 'dark'
  }
}
