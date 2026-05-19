import 'reflect-metadata'

import { describe, expect, it } from 'vitest'

import { MIGRATION_FROM_143, sanitizeShortcutSettingRecord } from './migrations/from-1-4-3'

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

  it('clears unsupported sendable item shortcuts while preserving valid shortcuts', () => {
    expect(
      sanitizeShortcutSettingRecord({
        key: 'in-game-send-main/sendableItems',
        value: [
          {
            id: '1',
            name: 'Valid',
            sendAllShortcut: 'A',
            sendAllyShortcut: 'LeftControl+Q',
            sendEnemyShortcut: null
          },
          {
            id: '2',
            name: 'Invalid',
            sendAllShortcut: 'F24',
            sendAllyShortcut: 'LeftControl+F24',
            sendEnemyShortcut: 'F12'
          }
        ]
      })
    ).toEqual({
      changed: true,
      value: [
        {
          id: '1',
          name: 'Valid',
          sendAllShortcut: 'A',
          sendAllyShortcut: 'LeftControl+Q',
          sendEnemyShortcut: null
        },
        {
          id: '2',
          name: 'Invalid',
          sendAllShortcut: null,
          sendAllyShortcut: null,
          sendEnemyShortcut: 'F12'
        }
      ]
    })
  })
})
