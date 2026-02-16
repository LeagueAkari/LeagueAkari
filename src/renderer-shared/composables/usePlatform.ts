import { computed } from 'vue'

import { useAppCommonStore } from '../shards/app-common/store'

type Platform = 'win32' | 'darwin' | 'linux' | 'unknown'

function readPlatformFromDom(): Platform {
  if (typeof document === 'undefined') return 'unknown'
  const p = (document.documentElement.dataset.platform as Platform | undefined) || 'unknown'
  if (p === 'win32' || p === 'darwin' || p === 'linux') return p
  return 'unknown'
}

export function usePlatform() {
  // Note: dataset is set once at renderer bootstrap; computed keeps usage uniform.
  const platform = computed(() => readPlatformFromDom())

  const isWindows = computed(() => platform.value === 'win32')
  const isMacOS = computed(() => platform.value === 'darwin')

  const as = useAppCommonStore()

  const nativeAddonsSupported = computed(() => as.nativeAddons.nativeLoaded)
  const nativeInputHookSupported = computed(() => as.nativeAddons.inputHookSupported)
  const nativeInputInjectSupported = computed(() => as.nativeAddons.inputInjectSupported)
  const toolsForegroundSupported = computed(() => as.nativeAddons.toolsForegroundSupported)
  const toolsWindowPlacementSupported = computed(() => as.nativeAddons.toolsWindowPlacementSupported)
  const toolsFixWindowMethodASupported = computed(
    () => as.nativeAddons.toolsFixWindowMethodASupported
  )

  const globalShortcutsSupported = computed(() => {
    // Current implementation requires admin on Windows; non-Windows relies on native hook capability.
    return nativeInputHookSupported.value && (!isWindows.value || as.isAdministrator)
  })

  const inGameInputInjectionSupported = computed(() => {
    // sendKey/sendString is only wired when native input inject is available.
    return nativeInputInjectSupported.value && (!isWindows.value || as.isAdministrator)
  })

  return {
    platform,
    isWindows,
    isMacOS,
    nativeAddonsSupported,
    nativeInputHookSupported,
    nativeInputInjectSupported,
    toolsForegroundSupported,
    toolsWindowPlacementSupported,
    toolsFixWindowMethodASupported,
    globalShortcutsSupported,
    inGameInputInjectionSupported
  }
}
