import {
  AppThemeId,
  AppThemeSetting,
  isAppThemeSetting,
  resolveThemeSetting
} from '@shared/types/app-theme'
import { AkariSupportedPlatform, BaseConfig, NativeSupport } from '@shared/types/common'
import { usePreferredColorScheme } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { defineStore } from 'pinia'
import { computed, ref, shallowReactive, shallowRef } from 'vue'

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
  const isElevated = ref(false)
  const platform = ref<AkariSupportedPlatform>('unknown')
  const isWindows = computed(() => platform.value === 'win32')
  const isMacOS = computed(() => platform.value === 'darwin')
  const startupDeepLink = ref<string | null>(null)
  const overrideAppTitle = ref('') // 可以覆盖掉
  const appTitle = computed(
    () =>
      overrideAppTitle.value ||
      (isElevated.value ? `${t('appName', { ns: 'common' })} X` : t('appName', { ns: 'common' }))
  )
  const disableHardwareAcceleration = ref(false)
  const baseConfig = shallowRef<BaseConfig | null>(null)
  const isRunInTempDir = ref(false)

  const nativeSupport = shallowRef<NativeSupport>({
    nativeInput: {
      available: false,
      availableOnCurrentPlatform: false,
      requiresElevation: false
    },
    getLeagueClientWindowPlacement: {
      available: false,
      availableOnCurrentPlatform: false,
      requiresElevation: false
    },
    adjustLeagueClientWindowSize: {
      available: false,
      availableOnCurrentPlatform: false,
      requiresElevation: false
    },
    isProcessForeground: {
      available: false,
      availableOnCurrentPlatform: false,
      requiresElevation: false
    }
  })

  /* for fun only */
  const tempAkariSubscriptionInfo = shallowRef({
    current: 'basic',
    shown: false
  })

  const preferredColorScheme = usePreferredColorScheme()
  const rawThemeSetting = computed(() => settings.theme as unknown as string)

  const normalizedThemeSetting = computed<AppThemeSetting>(() => {
    if (isAppThemeSetting(rawThemeSetting.value)) {
      return rawThemeSetting.value
    }

    return 'dark'
  })

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
    isElevated,
    platform,
    isWindows,
    isMacOS,
    disableHardwareAcceleration,
    version,
    isRabiVersion,
    baseConfig,
    startupDeepLink,
    isRunInTempDir,
    themeId,
    colorTheme,
    nativeSupport,
    tempAkariSubscriptionInfo
  }
})
