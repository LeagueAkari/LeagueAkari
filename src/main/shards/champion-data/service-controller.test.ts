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
    loadPatches: vi.fn(async () => ['16.16']),
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
  it('loads only the explicitly selected source when it is supported', async () => {
    const { controller, loader } = setup('qq101')
    const query: ChampionDataQuery = { source: 'opgg', mode: 'ranked' }

    const result = await controller.loadOverview(query)

    expect(result).toMatchObject({
      status: 'success',
      preferredSource: 'opgg',
      effectiveSource: 'opgg',
      fallbackReason: null,
      attempts: [{ source: 'opgg', outcome: 'success' }]
    })
    expect(loader.loadOverview).toHaveBeenCalledTimes(1)
    expect(loader.loadOverview).toHaveBeenCalledWith('opgg', query, {})
  })

  it('does not replace a disabled preferred source with a different data source', async () => {
    const { controller, loader, settings, state } = setup('qq101')
    state.setAvailability({
      preferredSource: 'qq101',
      sources: { opgg: { enabled: true }, qq101: { enabled: false } }
    })

    const result = await controller.loadOverview({ mode: 'ranked' })

    expect(result).toMatchObject({
      status: 'unavailable',
      preferredSource: 'qq101',
      effectiveSource: null,
      fallbackReason: 'source-disabled',
      attempts: [{ source: 'qq101', outcome: 'disabled' }]
    })
    expect(settings.preferredSource).toBe('qq101')
    expect(loader.loadOverview).not.toHaveBeenCalled()
  })

  it('does not replace an unsupported source-mode pair with another source', async () => {
    const { controller, loader } = setup('qq101')
    const query: ChampionDataQuery = { mode: 'aram' }

    const result = await controller.loadOverview(query)

    expect(result).toMatchObject({
      status: 'unavailable',
      preferredSource: 'qq101',
      effectiveSource: null,
      fallbackReason: 'mode-unsupported',
      attempts: [{ source: 'qq101', outcome: 'mode-unsupported' }]
    })
    expect(loader.loadOverview).not.toHaveBeenCalled()
  })

  it('does not replace failed preferred-source data with a different source', async () => {
    const { controller, loader } = setup('qq101')
    vi.mocked(loader.loadOverview).mockRejectedValueOnce(new Error('temporary QQ101 failure'))

    const result = await controller.loadOverview({ mode: 'ranked' })

    expect(result).toMatchObject({
      status: 'unavailable',
      preferredSource: 'qq101',
      effectiveSource: null,
      fallbackReason: 'request-failed',
      attempts: [{ source: 'qq101', outcome: 'failed' }]
    })
    expect(loader.loadOverview).toHaveBeenCalledTimes(1)
    expect(loader.loadOverview).toHaveBeenCalledWith('qq101', { mode: 'ranked' }, {})
  })
})
