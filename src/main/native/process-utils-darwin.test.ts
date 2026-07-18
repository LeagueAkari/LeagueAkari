import { describe, expect, test } from 'vitest'

import { findPidsByNamePosix, parsePosixProcessList } from './process-utils-darwin'

describe('Darwin process-list parsing', () => {
  test('parses executable paths containing spaces and ignores malformed rows', () => {
    const processes = parsePosixProcessList(`
      101 /Users/Shared/Riot Games/Riot Client.app/Contents/MacOS/RiotClientServices
      202 /Applications/League of Legends.app/Contents/LoL/League of Legends.app/Contents/MacOS/LeagueClientUx
      invalid row
      0 /usr/bin/invalid
    `)

    expect(processes).toEqual([
      {
        pid: 101,
        executablePath:
          '/Users/Shared/Riot Games/Riot Client.app/Contents/MacOS/RiotClientServices',
        name: 'RiotClientServices'
      },
      {
        pid: 202,
        executablePath:
          '/Applications/League of Legends.app/Contents/LoL/League of Legends.app/Contents/MacOS/LeagueClientUx',
        name: 'LeagueClientUx'
      }
    ])
  })

  test('matches case-insensitively and accepts Windows process aliases', () => {
    const processes = parsePosixProcessList(`
      101 /Applications/LeagueClientUx
      202 /Applications/LeagueClientUx
      303 /Applications/LeagueClient
    `)

    expect(findPidsByNamePosix(processes, 'leagueclientux.exe')).toEqual([101, 202])
    expect(findPidsByNamePosix(processes, 'LeagueClient.exe')).toEqual([303])
  })
})
