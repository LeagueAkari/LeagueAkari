import { is } from '@electron-toolkit/utils'
import type { LanWebApiErrorDto } from '@shared/shards/lan-web'
import { createReadStream, existsSync, statSync } from 'node:fs'
import http, { type IncomingMessage, type ServerResponse } from 'node:http'
import { networkInterfaces } from 'node:os'
import path from 'node:path'

import { LanWebApiError, LanWebReadOnlyApiController } from './api-controller'
import type { LanWebMainContext } from './context'
import { buildAccessUrls, listLanIpv4Addresses } from './network'

const MAX_URL_LENGTH = 4096
const EVENT_INTERVAL_MS = 1500

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

export class LanWebHttpServerController {
  private _server: http.Server | null = null
  private readonly _eventClients = new Set<ServerResponse>()
  private _eventTimer: NodeJS.Timeout | null = null
  private readonly _api: LanWebReadOnlyApiController

  constructor(private readonly _context: LanWebMainContext) {
    this._api = new LanWebReadOnlyApiController(_context)
  }

  async start(port: number) {
    if (this._server) {
      return
    }

    this._context.state.setStarting()
    try {
      const server = await this._listen(port)
      this._server = server
      const urls = buildAccessUrls(listLanIpv4Addresses(networkInterfaces()), port)
      this._context.state.setRunning(port, urls)
      this._context.logger.info(`LAN Web service is listening on 0.0.0.0:${port}`)
    } catch (error) {
      const message = this._toStartupErrorMessage(error, port)
      this._context.state.setError(message)
      this._context.logger.error(message, error)
      throw error
    }
  }

  async restart(port: number) {
    if (!this._server) {
      return this.start(port)
    }

    const oldServer = this._server
    const oldPort = this._context.state.listeningPort
    const oldUrls = this._context.state.accessUrls
    this._context.state.setStarting()
    try {
      const newServer = await this._listen(port)
      this._closeEventStreams()
      this._server = newServer
      const urls = buildAccessUrls(listLanIpv4Addresses(networkInterfaces()), port)
      this._context.state.setRunning(port, urls)
      await this._closeServer(oldServer)
      this._context.logger.info(`LAN Web service moved to 0.0.0.0:${port}`)
    } catch (error) {
      this._server = oldServer
      if (oldPort !== null) {
        this._context.state.setRunning(oldPort, oldUrls, this._toStartupErrorMessage(error, port))
      }
      this._context.logger.warn(`Failed to move LAN Web service to port ${port}`, error)
      throw error
    }
  }

  async stop() {
    const server = this._server
    this._server = null
    this._closeEventStreams()

    if (server) {
      await this._closeServer(server)
      this._context.logger.info('LAN Web service stopped')
    }
    this._context.state.setStopped()
  }

  private _listen(port: number) {
    return new Promise<http.Server>((resolve, reject) => {
      const server = http.createServer((request, response) => {
        void this._handleRequest(request, response)
      })
      const onError = (error: Error) => {
        server.off('listening', onListening)
        reject(error)
      }
      const onListening = () => {
        server.off('error', onError)
        server.on('error', (error) => this._context.logger.error('LAN Web server error', error))
        resolve(server)
      }
      server.once('error', onError)
      server.once('listening', onListening)
      server.listen(port, '0.0.0.0')
    })
  }

  private async _handleRequest(request: IncomingMessage, response: ServerResponse) {
    this._setCommonHeaders(response)
    if (!request.url || request.url.length > MAX_URL_LENGTH) {
      return this._sendError(response, 414, 'URI_TOO_LONG', 'Request URL is too long')
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.setHeader('Allow', 'GET, HEAD')
      return this._sendError(response, 405, 'METHOD_NOT_ALLOWED', 'This service is read-only')
    }

    const url = new URL(request.url, 'http://localhost')
    try {
      if (url.pathname.startsWith('/api/')) {
        return await this._handleApiRequest(request, response, url)
      }

      return await this._serveWebApp(request, response, url)
    } catch (error) {
      if (error instanceof LanWebApiError) {
        return this._sendError(response, error.statusCode, error.code, error.message)
      }
      this._context.logger.warn('LAN Web request failed', url.pathname, error)
      return this._sendError(response, 500, 'INTERNAL_ERROR', 'The request could not be completed')
    }
  }

  private async _handleApiRequest(request: IncomingMessage, response: ServerResponse, url: URL) {
    response.setHeader('Cache-Control', 'no-store')
    const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)

    if (url.pathname === '/api/v1/status') {
      return this._sendJson(response, 200, this._api.getStatus(), request.method === 'HEAD')
    }
    if (url.pathname === '/api/v1/ongoing-game') {
      return this._sendJson(response, 200, this._api.getOngoingGame(), request.method === 'HEAD')
    }
    if (url.pathname === '/api/v1/players/search') {
      const result = await this._api.searchPlayers(
        url.searchParams.get('query') || '',
        url.searchParams.get('serverId') || undefined
      )
      return this._sendJson(response, 200, result, request.method === 'HEAD')
    }
    if (segments.length === 5 && segments[2] === 'players') {
      const player = await this._api.getPlayer(segments[3], segments[4])
      return this._sendJson(response, 200, player, request.method === 'HEAD')
    }
    if (segments.length === 6 && segments[2] === 'players' && segments[5] === 'matches') {
      const history = await this._api.getMatchHistory(
        segments[3],
        segments[4],
        Number(url.searchParams.get('start') || 0),
        Number(url.searchParams.get('count') || 20)
      )
      return this._sendJson(response, 200, history, request.method === 'HEAD')
    }
    if (segments.length === 6 && segments[2] === 'matches') {
      const source = segments[4]
      if (source !== 'lcu' && source !== 'sgp') {
        throw new LanWebApiError(400, 'INVALID_DATA_SOURCE', 'Unknown match data source')
      }
      const match = await this._api.getMatch(
        segments[3],
        source,
        Number(segments[5]),
        url.searchParams.get('subject') || undefined
      )
      return this._sendJson(response, 200, match, request.method === 'HEAD')
    }
    if (segments.length === 5 && segments[2] === 'assets') {
      const kind = segments[3]
      if (kind !== 'champion' && kind !== 'profile-icon' && kind !== 'item') {
        throw new LanWebApiError(404, 'NOT_FOUND', 'Asset was not found')
      }
      const asset = await this._api.getGameAsset(kind, Number(segments[4]))
      response.statusCode = 200
      response.setHeader('Content-Type', asset.contentType)
      response.setHeader('Cache-Control', 'private, max-age=86400')
      response.setHeader('Content-Length', asset.data.length)
      if (request.method === 'HEAD') return response.end()
      return response.end(asset.data)
    }
    if (url.pathname === '/api/v1/events') {
      return this._openEventStream(request, response)
    }

    return this._sendError(response, 404, 'NOT_FOUND', 'API endpoint was not found')
  }

  private _openEventStream(request: IncomingMessage, response: ServerResponse) {
    if (request.method === 'HEAD') {
      response.end()
      return
    }
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    response.setHeader('Cache-Control', 'no-cache, no-transform')
    response.setHeader('Connection', 'keep-alive')
    response.flushHeaders()
    response.write('retry: 2500\n\n')
    this._eventClients.add(response)
    this._sendEvents(response)
    this._ensureEventTimer()
    request.on('close', () => {
      this._eventClients.delete(response)
      this._clearEventTimerWhenIdle()
    })
    return
  }

  private _ensureEventTimer() {
    if (this._eventTimer) return
    this._eventTimer = setInterval(() => {
      for (const client of this._eventClients) this._sendEvents(client)
    }, EVENT_INTERVAL_MS)
  }

  private _sendEvents(response: ServerResponse) {
    this._writeEvent(response, 'status', this._api.getStatus())
    this._writeEvent(response, 'ongoing-game', this._api.getOngoingGame())
  }

  private _writeEvent(response: ServerResponse, event: string, data: unknown) {
    response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  private async _serveWebApp(request: IncomingMessage, response: ServerResponse, url: URL) {
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      return this._proxyDevRenderer(request, response, url)
    }

    const rendererRoot = path.resolve(__dirname, '../renderer')
    const requestedPath = url.pathname === '/' ? 'lan-web.html' : url.pathname.slice(1)
    let filePath = path.resolve(rendererRoot, requestedPath)
    if (
      !filePath.startsWith(`${rendererRoot}${path.sep}`) ||
      !existsSync(filePath) ||
      statSync(filePath).isDirectory()
    ) {
      filePath = path.join(rendererRoot, 'lan-web.html')
    }
    if (!existsSync(filePath)) {
      return this._sendError(response, 503, 'WEB_APP_UNAVAILABLE', 'LAN Web assets are unavailable')
    }

    const stat = statSync(filePath)
    response.statusCode = 200
    response.setHeader(
      'Content-Type',
      MIME_TYPES[path.extname(filePath)] || 'application/octet-stream'
    )
    response.setHeader('Content-Length', stat.size)
    response.setHeader(
      'Cache-Control',
      filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000, immutable'
    )
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'"
    )
    if (request.method === 'HEAD') return response.end()
    createReadStream(filePath).pipe(response)
  }

  private _proxyDevRenderer(request: IncomingMessage, response: ServerResponse, url: URL) {
    return new Promise<void>((resolve, reject) => {
      const target = new URL(process.env.ELECTRON_RENDERER_URL!)
      target.pathname = url.pathname === '/' ? '/lan-web.html' : url.pathname
      target.search = url.search
      const proxyRequest = http.request(target, { method: request.method }, (proxyResponse) => {
        response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers)
        proxyResponse.pipe(response)
        proxyResponse.on('end', resolve)
      })
      proxyRequest.on('error', reject)
      proxyRequest.end()
    })
  }

  private _setCommonHeaders(response: ServerResponse) {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Referrer-Policy', 'no-referrer')
    response.setHeader('X-Frame-Options', 'DENY')
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  }

  private _sendJson(response: ServerResponse, statusCode: number, data: unknown, head = false) {
    const body = JSON.stringify(data)
    response.statusCode = statusCode
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Content-Length', Buffer.byteLength(body))
    if (head) {
      response.end()
      return
    }
    response.end(body)
    return
  }

  private _sendError(response: ServerResponse, statusCode: number, code: string, message: string) {
    const body: LanWebApiErrorDto = { error: { code, message } }
    this._sendJson(response, statusCode, body)
  }

  private _closeEventStreams() {
    if (this._eventTimer) clearInterval(this._eventTimer)
    this._eventTimer = null
    for (const client of this._eventClients) client.end()
    this._eventClients.clear()
  }

  private _clearEventTimerWhenIdle() {
    if (this._eventClients.size || !this._eventTimer) return
    clearInterval(this._eventTimer)
    this._eventTimer = null
  }

  private _closeServer(server: http.Server) {
    return new Promise<void>((resolve) => {
      server.close(() => resolve())
      server.closeIdleConnections()
    })
  }

  private _toStartupErrorMessage(error: unknown, port: number) {
    if (error instanceof Error && 'code' in error && error.code === 'EADDRINUSE') {
      return `Port ${port} is already in use`
    }
    if (error instanceof Error && 'code' in error && error.code === 'EACCES') {
      return `Permission was denied while listening on port ${port}`
    }
    return error instanceof Error
      ? error.message
      : `Failed to start LAN Web service on port ${port}`
  }
}
