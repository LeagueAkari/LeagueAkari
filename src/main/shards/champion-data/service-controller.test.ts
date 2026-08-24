import type {
  ChampionDataOverview,
  ChampionDataQuery,
  ChampionDataSourceId
} from '@shared/data-adapter/champion-data'
import { describe, expect, it, vi } from 'vitest'

import type { ChampionDataMainContext, ChampionDataSourceLoader } from './context'
import { ChampionDataServiceController } from './service-controller'
import { ChampionDataSettings, ChampionDataState } from './state'

function overview(source: ChampionDataSourceId): ChampionDataOverview {
  return {
    metadata: {
      source,
      mode: 'ranked',
      patch: '16.16',
      dataDate: null,
      updatedAt: null
    },
    sections: { champions: [] }
  }
}

function setup(preferredSource: ChampionDataSourceId = 'qq101') {
  const settings = new ChampionDataSettings()
  settings.setPreferredSource(preferredSource)
  const state = new ChampionDataState()
  state.setAvailability({
    preferredSource,
    sources: { opgg: { enabled: true }, qq101: { enabled: true } }
  })
  const loader: ChampionDataSourceLoader = {
    loadOverview: vi.fn(async (source) => overview(source)),
    loadDetails: vi.fn()
  }
  const context = {
    settings,
    state,
    logger: { warn: vi.fn() }
  } as unknown as ChampionDataMainContext
  return { controller: new ChampionDataServiceController(context, loader), loader, settings, state }
}

describe('ChampionDataServiceController', () => {
  it('falls back from a disabled preferred source without changing the preference', async () => {
    const { controller, loader, settings, state } = setup('qq101')
    state.setAvailability({
      preferredSource: 'qq101',
      sources: { opgg: { enabled: true }, qq101: { enabled: false } }
    })

    const result = await controller.loadOverview({ mode: 'ranked' })

    expect(result).toMatchObject({
      status: 'success',
      preferredSource: 'qq101',
      effectiveSource: 'opgg',
      fallbackReason: 'source-disabled',
      attempts: [
        { source: 'qq101', outcome: 'disabled' },
        { source: 'opgg', outcome: 'success' }
      ]
    })
    expect(settings.preferredSource).toBe('qq101')
    expect(loader.loadOverview).toHaveBeenCalledTimes(1)
  })

  it('falls back when the preferred source does not support the requested mode', async () => {
    const { controller, loader } = setup('qq101')
    const query: ChampionDataQuery = { mode: 'aram' }

    const result = await controller.loadOverview(query)

    expect(result).toMatchObject({
      status: 'success',
      effectiveSource: 'opgg',
      fallbackReason: 'mode-unsupported'
    })
    expect(loader.loadOverview).toHaveBeenCalledWith('opgg', query)
  })

  it('reports a visible fallback after a preferred-source request failure', async () => {
    const { controller, loader } = setup('qq101')
    vi.mocked(loader.loadOverview)
      .mockRejectedValueOnce(new Error('temporary QQ101 failure'))
      .mockResolvedValueOnce(overview('opgg'))

    const result = await controller.loadOverview({ mode: 'ranked' })

    expect(result).toMatchObject({
      status: 'success',
      effectiveSource: 'opgg',
      fallbackReason: 'request-failed'
    })
  })
})
