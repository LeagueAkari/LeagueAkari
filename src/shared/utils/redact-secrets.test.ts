import { describe, expect, it } from 'vitest'

import {
  REDACTED_SECRET,
  createSecretRedactingJsonReplacer,
  redactSecretsInString
} from './redact-secrets'

const LCU_TOKEN = 'synthetic-lcu-token_DO_NOT_USE'
const RIOT_TOKEN = 'synthetic-riot-token_DO_NOT_USE'

describe('secret redaction', () => {
  it('redacts Riot and LCU command-line credentials', () => {
    const commandLine = [
      '/Applications/League of Legends.app/Contents/MacOS/LeagueClientUx',
      `--remoting-auth-token=${LCU_TOKEN}`,
      `--riotclient-auth-token="${RIOT_TOKEN}"`
    ].join(' ')

    const redacted = redactSecretsInString(commandLine)

    expect(redacted).not.toContain(LCU_TOKEN)
    expect(redacted).not.toContain(RIOT_TOKEN)
    expect(redacted).toContain(`--remoting-auth-token=${REDACTED_SECRET}`)
    expect(redacted).toContain(`--riotclient-auth-token=${REDACTED_SECRET}`)
  })

  it('redacts authorization headers and loopback websocket credentials', () => {
    const value = `Authorization: Basic ${RIOT_TOKEN} wss://riot:${LCU_TOKEN}@127.0.0.1:12345 https://riot:${RIOT_TOKEN}@localhost:54321`
    const redacted = redactSecretsInString(value)

    expect(redacted).not.toContain(LCU_TOKEN)
    expect(redacted).not.toContain(RIOT_TOKEN)
    expect(redacted).toContain(`Basic ${REDACTED_SECRET}`)
    expect(redacted).toContain(`wss://riot:${REDACTED_SECRET}@127.0.0.1:12345`)
    expect(redacted).toContain(`https://riot:${REDACTED_SECRET}@localhost:54321`)
  })

  it('redacts sensitive object fields during serialization', () => {
    const serialized = JSON.stringify(
      {
        authToken: LCU_TOKEN,
        nested: { riotClientAuthToken: RIOT_TOKEN },
        port: 12345
      },
      createSecretRedactingJsonReplacer()
    )

    expect(serialized).not.toContain(LCU_TOKEN)
    expect(serialized).not.toContain(RIOT_TOKEN)
    expect(serialized).toContain(`"authToken":"${REDACTED_SECRET}"`)
    expect(serialized).toContain('"port":12345')
  })
})
