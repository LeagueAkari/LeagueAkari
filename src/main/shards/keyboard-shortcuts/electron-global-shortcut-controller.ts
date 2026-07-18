import type { ShortcutDetails } from '@shared/shards/keyboard-shortcut'
import {
  isActivationShortcutIdSupported,
  shortcutIdToElectronAccelerator
} from '@shared/utils/activation-shortcuts'
import { globalShortcut } from 'electron'

import { UNIFIED_KEY_ID, VKEY_MAP, isModifierKey } from './definitions'
import { shouldUseElectronGlobalShortcuts } from './platform'

interface ElectronGlobalShortcutApi {
  register(accelerator: string, callback: () => void): boolean
  unregister(accelerator: string): void
}

export interface ActivationShortcutBackend {
  readonly available: boolean
  isShortcutIdSupported(shortcutId: string): boolean
  register(shortcutId: string): void
  replace(previousShortcutId: string, shortcutId: string): void
  unregister(shortcutId: string): void
  clear(): void
}

const KEY_DEFINITION_BY_ID = new Map(
  Object.entries(VKEY_MAP).map(([rawKeyCode, definition]) => [
    definition.keyId,
    { keyCode: Number(rawKeyCode), definition }
  ])
)

export function buildActivationShortcutDetails(shortcutId: string): ShortcutDetails {
  const keys = shortcutId.split('+').map((keyId) => {
    const entry = KEY_DEFINITION_BY_ID.get(keyId)
    if (!entry) {
      throw new Error(`Unknown activation shortcut key: ${keyId}`)
    }

    return {
      keyId,
      keyCode: entry.keyCode,
      isModifier: isModifierKey(entry.keyCode)
    }
  })

  return {
    keyCodes: keys.map((key) => key.keyCode),
    keys,
    id: shortcutId,
    unifiedId: [
      ...new Set(
        keys.map((key) => UNIFIED_KEY_ID[key.keyCode as keyof typeof UNIFIED_KEY_ID] ?? key.keyId)
      )
    ].join('+'),
    pressed: true
  }
}

export class ElectronGlobalShortcutController implements ActivationShortcutBackend {
  private readonly _acceleratorByShortcutId = new Map<string, string>()
  private readonly _shortcutIdByAccelerator = new Map<string, string>()

  constructor(
    private readonly _logger: {
      info: (...args: any[]) => void
    },
    private readonly _onActivated: (details: ShortcutDetails) => void,
    private readonly _globalShortcut: ElectronGlobalShortcutApi = globalShortcut,
    private readonly _platform: NodeJS.Platform = process.platform
  ) {}

  get available() {
    return shouldUseElectronGlobalShortcuts(this._platform)
  }

  isShortcutIdSupported(shortcutId: string) {
    return this.available && isActivationShortcutIdSupported(shortcutId)
  }

  register(shortcutId: string) {
    if (!this.available) {
      throw new Error('Electron global shortcuts are unavailable on this platform')
    }

    const accelerator = shortcutIdToElectronAccelerator(shortcutId)
    if (!accelerator) {
      throw new Error(`Shortcut ${shortcutId} is not supported by Electron global shortcuts`)
    }

    const existingAccelerator = this._acceleratorByShortcutId.get(shortcutId)
    if (existingAccelerator === accelerator) {
      return
    }

    const existingShortcutId = this._shortcutIdByAccelerator.get(accelerator)
    if (existingShortcutId && existingShortcutId !== shortcutId) {
      throw new Error(
        `Shortcut ${shortcutId} conflicts with registered shortcut ${existingShortcutId}`
      )
    }

    const registered = this._globalShortcut.register(accelerator, () => {
      const activeShortcutId = this._shortcutIdByAccelerator.get(accelerator)
      if (activeShortcutId) {
        this._onActivated(buildActivationShortcutDetails(activeShortcutId))
      }
    })

    if (!registered) {
      throw new Error(`Electron refused to register global shortcut ${shortcutId}`)
    }

    this._acceleratorByShortcutId.set(shortcutId, accelerator)
    this._shortcutIdByAccelerator.set(accelerator, shortcutId)
    this._logger.info(`Registered Electron global shortcut ${shortcutId} (${accelerator})`)
  }

  replace(previousShortcutId: string, shortcutId: string) {
    const previousAccelerator = this._acceleratorByShortcutId.get(previousShortcutId)
    const accelerator = shortcutIdToElectronAccelerator(shortcutId)

    if (!previousAccelerator) {
      this.register(shortcutId)
      return
    }

    if (!accelerator) {
      throw new Error(`Shortcut ${shortcutId} is not supported by Electron global shortcuts`)
    }

    if (previousAccelerator === accelerator) {
      this._acceleratorByShortcutId.delete(previousShortcutId)
      this._acceleratorByShortcutId.set(shortcutId, accelerator)
      this._shortcutIdByAccelerator.set(accelerator, shortcutId)
      return
    }

    this.register(shortcutId)
    this.unregister(previousShortcutId)
  }

  unregister(shortcutId: string) {
    const accelerator = this._acceleratorByShortcutId.get(shortcutId)
    if (!accelerator) {
      return
    }

    this._globalShortcut.unregister(accelerator)
    this._acceleratorByShortcutId.delete(shortcutId)
    this._shortcutIdByAccelerator.delete(accelerator)
    this._logger.info(`Unregistered Electron global shortcut ${shortcutId} (${accelerator})`)
  }

  clear() {
    for (const accelerator of this._shortcutIdByAccelerator.keys()) {
      this._globalShortcut.unregister(accelerator)
    }

    this._acceleratorByShortcutId.clear()
    this._shortcutIdByAccelerator.clear()
  }
}
