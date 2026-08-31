import type { BackgroundMaterialSetting } from '@shared/shards/window-manager'
import type { AkariSupportedPlatform } from '@shared/types/common'

export type NativeBackgroundMaterial = 'none' | 'mica' | 'vibrancy'

export function isSystemBackgroundMaterialSupported(
  platform: AkariSupportedPlatform,
  supportsMica: boolean
) {
  return platform === 'darwin' || (platform === 'win32' && supportsMica)
}

export function resolveNativeBackgroundMaterial(
  material: BackgroundMaterialSetting,
  platform: AkariSupportedPlatform,
  supportsMica: boolean
): NativeBackgroundMaterial {
  if (material !== 'system') {
    return 'none'
  }

  if (platform === 'darwin') {
    return 'vibrancy'
  }

  if (platform === 'win32' && supportsMica) {
    return 'mica'
  }

  return 'none'
}
