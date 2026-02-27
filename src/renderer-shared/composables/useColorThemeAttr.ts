import { AppColorTheme, AppThemeId } from '@shared/types/app-theme'
import { MaybeRefOrGetter, toRef, watchEffect } from 'vue'

export function useColorThemeAttr(
  colorTheme: MaybeRefOrGetter<AppColorTheme>,
  themeId: MaybeRefOrGetter<AppThemeId> = colorTheme
) {
  const colorThemeV = toRef(colorTheme)
  const themeIdV = toRef(themeId)

  watchEffect(() => {
    document.documentElement.setAttribute('data-theme', colorThemeV.value)
    document.documentElement.setAttribute('data-theme-id', themeIdV.value)
    document.documentElement.style.setProperty('color-scheme', colorThemeV.value)
  })
}
