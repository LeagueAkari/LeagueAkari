import { getCommandLine, getPidsByName, isElevated } from '@main/native'
import type { UxCommandLine } from '@shared/shards/league-client-ux'

import { LEAGUE_CLIENT_UX_PROCESS_NAME, type LeagueClientUxMainContext } from './context'
import { parseCommandLine } from './ux-command-line-parser'

function shouldUseWmiCommandLineReader(
  useWmi: boolean,
  platform: NodeJS.Platform = process.platform
) {
  return platform === 'win32' && useWmi
}

export class LeagueClientUxCommandLineReader {
  private _hasClientButNoCommandLineCount = 0

  constructor(private readonly context: LeagueClientUxMainContext) {}

  async read() {
    const { settings, state } = this.context

    if (shouldUseWmiCommandLineReader(settings.useWmi)) {
      if (!isElevated) {
        return []
      }

      const pids = await getPidsByName(LEAGUE_CLIENT_UX_PROCESS_NAME)

      const cmds = await Promise.all(
        pids.map((pid) => getCommandLine(pid, { win32QueryType: 'shell' }))
      )

      state.setHasClientButNoCommandLine(false)
      this._hasClientButNoCommandLineCount = 0

      return cmds.map((cmd) => parseCommandLine(cmd)).filter((cmd) => cmd !== null)
    } else {
      const pids = await getPidsByName(LEAGUE_CLIENT_UX_PROCESS_NAME)
      const auths: UxCommandLine[] = []

      for (const p of pids) {
        try {
          const cmd = await getCommandLine(p, { win32QueryType: 'native' })

          const parsed = parseCommandLine(cmd)
          if (parsed) {
            auths.push(parsed)
          }
        } catch {}
      }

      if (pids.length !== 0 && auths.length === 0) {
        this._hasClientButNoCommandLineCount++
      }

      if (this._hasClientButNoCommandLineCount >= 5) {
        state.setHasClientButNoCommandLine(true)
      }

      return auths
    }
  }
}
