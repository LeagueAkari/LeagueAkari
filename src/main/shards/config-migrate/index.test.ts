import 'reflect-metadata'

import { describe, expect, it } from 'vitest'

import {
  MIGRATION_FROM_143,
  getAutoMiscSettingMigrationTarget,
  sanitizeShortcutSettingRecord,
  shouldResetInGameSendSetting
} from './migrations/from-1-4-3'

describe('from 1.4.3 migration', () => {
  it('uses the 1.4.3 migration marker', () => {
    expect(MIGRATION_FROM_143).toBe('akari-migration-from-1.4.3_patch1')
  })
})

describe('sanitizeShortcutSettingRecord', () => {
  it('clears scalar shortcut settings containing unsupported keys', () => {
    expect(
      sanitizeShortcutSettingRecord({
        key: 'game-client-main/terminateShortcut',
        value: 'LeftControl+F24'
      })
    ).toEqual({
      changed: true,
      value: null
    })
  })

  it('keeps scalar shortcut settings containing only standard keyboard keys', () => {
    expect(
      sanitizeShortcutSettingRecord({
        key: 'game-client-main/terminateShortcut',
        value: 'LeftControl+F12'
      })
    ).toEqual({
      changed: false,
      value: 'LeftControl+F12'
    })
  })
})

describe('shouldResetInGameSendSetting', () => {
  it('resets in-game-send templates and sendable items', () => {
    expect(shouldResetInGameSendSetting('in-game-send-main/templates')).toBe(true)
    expect(shouldResetInGameSendSetting('in-game-send-main/sendableItems')).toBe(true)
    expect(shouldResetInGameSendSetting('in-game-send-main/autoTemplateBootstrap')).toBe(true)
  })

  it('keeps unrelated in-game-send settings', () => {
    expect(shouldResetInGameSendSetting('in-game-send-main/sendInterval')).toBe(false)
    expect(shouldResetInGameSendSetting('in-game-send-main/cancelShortcut')).toBe(false)
  })
})

describe('getAutoMiscSettingMigrationTarget', () => {
  it('moves existing auto reply settings into the auto misc shard namespace', () => {
    expect(getAutoMiscSettingMigrationTarget('auto-reply-main/enabled')).toBe(
      'auto-misc-main/autoReplyEnabled'
    )
    expect(getAutoMiscSettingMigrationTarget('auto-reply-main/enableOnAway')).toBe(
      'auto-misc-main/autoReplyEnableOnAway'
    )
    expect(getAutoMiscSettingMigrationTarget('auto-reply-main/text')).toBe(
      'auto-misc-main/autoReplyText'
    )
    expect(getAutoMiscSettingMigrationTarget('auto-reply-main/lockOfflineStatus')).toBe(
      'auto-misc-main/lockOfflineStatus'
    )
  })

  it('ignores unrelated setting keys', () => {
    expect(getAutoMiscSettingMigrationTarget('auto-select-main/enabled')).toBeNull()
  })
})
