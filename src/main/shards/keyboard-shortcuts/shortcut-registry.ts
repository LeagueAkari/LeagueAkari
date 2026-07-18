import { NATIVE_SUPPORT } from '@main/native'
import { isSupportedShortcutId } from '@shared/utils/keyboard-shortcuts'

import {
  DISABLED_KEYS_TARGET_ID,
  DISABLED_KEY_IDS,
  type KeyboardShortcutRegistration,
  type KeyboardShortcutRegistrationType
} from './context'
import type { ActivationShortcutBackend } from './electron-global-shortcut-controller'

export class ShortcutRegistry {
  private readonly registrationMap = new Map<string, KeyboardShortcutRegistration>()
  private readonly targetIdMap = new Map<string, string>()

  constructor(
    private readonly logger: {
      info: (...args: any[]) => void
    },
    private readonly activationShortcutBackend: ActivationShortcutBackend
  ) {}

  register(
    targetId: string,
    shortcutId: string,
    type: KeyboardShortcutRegistrationType,
    cb: KeyboardShortcutRegistration['cb']
  ) {
    const usesNativeInput = NATIVE_SUPPORT.nativeInput.available
    const usesActivationShortcut =
      !usesNativeInput && type === 'normal' && this.activationShortcutBackend.available

    if (!usesNativeInput && !usesActivationShortcut) {
      this.logger.info(`Shortcut type ${type} is unavailable, ignoring registration: ${shortcutId}`)
      return
    }

    if (!isSupportedShortcutId(shortcutId)) {
      throw new Error(`Shortcut ${shortcutId} contains unsupported keys`)
    }

    if (
      usesActivationShortcut &&
      !this.activationShortcutBackend.isShortcutIdSupported(shortcutId)
    ) {
      throw new Error(`Shortcut ${shortcutId} is unavailable for activation-only shortcuts`)
    }

    if (
      usesActivationShortcut &&
      DISABLED_KEY_IDS.some((keyId) => shortcutId.split('+').includes(keyId))
    ) {
      throw new Error(`Shortcut ${shortcutId} contains reserved keys`)
    }

    const existingShortcutRegistration = this.registrationMap.get(shortcutId)
    if (existingShortcutRegistration && existingShortcutRegistration.targetId !== targetId) {
      throw new Error(
        `Shortcut ${shortcutId} is already registered for target ${existingShortcutRegistration.targetId}`
      )
    }

    const originShortcut = this.targetIdMap.get(targetId)
    if (usesActivationShortcut) {
      if (originShortcut && originShortcut !== shortcutId) {
        this.activationShortcutBackend.replace(originShortcut, shortcutId)
      } else if (!existingShortcutRegistration) {
        this.activationShortcutBackend.register(shortcutId)
      }
    }

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

    if (this.activationShortcutBackend.available && options.type === 'normal') {
      this.activationShortcutBackend.unregister(shortcutId)
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

    const registration = this.registrationMap.get(shortcutId)
    if (
      registration &&
      this.activationShortcutBackend.available &&
      registration.type === 'normal'
    ) {
      this.activationShortcutBackend.unregister(shortcutId)
    }

    this.registrationMap.delete(shortcutId)
    this.targetIdMap.delete(targetId)
    this.logger.info(`Unregister shortcut ${shortcutId} for target ${targetId}`)
    return true
  }

  getRegistration(shortcutId: string) {
    if (!NATIVE_SUPPORT.nativeInput.available && !this.activationShortcutBackend.available) {
      return null
    }

    if (
      DISABLED_KEY_IDS.some((keyId) => shortcutId.split('+').includes(keyId)) ||
      !isSupportedShortcutId(shortcutId) ||
      (!NATIVE_SUPPORT.nativeInput.available &&
        !this.activationShortcutBackend.isShortcutIdSupported(shortcutId))
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
    this.activationShortcutBackend.clear()
    this.registrationMap.clear()
    this.targetIdMap.clear()
  }
}
