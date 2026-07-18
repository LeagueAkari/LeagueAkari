import { describe, expect, it } from 'vitest'

import { LogMessageFormatter } from './log-message-formatter'

const SYNTHETIC_LCU_TOKEN = 'synthetic-lcu-secret_DO_NOT_USE'
const SYNTHETIC_RIOT_TOKEN = 'synthetic-riot-secret_DO_NOT_USE'

describe('LogMessageFormatter credential redaction', () => {
  it('redacts credentials in strings and nested structured values', () => {
    const message = new LogMessageFormatter().objectsToString(
      `LeagueClientUx --remoting-auth-token=${SYNTHETIC_LCU_TOKEN}`,
      {
        nested: {
          riotClientAuthToken: SYNTHETIC_RIOT_TOKEN,
          authorization: `Basic ${SYNTHETIC_RIOT_TOKEN}`
        },
        port: 54321
      }
    )

    expect(message).not.toContain(SYNTHETIC_LCU_TOKEN)
    expect(message).not.toContain(SYNTHETIC_RIOT_TOKEN)
    expect(message).toContain('--remoting-auth-token=<redacted>')
    expect(message).toContain('"riotClientAuthToken": "<redacted>"')
    expect(message).toContain('"authorization": "<redacted>"')
    expect(message).toContain('"port": 54321')
  })
})
