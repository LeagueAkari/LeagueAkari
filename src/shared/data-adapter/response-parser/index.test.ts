import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { ResponseParser } from '.'

describe('response parser', () => {
  it('reuses a schema without carrying issues or mutable defaults into the next result', () => {
    const parser = new ResponseParser()
    const schema = parser.recover(z.object({ count: z.number() }), { count: 0 }, 'stats')
    const first = parser.parse(() => schema.parse({ count: 'broken' }))
    expect(first.data).toEqual({ count: 0 })
    expect(first.issues).toMatchObject([{ path: 'stats.count', message: expect.any(String) }])
    first.data.count = 100

    expect(parser.parse(() => schema.parse({ count: 5 }))).toEqual({
      data: { count: 5 },
      issues: []
    })
    const second = parser.parse(() => schema.parse(null))
    expect(second.data).toEqual({ count: 0 })
    expect(second.issues).toMatchObject([{ path: 'stats' }])
    expect(first.issues).toHaveLength(1)
  })

  it('keeps schema messages, nested paths and record indexes when recovering fields', () => {
    const parser = new ResponseParser()
    const count = parser.recover(z.number({ error: 'Expected a numeric match count' }), 0, 'count')
    const schema = parser.array(z.object({ id: z.number().positive(), count }), 'rows')
    const result = parser.parse(() =>
      schema.parse([
        { id: 1, count: 'bad' },
        { id: -1, count: 4 },
        { id: 2, count: 3 }
      ])
    )

    expect(result.data).toEqual([
      { id: 1, count: 0 },
      { id: 2, count: 3 }
    ])
    expect(result.issues).toMatchObject([
      { path: 'rows.0.count', message: 'Expected a numeric match count', received: 'bad' },
      { path: 'rows.1.id' }
    ])
  })

  it('restores the enclosing parse scope after a nested call or exception', () => {
    const parser = new ResponseParser()
    const schema = parser.recover(z.number(), 0, 'value')
    const result = parser.parse(() => {
      schema.parse('outer')
      const inner = parser.parse(() => schema.parse('inner'))
      expect(inner.issues).toMatchObject([{ received: 'inner' }])
      expect(() =>
        parser.parse(() => {
          throw new Error('unexpected')
        })
      ).toThrow('unexpected')
      return schema.parse(10)
    })

    expect(result).toMatchObject({ data: 10, issues: [{ received: 'outer' }] })
    expect(result.issues).toHaveLength(1)
    expect(parser.parse(() => schema.parse(20))).toEqual({ data: 20, issues: [] })
  })
})
