import { describe, expect, it, vi } from 'vitest'

import { LanWebReadOnlyApiController } from './api-controller'
import type { LanWebMainContext } from './context'

function createContext() {
  const request = vi.fn().mockResolvedValue({ data: new Uint8Array([1, 2, 3]).buffer })
  const context = {
    leagueClient: {
      state: {
        isConnected: true,
        connectionState: 'connected'
      },
      data: {
        summoner: {
          me: {
            puuid: '00000000-0000-0000-0000-000000000001',
            gameName: 'Akari',
            displayName: 'Akari',
            tagLine: 'LAN',
            profileIconId: 29,
            summonerLevel: 100,
            privacy: 'PUBLIC'
          }
        },
        gameData: {
          items: {
            3084: {
              iconPath: '/lol-game-data/assets/ASSETS/Items/Icons2D/3084_Heartsteel.png'
            }
          }
        }
      },
      request
    },
    sgp: {
      state: {
        availability: {
          sgpServerId: 'HN1',
          serversSupported: { matchHistory: true }
        },
        isTokenReady: true
      }
    }
  } as unknown as LanWebMainContext

  return { context, request }
}

describe('LAN Web read-only API controller', () => {
  it('returns the current player in the public status DTO', () => {
    const { context } = createContext()
    const status = new LanWebReadOnlyApiController(context).getStatus()

    expect(status.currentPlayer).toEqual({
      puuid: '00000000-0000-0000-0000-000000000001',
      gameName: 'Akari',
      tagLine: 'LAN',
      profileIconId: 29,
      summonerLevel: 100,
      privacy: 'PUBLIC',
      sgpServerId: 'HN1'
    })
  })

  it('loads an item through the icon path from existing LCU game data', async () => {
    const { context, request } = createContext()
    const asset = await new LanWebReadOnlyApiController(context).getGameAsset('item', 3084)

    expect(request).toHaveBeenCalledWith({
      url: '/lol-game-data/assets/ASSETS/Items/Icons2D/3084_Heartsteel.png',
      responseType: 'arraybuffer'
    })
    expect(asset.contentType).toBe('image/png')
    expect(asset.data).toEqual(Buffer.from([1, 2, 3]))
  })
})
