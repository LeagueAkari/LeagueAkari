import {
  AppThemeId,
  AppThemeSetting,
  isAppThemeSetting,
  resolveThemeSetting
} from '@shared/types/app-theme'
import { usePreferredColorScheme } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { defineStore } from 'pinia'
import { computed, ref, shallowReactive, shallowRef, watch } from 'vue'

interface BaseConfig {
  disableHardwareAcceleration?: boolean
}

export interface HttpProxySetting {
  strategy: 'auto' | 'force' | 'disable'
  port: number
  host: string
}

export const useAppCommonStore = defineStore('shard:app-common-renderer', () => {
  const settings = shallowReactive({
    showFreeSoftwareDeclaration: false,
    isInKyokoMode: false,
    locale: 'zh-CN',
    theme: 'default' as AppThemeSetting,
    httpProxy: {
      strategy: 'disable' as 'auto' | 'force' | 'disable',
      port: 0,
      host: ''
    } as HttpProxySetting,
    forceDisableProxy: false,
    streamerMode: false,
    streamerModeUseAkariStyledName: false,
    preferredLolSource: 'sgp' as 'sgp' | 'lcu'
  })

  const { t } = useTranslation()

  const version = ref('0.0.0')
  const isRabiVersion = computed(() => version.value.includes('-rabi'))
  const isAdministrator = ref(false)
  const platform = ref<'darwin' | 'win32' | 'unknown'>('unknown')
  const startupDeepLink = ref<string | null>(null)
  const overrideAppTitle = ref('') // 可以覆盖掉
  const appTitle = computed(
    () =>
      overrideAppTitle.value ||
      (isAdministrator.value
        ? `${t('appName', { ns: 'common' })} X`
        : t('appName', { ns: 'common' }))
  )
  const disableHardwareAcceleration = ref(false)
  const baseConfig = shallowRef<BaseConfig | null>(null)
  const isRunInTempDir = ref(false)
  const nativeAddons = shallowReactive({
    nativeLoaded: false,
    inputHookSupported: false,
    inputInjectSupported: false,
    toolsForegroundSupported: false,
    toolsWindowPlacementSupported: false,
    toolsFixWindowMethodASupported: false
  })

  /* for fun only */
  const tempAkariSubscriptionInfo = shallowRef({
    current: 'basic',
    shown: false
  })

  const preferredColorScheme = usePreferredColorScheme()
  const invalidThemeWarned = ref<string | null>(null)
  const rawThemeSetting = computed(() => settings.theme as unknown as string)

  const normalizedThemeSetting = computed<AppThemeSetting>(() => {
    if (isAppThemeSetting(rawThemeSetting.value)) {
      return rawThemeSetting.value
    }

    return 'dark'
  })

  watch(
    rawThemeSetting,
    (theme) => {
      if (isAppThemeSetting(theme)) {
        invalidThemeWarned.value = null
        return
      }

      if (invalidThemeWarned.value === theme) {
        return
      }

      invalidThemeWarned.value = theme
      console.warn(`[app-common] invalid theme "${String(theme)}", fallback to "dark"`)
    },
    { immediate: true }
  )

  const resolvedTheme = computed(() => {
    return resolveThemeSetting(
      normalizedThemeSetting.value,
      preferredColorScheme.value === 'dark' ? 'dark' : 'light'
    )
  })

  const colorTheme = computed<'light' | 'dark'>(() => {
    return resolvedTheme.value.colorTheme
  })

  const themeId = computed<AppThemeId>(() => {
    return resolvedTheme.value.themeId
  })

  return {
    settings,
    appTitle,
    overrideAppTitle,
    isAdministrator,
    platform,
    disableHardwareAcceleration,
    version,
    isRabiVersion,
    baseConfig,
    startupDeepLink,
    isRunInTempDir,
    themeId,
    colorTheme,
    nativeAddons,
    tempAkariSubscriptionInfo
  }
})
