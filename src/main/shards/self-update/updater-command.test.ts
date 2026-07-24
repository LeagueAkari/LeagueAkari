import { describe, expect, test } from 'vitest'

import { createApplyUpdaterArguments, createUninstallUpdaterArguments } from './updater-command'

describe('updater command arguments', () => {
  test('keeps a volume root target in its own argv entry', () => {
    expect(
      createApplyUpdaterArguments({
        locale: 'zh-CN',
        archivePath: String.raw`C:\Users\Administrator\AppData\Roaming\league-akari\NewUpdates\league-akari-win-x64.7z`,
        targetPath: 'F:\\'
      })
    ).toEqual([
      '--lang',
      'zh-CN',
      '--executable',
      'LeagueAkari.exe',
      'apply',
      '--archive',
      String.raw`C:\Users\Administrator\AppData\Roaming\league-akari\NewUpdates\league-akari-win-x64.7z`,
      '--target',
      'F:\\',
      '--delete-archive',
      '--launch'
    ])
  })

  test('passes uninstall paths containing spaces without command-shell quotes', () => {
    const args = createUninstallUpdaterArguments({
      locale: 'en',
      appIds: ['league-akari', 'league-akari-dev'],
      appPath: String.raw`C:\League Akari`,
      dataPath: String.raw`C:\Users\Akari User\AppData\Roaming\league-akari`
    })

    expect(args).toContain(String.raw`C:\League Akari`)
    expect(args).toContain(String.raw`C:\Users\Akari User\AppData\Roaming\league-akari`)
    expect(args.every((arg) => !arg.includes('"'))).toBe(true)
  })
})
