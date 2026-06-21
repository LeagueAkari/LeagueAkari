import { NATIVE_SUPPORT, nativeInput } from '@main/native'
import { isSupportedShortcutId } from '@shared/utils/keyboard-shortcuts'

import {
  DISABLED_KEYS,
  DISABLED_KEYS_TARGET_ID,
  type KeyboardShortcutRegistration,
  type KeyboardShortcutRegistrationType
} from './context'

export class ShortcutRegistry {
  private readonly registrationMap = new Map<string, KeyboardShortcutRegistration>()
  private readonly targetIdMap = new Map<string, string>()

  constructor(
    private readonly logger: {
      info: (...args: any[]) => void
    }
  ) {}

  register(
    targetId: string,
    shortcutId: string,
    type: KeyboardShortcutRegistrationType,
    cb: KeyboardShortcutRegistration['cb']
  ) {
    if (!NATIVE_SUPPORT.nativeInput.available) {
      this.logger.info(
        `Native global shortcuts are unavailable, ignoring shortcut registration: ${shortcutId} (${type})`
      )
      return
    }

    if (!isSupportedShortcutId(shortcutId)) {
      throw new Error(`Shortcut ${shortcutId} contains unsupported keys`)
    }

    const existingShortcutRegistration = this.registrationMap.get(shortcutId)
    if (existingShortcutRegistration && existingShortcutRegistration.targetId !== targetId) {
      throw new Error(
        `Shortcut ${shortcutId} is already registered for target ${existingShortcutRegistration.targetId}`
      )
    }

    const originShortcut = this.targetIdMap.get(targetId)
    if (originShortcut && originShortcut !== shortcutId) {
      this.registrationMap.delete(originShortcut)
    }

    this.registrationMap.set(shortcutId, { type, targetId, shortcutId, cb })
    this.targetIdMap.set(targetId, shortcutId)
    this.logger.info(`Register shortcut ${shortcutId} for target ${targetId} (${type})`)
  }

  unregister(shortcutId: string) {
    const options = this.registrationMap.get(shortcutId)
    if (!options) {
      return false
    }

    this.registrationMap.delete(shortcutId)
    this.targetIdMap.delete(options.targetId)
    this.logger.info(`Unregister shortcut ${shortcutId} for target ${options.targetId}`)
    return true
  }

  unregisterByTargetId(targetId: string) {
    const shortcutId = this.targetIdMap.get(targetId)
    if (!shortcutId) {
      return false
    }

    this.registrationMap.delete(shortcutId)
    this.targetIdMap.delete(targetId)
    this.logger.info(`Unregister shortcut ${shortcutId} for target ${targetId}`)
    return true
  }

  getRegistration(shortcutId: string) {
    if (!NATIVE_SUPPORT.nativeInput.available) {
      return null
    }

    const reservedKeyIds = DISABLED_KEYS.map(
      (keyCode) => nativeInput.VKEY_MAP[keyCode]?.keyId
    ).filter((keyId): keyId is string => Boolean(keyId))

    if (
      reservedKeyIds.some((keyId) => shortcutId.includes(keyId)) ||
      !isSupportedShortcutId(shortcutId)
    ) {
      return {
        type: 'normal',
        targetId: DISABLED_KEYS_TARGET_ID,
        shortcutId,
        cb: () => {}
      } satisfies KeyboardShortcutRegistration
    }

    return this.registrationMap.get(shortcutId) || null
  }

  getRegistrationByTargetId(targetId: string) {
    if (targetId === DISABLED_KEYS_TARGET_ID) {
      return {
        type: 'normal',
        targetId: DISABLED_KEYS_TARGET_ID,
        shortcutId: '',
        cb: () => {}
      } satisfies KeyboardShortcutRegistration
    }

    const shortcutId = this.targetIdMap.get(targetId)
    if (shortcutId) {
      return this.registrationMap.get(shortcutId) || null
    }

    return null
  }

  getActiveRegistration(shortcutId: string) {
    return this.registrationMap.get(shortcutId) || null
  }

  clear() {
    this.registrationMap.clear()
    this.targetIdMap.clear()
  }
}
