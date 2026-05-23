import { i18next } from '@main/i18n'
import { getThemeColorTheme, isAppThemeSetting } from '@shared/types/app-theme'
import { nativeTheme } from 'electron'

import type { AppCommonMainContext } from './context'

export class AppCommonThemeController {
  constructor(private readonly context: AppCommonMainContext) {}

  watch() {
    this._watchLocale()
    this._watchTheme()
    this._watchNativeTheme()
  }

  private _watchLocale() {
    this.context.mobxUtils.reaction(
      () => this.context.settings.locale,
      (locale) => {
        i18next.changeLanguage(locale)
      },
      { fireImmediately: true }
    )
  }

  private _watchTheme() {
    this.context.mobxUtils.reaction(
      () => this.context.settings.theme,
      (theme) => {
        if (theme === 'default') {
          nativeTheme.themeSource = 'system'
          return
        }

        if (isAppThemeSetting(theme)) {
          // Electron 原生主题仅支持 light/dark/system，其他主题在渲染层做 token 覆盖。
          nativeTheme.themeSource = getThemeColorTheme(theme)
          return
        }

        this.context.logger.warn('Invalid theme value, fallback to dark', theme)
        nativeTheme.themeSource = 'dark'
      },
      { fireImmediately: true }
    )
  }

  private _watchNativeTheme() {
    nativeTheme.on('updated', () => {
      this.context.state.setShouldUseDarkColors(nativeTheme.shouldUseDarkColors)
    })

    this.context.state.setShouldUseDarkColors(nativeTheme.shouldUseDarkColors)
  }
}
