import { observable } from 'mobx'
import { describe, expect, it } from 'vitest'

import type { AkariApiMain } from '../akari-api'
import type { LeagueClientMain } from '../league-client'
import { SgpState } from './state'

function createState() {
  const leagueClient = observable({
    state: {
      auth: null
    },
    data: {
      gameData: {
        queues: {
          420: { id: 420 },
          1700: { id: 1700 }
        }
      },
      gameflow: {
        session: null
      },
      lobby: {
        lobby: null
      }
    }
  }) as unknown as LeagueClientMain
  const akariApi = {
    state: {
      supportedQueues: {
        queues: [420]
      }
    }
  } as AkariApiMain

  return {
    leagueClient,
    state: new SgpState(leagueClient, akariApi)
  }
}

describe('SgpState supported queues', () => {
  it('temporarily prepends the current lobby queue when it exists in local game data', () => {
    const { leagueClient, state } = createState()

    leagueClient.data.lobby.lobby = {
      gameConfig: { queueId: 1700 }
    } as LeagueClientMain['data']['lobby']['lobby']

    expect(state.supportedQueues).toEqual([1700, 420])

    leagueClient.data.lobby.lobby = {
      gameConfig: { queueId: 420 }
    } as LeagueClientMain['data']['lobby']['lobby']

    expect(state.supportedQueues).toEqual([420])
  })

  it('uses the gameflow queue and rejects queues missing from local game data', () => {
    const { leagueClient, state } = createState()

    leagueClient.data.gameflow.session = {
      gameData: { queue: { id: 1700 } }
    } as LeagueClientMain['data']['gameflow']['session']

    expect(state.supportedQueues).toEqual([1700, 420])

    leagueClient.data.gameflow.session = {
      gameData: { queue: { id: 9999 } }
    } as LeagueClientMain['data']['gameflow']['session']

    expect(state.supportedQueues).toEqual([420])
  })
})
