import { getPidsByName } from '@main/native'
import { SUBSCRIBED_LCU_ENDPOINTS } from '@shared/constants/subscribed-lcu-endpoints'
import { LeagueClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/league-client'
import { UxCommandLine } from '@shared/shards/league-client-ux'
import { RadixEventEmitter } from '@shared/utils/event-emitter'
import { sleep } from '@shared/utils/sleep'
import axios, { AxiosInstance, AxiosRequestConfig, isAxiosError } from 'axios'
import { AxiosRetry } from 'axios-retry'
import { compareShallow } from 'mobx'
import { ClientRequestArgs } from 'node:http'
import https from 'node:https'
import PQueue from 'p-queue'
import WebSocket from 'ws'

import { LeagueClientUxMain } from '../league-client-ux'
import {
  LEAGUE_CLIENT_CONNECT_RETRY_INTERVAL,
  LEAGUE_CLIENT_HTTP_PING_URL,
  LEAGUE_CLIENT_PROCESS_NAME,
  LEAGUE_CLIENT_REQUEST_TIMEOUT_MS,
  LeagueClientLcuUninitializedError,
  type LeagueClientMainContext
} from './context'

const axiosRetry = require('axios-retry').default as AxiosRetry

export class LeagueClientConnectionController {
  private _httpClient: AxiosInstance | null = null
  private _webSocket: WebSocket | null = null

  private _leagueClientApi: LeagueClientHttpApiAxiosHelper | null = null

  private _eventBus = new RadixEventEmitter()

  private _rendererSubIncrement = 1
  private readonly _rendererSubMap = new Map<string, () => void>()

  private _assetLimiter = new PQueue({ concurrency: 8 })

  // 处理仅关闭 UX 而 LeagueClient 未关闭的情况
  private _shouldHaveOneAttempt = false
  private _manuallyDisconnected = false
  constructor(private readonly _context: LeagueClientMainContext) {}

  start() {
    return this._watchConnection()
  }

  dispose() {
    this._manuallyDisconnected = true
    this._disconnect()
    this.events.clear()
  }

  get http() {
    if (!this._httpClient) {
      throw new LeagueClientLcuUninitializedError()
    }

    return this._httpClient
  }

  get api() {
    if (!this._leagueClientApi) {
      throw new LeagueClientLcuUninitializedError()
    }

    return this._leagueClientApi
  }

  get events() {
    return this._eventBus
  }

  /**
   * 有的时候可能只会关闭 UX，但命令行是通过 UX 获取的
   *
   * 我们先缓存一次已经连接的信息。如果软件启动时没找到 UX 但客户端存在，则尝试连接一次
   */
  private async _tryResumeConnection() {
    const lastConnectedClient =
      await this._context.settingService._getFromStorage('lastConnectedClient')

    if (lastConnectedClient !== null) {
      const p1 = await getPidsByName(LeagueClientUxMain.UX_PROCESS_NAME)
      const p2 = await getPidsByName(LEAGUE_CLIENT_PROCESS_NAME)

      if (p1.length === 0 && p2.length === 1) {
        const { certificate, ...rest } = lastConnectedClient
        this._context.logger.info('Trying to resume connection', rest)

        this._shouldHaveOneAttempt = true
        this._context.state.setConnectingClient(lastConnectedClient)
      } else {
        await this._context.settingService._removeFromStorage('lastConnectedClient').catch(() => {})
      }
    }
  }

  async requestForRenderer(config: AxiosRequestConfig) {
    if (this._context.state.connectionState !== 'connected') {
      throw new LeagueClientLcuUninitializedError()
    }

    // 通过 IPC 调用的网络请求，则是不完整的可序列化信息
    try {
      const { config: c, request, ...rest } = await this._httpClient!.request(config)
      return { ...rest, config: { data: c.data, url: c.url } }
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        const { config: c, request, ...rest } = error.response
        return { ...rest, config: { data: c.data, url: c.url } }
      }

      this._context.logger.warn('LeagueClient HTTP Client Error', error)
      throw error
    }
  }

  async connect(auth: UxCommandLine & { force?: boolean }) {
    if (this._context.state.connectionState === 'connected') {
      this._disconnect()
    }

    if (auth.force) {
      this._shouldHaveOneAttempt = true
    }

    await this._context.leagueClientUx.update()
    this._context.state.setConnectingClient(auth)
  }

  disconnect() {
    this._manuallyDisconnected = true
    this._disconnect()
  }

  subscribeLcuEndpoint(uri: string) {
    const newId = `__${this._rendererSubIncrement++}`
    const dispose = this._eventBus.on(uri, (data, params) => {
      this._context.ipc.sendEvent(this._context.namespace, 'extra-lcu-event', newId, data, params)
    })
    this._rendererSubMap.set(newId, dispose)

    this._context.logger.debug(`Renderer subscribed to LCU event ${uri}, ID: ${newId}`)

    return newId
  }

  unsubscribeLcuEndpoint(subId: string) {
    const dispose = this._rendererSubMap.get(subId)
    if (dispose) {
      dispose()
      this._rendererSubMap.delete(subId)

      this._context.logger.debug(`Renderer unsubscribed from LCU event, ID: ${subId}`)

      return true
    }

    return false
  }

  /**
   * 断开与 LeagueClient 的连接, 主要是 WebSocket
   */
  private _disconnect() {
    if (this._webSocket) {
      this._webSocket.close()
    }

    this._webSocket = null
    this._httpClient = null
    this._leagueClientApi = null

    this._context.state.setDisconnected()
  }

  private async _watchConnection() {
    this._context.mobxUtils.reaction(
      () => this._context.state.connectingClient,
      (auth) => {
        if (!auth) {
          return
        }

        this._doConnectingLoop()
      }
    )

    if (this._context.settings.autoConnect) {
      await this._tryResumeConnection()
    }

    // 当客户端唯一时，自动连接到该 LeagueClient
    this._context.mobxUtils.reaction(
      () =>
        [
          this._context.settings.autoConnect,
          this._context.leagueClientUx.state.launchedClients,
          this._context.state.connectionState
        ] as const,
      async ([s, c, conn], prev) => {
        if (conn === 'connected') {
          return
        }

        // 抖动一下可以清除该状态
        if (prev && prev[0] === false && s === true) {
          this._manuallyDisconnected = false
        }

        if (s) {
          if (c.length === 1) {
            if (!this._manuallyDisconnected) {
              this._context.state.setConnectingClient(c[0])
            }
          } else {
            this._context.state.setConnectingClient(null)
          }
        }
      },
      { fireImmediately: true }
    )

    // 仅作为日志记录
    this._context.mobxUtils.reaction(
      () => [this._context.state.auth, this._context.state.connectionState] as const,
      ([a, s]) => {
        if (a) {
          const { certificate, ...rest } = a
          this._context.logger.debug(`LCU state changed: ${s}`, rest)
        } else {
          this._context.logger.debug(`LCU state changed: ${s}`, a)
        }
      },
      { equals: compareShallow }
    )

    /**
     * 在连接上之后，查询的速度放缓
     */
    this._context.mobxUtils.reaction(
      () => this._context.state.connectionState,
      (state) => {
        if (state === 'connected') {
          this._context.leagueClientUx.setPollInterval(
            LeagueClientUxMain.CLIENT_CMD_LONG_POLL_INTERVAL
          )
        } else {
          this._context.leagueClientUx.setPollInterval(
            LeagueClientUxMain.CLIENT_CMD_DEFAULT_POLL_INTERVAL,
            true
          )
        }
      }
    )
  }

  private async _doConnectingLoop() {
    while (true) {
      // 连接途中，目标丢失，停止连接
      if (!this._context.state.connectingClient) {
        break
      }

      // 目标连接对象已不在当前启动列表中，停止连接
      if (
        !this._shouldHaveOneAttempt &&
        !this._context.leagueClientUx.state.launchedClients.find(
          (c) => c.pid === this._context.state.connectingClient?.pid
        )
      ) {
        this._context.state.setConnectingClient(null)
        break
      }

      try {
        await this._connectToLcu(this._context.state.connectingClient)
        this._context.state.setConnectingClient(null) // finished connecting!
        break
      } catch (error) {
        if ((error as any).code !== 'ECONNREFUSED') {
          this._context.ipc.sendEvent(
            this._context.namespace,
            'error-connecting',
            (error as any)?.message
          )
          this._context.logger.warn(`Error connecting to LC`, error)
          break
        }
      }

      if (this._shouldHaveOneAttempt) {
        this._shouldHaveOneAttempt = false
        this._context.state.setConnectingClient(null)
        break
      }

      await sleep(LEAGUE_CLIENT_CONNECT_RETRY_INTERVAL)
    }
  }

  private _wsPromisified(
    url: string,
    options: WebSocket.ClientOptions | ClientRequestArgs = {},
    timeout = 17500
  ): Promise<WebSocket> {
    return new Promise<WebSocket>((resolve, reject) => {
      const ws = new WebSocket(url, options)

      const timer = setTimeout(() => {
        ws.close()
        reject(new Error(`WebSocket connection timed out after ${timeout}ms`))
      }, timeout)

      ws.on('open', () => {
        clearTimeout(timer)
        resolve(ws)
      })

      ws.on('unexpected-response', (_req, res) => {
        clearTimeout(timer)
        reject(new Error(`WebSocket unexpected response: ${res.statusCode} ${res.statusMessage}`))
      })

      ws.on('close', () => clearTimeout(timer))

      ws.on('error', (err) => {
        clearTimeout(timer)
        reject(err)
      })
    })
  }

  private _cleanup() {
    if (this._webSocket && this._webSocket.readyState !== WebSocket.CLOSED) {
      this._webSocket.close()
      this._webSocket = null
    }
    this._httpClient = null
    this._leagueClientApi = null
  }

  /**
   * one-time attempt
   */
  private async _connectToLcu(cmd: UxCommandLine) {
    if (
      this._context.state.connectionState === 'connecting' ||
      this._context.state.connectionState === 'connected'
    ) {
      return
    }

    const { certificate, ...rest } = cmd

    this._context.logger.info('Target client', rest)

    this._context.state.setConnecting()

    const initWs = async () => {
      try {
        // in case of connection is not closed properly
        if (this._webSocket) {
          this._webSocket.close()
          this._webSocket = null
        }

        this._webSocket = await this._wsPromisified(
          `wss://riot:${cmd.authToken}@127.0.0.1:${cmd.port}`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`riot:${cmd.authToken}`).toString('base64')}`
            },
            rejectUnauthorized: false
          }
        )

        for (const endpoint of SUBSCRIBED_LCU_ENDPOINTS) {
          this._webSocket.send(JSON.stringify([5, endpoint]))
        }

        this._webSocket.on('message', (msg) => {
          try {
            const data = JSON.parse(msg.toString())
            this._eventBus.emit(data[2].uri, data[2])
          } catch {}
        })

        this._webSocket.on('close', () => {
          this._context.state.setDisconnected()
          this._cleanup()
        })
      } catch (error) {
        throw error
      }
    }

    try {
      await initWs()
      await this._initHttpInstance(cmd)
      this._context.state.setConnected(cmd)
      this._context.settingService._saveToStorage('lastConnectedClient', cmd).catch(() => {})
    } catch (error) {
      this._context.state.setDisconnected()
      this._cleanup()
      throw error
    }
  }

  private async _initHttpInstance(auth: UxCommandLine) {
    this._httpClient = axios.create({
      baseURL: `https://127.0.0.1:${auth.port}`,
      headers: {
        Authorization: `Basic ${Buffer.from(`riot:${auth.authToken}`).toString('base64')}`
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      }),
      httpAgent: new https.Agent(),
      timeout: LEAGUE_CLIENT_REQUEST_TIMEOUT_MS,
      proxy: false
    })

    axiosRetry(this._httpClient, { retries: 2 })

    try {
      await this._httpClient.get(LEAGUE_CLIENT_HTTP_PING_URL)
      this._leagueClientApi = new LeagueClientHttpApiAxiosHelper(this._httpClient)
    } catch (error) {
      if (isAxiosError(error) && (!error.response || (error.status && error.status >= 500))) {
        this._context.logger.warn(`Failed to execute PING operation`, error)
        throw error
      }
    }
  }

  async request<T = any, D = any>(config: AxiosRequestConfig<D>) {
    if (!this._httpClient) {
      throw new LeagueClientLcuUninitializedError()
    }

    if (config.url && config.url.startsWith('lol-game-data/assets')) {
      return this._limitedRequest(config, this._assetLimiter)
    } else {
      return this.http.request<T>(config)
    }
  }

  private async _limitedRequest<T = any, D = any>(config: AxiosRequestConfig<D>, limiter: PQueue) {
    const res = await limiter.add(() => this.http.request<T>(config))

    if (!res) {
      throw new Error('asset request failed')
    }

    return res
  }
}
