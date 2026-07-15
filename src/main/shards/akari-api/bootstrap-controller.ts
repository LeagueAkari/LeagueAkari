import {
  type AkariApiBootstrapDocument,
  parseAkariApiBootstrapDocument
} from '@shared/shards/akari-api'
import type { AxiosInstance } from 'axios'

import {
  AKARI_API_BOOTSTRAP_CACHE_PATH,
  AKARI_API_BOOTSTRAP_NPM_LATEST_URL,
  type AkariApiMainContext
} from './context'

interface NpmLatestMetadata {
  akariBootstrap: unknown
}

type ApplyBootstrap = (value: unknown) => AkariApiBootstrapDocument

export class AkariApiBootstrapController {
  private _generation: number | null = null

  constructor(
    private readonly _context: AkariApiMainContext,
    private readonly _npmHttp: AxiosInstance,
    private readonly _applyBootstrap: ApplyBootstrap
  ) {}

  async initFromLocal() {
    const { settingService } = this._context
    if (!(await settingService.jsonConfigFileExists(AKARI_API_BOOTSTRAP_CACHE_PATH))) {
      return
    }

    const cached = await settingService.readFromJsonConfigFile(AKARI_API_BOOTSTRAP_CACHE_PATH)
    const bootstrap = this._applyBootstrap(cached)
    this._generation = bootstrap.generation
    this._context.logger.info(`Loaded Akari API bootstrap generation ${bootstrap.generation}`)
  }

  async updateFromNpm() {
    try {
      const bootstrap = await this._fetchLatestBootstrap()
      if (this._generation !== null && bootstrap.generation <= this._generation) {
        this._context.logger.info(
          `Akari API bootstrap generation ${this._generation} is up to date`
        )
        return
      }

      this._applyBootstrap(bootstrap)
      this._generation = bootstrap.generation
      await this._context.settingService.writeToJsonConfigFile(
        AKARI_API_BOOTSTRAP_CACHE_PATH,
        bootstrap
      )
      this._context.logger.info(`Updated Akari API bootstrap to generation ${bootstrap.generation}`)
    } catch (error) {
      this._context.logger.warn('Failed to update Akari API bootstrap from npm', error)
    }
  }

  private async _fetchLatestBootstrap() {
    const metadataResponse = await this._npmHttp.get<NpmLatestMetadata>(
      AKARI_API_BOOTSTRAP_NPM_LATEST_URL
    )
    return parseAkariApiBootstrapDocument(metadataResponse.data.akariBootstrap)
  }
}
