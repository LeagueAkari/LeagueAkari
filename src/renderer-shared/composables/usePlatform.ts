import { computed } from 'vue'

import { useAppCommonStore } from '../shards/app-common/store'

type Platform = 'win32' | 'darwin' | 'linux' | 'unknown'

export function usePlatform() {
  const as = useAppCommonStore()

  const platform = computed<Platform>(() => as.platform as Platform)

  const isWindows = computed(() => platform.value === 'win32')
  const isMacOS = computed(() => platform.value === 'darwin')

  const nativeAddonsSupported = computed(() => as.nativeAddons.nativeLoaded)
  const nativeInputHookSupported = computed(() => as.nativeAddons.inputHookSupported)
  const nativeInputInjectSupported = computed(() => as.nativeAddons.inputInjectSupported)
  const toolsForegroundSupported = computed(() => as.nativeAddons.toolsForegroundSupported)
  const toolsWindowPlacementSupported = computed(
    () => as.nativeAddons.toolsWindowPlacementSupported
  )
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
