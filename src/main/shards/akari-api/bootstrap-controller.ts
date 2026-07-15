import { AkariApiHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/api'
import { AkariStaticHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/static'
import {
  type AkariApiBootstrapDocument,
  DEFAULT_AKARI_SERVICE_BASE_URLS,
  parseAkariApiBootstrapDocument
} from '@shared/shards/akari-api'
import axios, { type AxiosInstance } from 'axios'
import { app } from 'electron'

import type { AkariLogger } from '../logger-factory'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'

export const AKARI_API_BOOTSTRAP_CACHE_PATH = 'bootstrap.json'
export const AKARI_API_BOOTSTRAP_NPM_LATEST_URL =
  'https://registry.npmjs.org/@leagueakari%2fbootstrap/latest'

const AKARI_API_REQUEST_TIMEOUT = 10_000

interface NpmLatestMetadata {
  akariBootstrap: unknown
}

export class AkariApiBootstrapController {
  private _generation: number | null = null
  private readonly _npmHttp: AxiosInstance

  public readonly apiHttp = axios.create({
    baseURL: DEFAULT_AKARI_SERVICE_BASE_URLS.api,
    timeout: AKARI_API_REQUEST_TIMEOUT,
    headers: {
      Accept: 'application/json',
      'User-Agent': `LeagueAkari/${app.getVersion()}`,
      'x-akari-version': app.getVersion()
    }
  })
  public readonly staticHttp = axios.create({
    baseURL: DEFAULT_AKARI_SERVICE_BASE_URLS.static,
    timeout: AKARI_API_REQUEST_TIMEOUT,
    headers: {
      'User-Agent': `LeagueAkari/${app.getVersion()}`,
      'x-akari-version': app.getVersion()
    }
  })
  public readonly api = new AkariApiHttpApiAxiosHelper(this.apiHttp)
  public readonly staticAssets = new AkariStaticHttpApiAxiosHelper(this.staticHttp)

  constructor(
    private readonly _settingService: SetterSettingService,
    private readonly _logger: AkariLogger,
    npmHttp?: AxiosInstance
  ) {
    this._npmHttp =
      npmHttp ??
      axios.create({
        timeout: AKARI_API_REQUEST_TIMEOUT,
        headers: {
          'User-Agent': `LeagueAkari/${app.getVersion()}`
        }
      })
  }

  async init() {
    try {
      await this._loadFromLocal()
    } catch (error) {
      this._logger.warn('Failed to load bootstrap from local cache', error)
    }

    void this._updateFromNpm()
  }

  private async _loadFromLocal() {
    if (!(await this._settingService.jsonConfigFileExists(AKARI_API_BOOTSTRAP_CACHE_PATH))) {
      return
    }

    const cached = await this._settingService.readFromJsonConfigFile(AKARI_API_BOOTSTRAP_CACHE_PATH)
    const bootstrap = parseAkariApiBootstrapDocument(cached)

    this._applyBootstrap(bootstrap)
    this._logger.info(`Loaded bootstrap generation ${bootstrap.generation}`)
  }

  private async _updateFromNpm() {
    try {
      const bootstrap = await this._fetchLatestBootstrap()
      if (this._generation !== null && bootstrap.generation <= this._generation) {
        this._logger.info(`Bootstrap generation ${this._generation} is up to date`)
        return
      }

      this._applyBootstrap(bootstrap)
      await this._settingService.writeToJsonConfigFile(AKARI_API_BOOTSTRAP_CACHE_PATH, bootstrap)
      this._logger.info(`Updated bootstrap to generation ${bootstrap.generation}`)
    } catch (error) {
      this._logger.warn('Failed to update bootstrap from npm', error)
    }
  }

  private async _fetchLatestBootstrap() {
    const metadataResponse = await this._npmHttp.get<NpmLatestMetadata>(
      AKARI_API_BOOTSTRAP_NPM_LATEST_URL
    )
    return parseAkariApiBootstrapDocument(metadataResponse.data.akariBootstrap)
  }

  private _applyBootstrap(bootstrap: AkariApiBootstrapDocument) {
    this.apiHttp.defaults.baseURL = bootstrap.baseUrls.api
    this.staticHttp.defaults.baseURL = bootstrap.baseUrls.static
    this._generation = bootstrap.generation
  }
}
