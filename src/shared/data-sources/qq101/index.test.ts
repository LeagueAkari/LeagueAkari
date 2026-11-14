import { Qq101HttpApiAxiosHelper } from '@shared/http-api-axios-helper/qq101'
import axios from 'axios'
import { describe, expect, it } from 'vitest'

import { Qq101DataSource } from '.'

describe('QQ101 source layers', () => {
  it('shares four request slots across independent consumers and sends pair filters verbatim', async () => {
    let active = 0
    let maximum = 0
    const requests: unknown[] = []
    const http = axios.create({
      adapter: async (config) => {
        requests.push(config.params)
        maximum = Math.max(maximum, ++active)
        await new Promise((resolve) => setTimeout(resolve, 2))
        active--

        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          data: {
            code: 0,
            data: {
              result: JSON.stringify({
                dtstatdate: '20261006',
                championid_data: '103;120|mage;tank|0.59|0.01|430'
              })
            }
          }
        }
      }
    })
    const source = new Qq101DataSource(new Qq101HttpApiAxiosHelper(http))
    const results = await Promise.all(
      Array.from({ length: 12 }, () =>
        source.getMayhemPairSynergies({ championId: 103, firstRole: 'mage', secondRole: 'tank' })
      )
    )
    expect(maximum).toBe(4)
    expect(requests[0]).toEqual({ championid: 103, role1: 'mage', role2: 'tank' })
    expect(results[0].synergies[0]).toMatchObject({ rank: 430, winRate: 0.59 })
  })

  it('keeps wire data in transport and exposes readable Akari objects to consumers', async () => {
    const raw = {
      code: 0,
      data: {
        result: JSON.stringify({
          dtstatdate: '20261006',
          datadetails: '25_96_T3_BOTTOM_52.16_0.57_0.08_29,51,895_NC_NC_0'
        })
      },
      futureMetadata: 'transport must preserve this'
    }
    const http = axios.create({
      adapter: async (config) => ({ data: raw, status: 200, statusText: 'OK', headers: {}, config })
    })
    const api = new Qq101HttpApiAxiosHelper(http)
    const query = { patch: '16.19', tier: 26, position: 'ALL' }
    const response = await api.getTierList(query)
    expect(response.data).toEqual(raw)

    const source = new Qq101DataSource(api)
    const mapped = await source.getTierList(query)
    expect(mapped.champions[0]).toMatchObject({ championId: 96, winRate: 0.5216, rankChange: null })
    expect(mapped.champions[0]).not.toHaveProperty('champion_id')
    expect(mapped).not.toHaveProperty('futureMetadata')
  })
})
