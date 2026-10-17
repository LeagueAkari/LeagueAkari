import { qq101Akari } from '@shared/data-adapter/qq101/akari-adapter'
import { parseQq101Protocol } from '@shared/data-adapter/qq101/protocol-parser'
import { createQq101Schemas } from '@shared/data-adapter/qq101/schemas'
import { ResponseParser } from '@shared/data-adapter/response-parser'
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
              _fieldValues: {
                R15323: JSON.stringify({
                  dtstatdate: '20261006',
                  championid_data: '103;120|mage;tank|0.59|0.01|430'
                })
              }
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
  it('keeps transport raw, decodes the protocol, validates source units, then maps Akari fields', async () => {
    const raw = {
      code: 0,
      data: {
        _fieldValues: {
          R17960: JSON.stringify({
            dtstatdate: '20261006',
            datadetails: '25_96_T3_BOTTOM_52.16_0.57_0.08_29,51,895_NC_NC_0'
          })
        }
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

    const parser = new ResponseParser()
    const schemas = createQq101Schemas(parser)
    const { data: mapped, issues } = parser.parse(() => {
      const parsed = parseQq101Protocol('ranked', response.data, parser)
      expect(parsed).toMatchObject({
        rows: [{ champion_id: '96', win_rate: '52.16', rank_change: 'NC' }]
      })
      const validated = schemas.ranked.parse(parsed)
      expect(validated.rows[0]).toMatchObject({
        champion_id: 96,
        win_rate: 52.16,
        rank_change: null
      })
      return qq101Akari.ranked(validated, query.patch)
    })
    expect(mapped.champions[0]).toMatchObject({ championId: 96, winRate: 0.5216, rankChange: null })
    expect(mapped.champions[0]).not.toHaveProperty('champion_id')
    expect(mapped).not.toHaveProperty('futureMetadata')

    const source = new Qq101DataSource(api)
    expect(await source.getTierList(query)).toEqual(mapped)
    expect(issues).toHaveLength(2)
    expect(issues[0].received).toBe('NC')
  })
})
