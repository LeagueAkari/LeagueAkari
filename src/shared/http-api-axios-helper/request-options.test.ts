import axios, { type AxiosAdapter, type GenericAbortSignal } from 'axios'
import { describe, expect, test } from 'vitest'

import { GameflowHttpApi } from './league-client/gameflow'
import { SummonerHttpApi } from './league-client/summoner'

describe('HTTP API request options', () => {
  test('passes request options to GET requests', async () => {
    let capturedSignal: GenericAbortSignal | undefined
    const adapter: AxiosAdapter = async (config) => {
      capturedSignal = config.signal

      return {
        config,
        data: null,
        headers: {},
        status: 200,
        statusText: 'OK'
      }
    }
    const api = new GameflowHttpApi(axios.create({ adapter }))
    const controller = new AbortController()

    await api.getSession({ signal: controller.signal })

    expect(capturedSignal).toBe(controller.signal)
  })

  test('passes request options to POST requests with bodies', async () => {
    let capturedSignal: GenericAbortSignal | undefined
    let capturedData: unknown
    const adapter: AxiosAdapter = async (config) => {
      capturedSignal = config.signal
      capturedData = JSON.parse(config.data as string)

      return {
        config,
        data: null,
        headers: {},
        status: 200,
        statusText: 'OK'
      }
    }
    const api = new GameflowHttpApi(axios.create({ adapter }))
    const controller = new AbortController()

    await api.dodge({ signal: controller.signal })

    expect(capturedSignal).toBe(controller.signal)
    expect(capturedData).toEqual({
      dodgeIds: [1145141919810],
      phase: 'ChampSelect'
    })
  })

  test('forwards request options through business helper methods', async () => {
    let capturedSignal: GenericAbortSignal | undefined
    let capturedData: unknown
    const adapter: AxiosAdapter = async (config) => {
      capturedSignal = config.signal
      capturedData = JSON.parse(config.data as string)

      return {
        config,
        data: null,
        headers: {},
        status: 200,
        statusText: 'OK'
      }
    }
    const api = new SummonerHttpApi(axios.create({ adapter }))
    const controller = new AbortController()

    await api.setSummonerBackgroundSkin(1, { signal: controller.signal })

    expect(capturedSignal).toBe(controller.signal)
    expect(capturedData).toEqual({
      key: 'backgroundSkinId',
      value: 1
    })
  })
})
