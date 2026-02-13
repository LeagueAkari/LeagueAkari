import { computed } from 'vue'

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

  // Native addons (input hook/window placement) are currently only shipped for Windows.
  const nativeAddonsSupported = computed(() => isWindows.value)

  return {
    platform,
    isWindows,
    isMacOS,
    nativeAddonsSupported
  }
}
