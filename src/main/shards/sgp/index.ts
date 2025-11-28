import RES_POSITIONER from '@resources/AKARI?asset&asarUnpack'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { SgpHttpApiAxiosHelper } from '@shared/http-api-axios-helper/sgp'
import {
  AKARI_HEADER_SGP_SERVER_ID,
  AKARI_HEADER_TOKEN_TYPE,
  URL_PLACEHOLDER_SUB_ID
} from '@shared/http-api-axios-helper/sgp/patterns'
import { formatError } from '@shared/utils/errors'
import axios, { AxiosRequestConfig } from 'axios'
import dayjs from 'dayjs'
import ofs from 'node:original-fs'
import path from 'node:path'

import { AkariProtocolMain } from '../akari-protocol'
import { AppCommonMain } from '../app-common'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { RemoteConfigMain } from '../remote-config'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { validateSchema } from './config-validation'
import { SgpState } from './state'

/**
 * Service Gateway Proxy
 * 处理任何跨区相关逻辑, 提供 API 调用或数据转换
 */
@Shard(SgpMain.id)
export class SgpMain implements IAkariShardInitDispose {
  static id = 'sgp-main'

  static LEAGUE_SGP_SERVERS_JSON = 'league-servers.json'
  static CONFIG_SCHEMA_VERSION = 1

  public readonly state: SgpState

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  private readonly _api: SgpHttpApiAxiosHelper

  private readonly _http = axios.create()

  get api() {
    return this._api
  }

  constructor(
    private readonly _app: AppCommonMain,
    _loggerFactory: LoggerFactoryMain,
    _settingFactory: SettingFactoryMain,
    private readonly _protocol: AkariProtocolMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _lc: LeagueClientMain,
    private readonly _remoteConfig: RemoteConfigMain
  ) {
    this._log = _loggerFactory.create(SgpMain.id)
    this._setting = _settingFactory.register(SgpMain.id, {}, {})

    this.state = new SgpState(this._lc.state)
    this._api = new SgpHttpApiAxiosHelper(this._http)
  }

  async onInit() {
    await this._loadSgpServerConfigFromLocalFile()

    this._mobx.propSync(SgpMain.id, 'state', this.state, [
      'availability',
      'isTokenReady',
      'sgpServerConfig',
      'supportedQueues'
    ])

    this._handleIpcCall()
    this._handleUpdateHttpProxy()
    this._maintainEntitlementsToken()
    this._maintainLeagueSessionToken()
    this._handleUpdateSgpServerConfig()
    this._initHttpInstance()
    this._handleProtocol()
  }

  /**
   * 从本地的配置区加载配置文件. 若不存在, 则从应用内置的配置文件中加载, 并复制到本地配置区
   */
  private async _loadSgpServerConfigFromLocalFile() {
    try {
      const exists = await this._setting.jsonConfigFileExists(SgpMain.LEAGUE_SGP_SERVERS_JSON)

      if (!exists) {
        this._log.info(
          'No saved configuration file found, will use built-in SGP server configuration file'
        )

        const localConfigPath = path.join(
          RES_POSITIONER,
          '..',
          'builtin-config',
          'sgp',
          'league-servers.json'
        )

        if (ofs.existsSync(localConfigPath)) {
          const data = await ofs.promises.readFile(localConfigPath, 'utf-8')
          await this._setting.writeToJsonConfigFile(
            SgpMain.LEAGUE_SGP_SERVERS_JSON,
            JSON.parse(data)
          )
        } else {
          this._log.warn('Built-in SGP server configuration file not found')
          return
        }
      }

      const json = await this._setting.readFromJsonConfigFile(SgpMain.LEAGUE_SGP_SERVERS_JSON)

      if (this._validateConfig(json)) {
        this.state.setSgpServerConfig(json)
        this._log.info(
          'Loaded local SGP server configuration file',
          dayjs(json.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
        )
      }
    } catch (error) {
      this._log.warn(
        `Error occurred while loading SGP server configuration file: ${formatError(error)}`
      )
    }
  }

  /**
   * 版本和格式校验
   */
  private _validateConfig(json: any) {
    const { valid, errors } = validateSchema(json)

    if (!valid) {
      this._log.warn(
        `SGP server configuration file format error: ${errors?.map((e) => formatError(e))}`
      )
      return false
    }

    // support only the exact version
    if (json.version !== SgpMain.CONFIG_SCHEMA_VERSION) {
      this._log.warn(
        `SGP server configuration file version mismatch, current version: ${SgpMain.CONFIG_SCHEMA_VERSION}, remote version: ${json.version}`
      )
      return false
    }

    return true
  }

  private _handleIpcCall() {}

  private _maintainEntitlementsToken() {
    this._mobx.reaction(
      () => this._lc.data.entitlements.token,
      (token) => {
        if (!token) {
          this.state.setEntitlementsTokenSet(false)
          return
        }

        const copiedToken = structuredClone(token)

        copiedToken.accessToken = copiedToken.accessToken?.slice(0, 24) + '...'
        copiedToken.token = copiedToken.token?.slice(0, 24) + '...'

        this._log.info(`Update Entitlements Token: ${JSON.stringify(copiedToken)}`)

        this.state.setEntitlementsTokenSet(true)
      },
      { fireImmediately: true }
    )
  }

  private _maintainLeagueSessionToken() {
    this._mobx.reaction(
      () => this._lc.data.leagueSession.token,
      (token) => {
        if (!token) {
          this.state.setLeagueSessionTokenSet(false)
          return
        }

        const copied = token.slice(0, 24) + '...'

        this._log.info(`Update Lol League Session Token: ${copied}`)

        this.state.setLeagueSessionTokenSet(true)
      },
      { fireImmediately: true }
    )
  }

  private _handleUpdateHttpProxy() {
    this._mobx.reaction(
      () => this._app.settings.httpProxy,
      (httpProxy) => {
        if (httpProxy.strategy === 'force') {
          this._http.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
        } else if (httpProxy.strategy === 'disable') {
          this._http.defaults.proxy = false
        }
      },
      { fireImmediately: true }
    )
  }

  private _handleUpdateSgpServerConfig() {
    this._mobx.reaction(
      () => this._remoteConfig.state.sgpServerConfig,
      async (config) => {
        if (this._validateConfig(config)) {
          if (config.lastUpdate > this.state.sgpServerConfig.lastUpdate) {
            this.state.setSgpServerConfig(config)
            await this._setting.writeToJsonConfigFile(SgpMain.LEAGUE_SGP_SERVERS_JSON, config)
            this._log.info(
              'Updated local SGP server configuration file',
              dayjs(config.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
            )
          } else {
            this._log.info(
              'Remote SGP server configuration file has no updates',
              dayjs(config.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
            )
          }
        }
      }
    )
  }

  private _initHttpInstance() {
    this._http.interceptors.request.use((config) => {
      const preferredSgpServerId =
        (config.headers.get(AKARI_HEADER_SGP_SERVER_ID) as string | null) ||
        this.state.availability.sgpServerId

      if (config.url) {
        config.url = config.url.replace(
          URL_PLACEHOLDER_SUB_ID,
          this._getSubId(preferredSgpServerId)
        )
      }

      const requiredTokenType = config.headers.get(AKARI_HEADER_TOKEN_TYPE) as string | null

      if (requiredTokenType) {
        const token = this._getToken(requiredTokenType)

        if (!token) {
          throw new Error(`Token not found for type: ${requiredTokenType}`)
        }

        config.headers.setAuthorization(`Bearer ${token}`)
      }

      const serverConfig = this.state.sgpServerConfig.servers[preferredSgpServerId]

      if (!serverConfig) {
        throw new Error(`Server config not found for sgp server ID: ${preferredSgpServerId}`)
      }

      const baseUrl =
        requiredTokenType === 'entitlements' ? serverConfig.matchHistory : serverConfig.common

      if (!baseUrl) {
        throw new Error(
          `Base URL not found for sgp server ID: ${preferredSgpServerId}, requiredTokenType: ${requiredTokenType}`
        )
      }

      config.baseURL = baseUrl
      config.headers.delete(AKARI_HEADER_SGP_SERVER_ID)
      config.headers.delete(AKARI_HEADER_TOKEN_TYPE)

      return config
    })
  }

  private _getSubId(sgpServerId: string) {
    if (sgpServerId.startsWith('TENCENT')) {
      const [_, rsoPlatformId] = sgpServerId.split('_')
      return rsoPlatformId
    }

    return sgpServerId
  }

  private _getToken(tokenType: string) {
    if (tokenType === 'entitlements') {
      return this._lc.data.entitlements.token?.accessToken ?? null
    } else if (tokenType === 'league-session') {
      return this._lc.data.leagueSession.token ?? null
    }
    return null
  }

  private _handleProtocol() {
    this._protocol.registerDomain('sgp', async (uri, req) => {
      const reqHeaders: Record<string, string> = {}

      req.headers.forEach((value, key) => {
        reqHeaders[key] = value
      })

      try {
        const config: AxiosRequestConfig = {
          method: req.method,
          url: uri,
          data: req.body ? AkariProtocolMain.convertWebStreamToNodeStream(req.body) : undefined,
          headers: reqHeaders,
          validateStatus: () => true,
          responseType: 'stream'
        }

        const res = await this._http.request(config)

        const resHeaders = Object.fromEntries(
          Object.entries(res.headers).filter(([_, value]) => typeof value === 'string')
        )

        return new Response(AkariProtocolMain.shouldNotHaveBody(res.status) ? null : res.data, {
          statusText: res.statusText,
          headers: resHeaders,
          status: res.status
        })
      } catch (error) {
        this._log.warn(`Failed to proxy SGP request`, error)

        return new Response(formatError(error), {
          headers: { 'Content-Type': 'text/plain' },
          status: 500
        })
      }
    })
  }

  async onDispose() {}
}
