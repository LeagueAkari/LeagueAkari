import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { getSgpServerId } from '@shared/data-sources/sgp/utils'
import axios from 'axios'
import { app, safeStorage } from 'electron'
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { AkariIpcError, AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { RiotClientMain } from '../riot-client'
import { SgpMain } from '../sgp'
import { StorageMain } from '../storage'
import { QQAccount } from '../storage/entities/QQAccount'
import {
  BanQueryResult,
  BatchBanQueryResult,
  CreateQQAccountDto,
  QQAccountDto,
  UpdateQQAccountDto
} from './types'

// 中文大區 → SGP server id（移植自 lol-query/src-tauri/src/sgp.rs）
const AREA_TO_SGP: Record<string, string> = {
  艾欧尼亚: 'TENCENT_HN1',
  黑色玫瑰: 'TENCENT_HN10',
  峡谷之巅: 'TENCENT_BGP2',
  // NJ100
  祖安: 'TENCENT_NJ100',
  皮尔特沃夫: 'TENCENT_NJ100',
  巨神峰: 'TENCENT_NJ100',
  教育网专区: 'TENCENT_NJ100',
  男爵领域: 'TENCENT_NJ100',
  均衡教派: 'TENCENT_NJ100',
  影流: 'TENCENT_NJ100',
  守望之海: 'TENCENT_NJ100',
  // GZ100
  卡拉曼达: 'TENCENT_GZ100',
  暗影岛: 'TENCENT_GZ100',
  征服之海: 'TENCENT_GZ100',
  诺克萨斯: 'TENCENT_GZ100',
  战争学院: 'TENCENT_GZ100',
  雷瑟守备: 'TENCENT_GZ100',
  // CQ100
  班德尔城: 'TENCENT_CQ100',
  裁决之地: 'TENCENT_CQ100',
  水晶之痕: 'TENCENT_CQ100',
  钢铁烈阳: 'TENCENT_CQ100',
  皮城警备: 'TENCENT_CQ100',
  // TJ100
  比尔吉沃特: 'TENCENT_TJ100',
  弗雷尔卓德: 'TENCENT_TJ100',
  扭曲丛林: 'TENCENT_TJ100',
  // TJ101
  德玛西亚: 'TENCENT_TJ101',
  无畏先锋: 'TENCENT_TJ101',
  恕瑞玛: 'TENCENT_TJ101',
  巨龙之巢: 'TENCENT_TJ101'
}

// SGP server id → 中文合區名（艾欧尼亚/黑色玫瑰/峡谷之巅單獨；餘按聯盟一~五區）
const SGP_TO_AREA: Record<string, string> = {
  TENCENT_HN1: '艾欧尼亚',
  TENCENT_HN10: '黑色玫瑰',
  TENCENT_BGP2: '峡谷之巅',
  TENCENT_NJ100: '联盟一区',
  TENCENT_GZ100: '联盟二区',
  TENCENT_CQ100: '联盟三区',
  TENCENT_TJ100: '联盟四区',
  TENCENT_TJ101: '联盟五区'
}

const TIER_CN: Record<string, string> = {
  IRON: '黑铁',
  BRONZE: '青铜',
  SILVER: '白银',
  GOLD: '黄金',
  PLATINUM: '铂金',
  EMERALD: '翡翠',
  DIAMOND: '钻石',
  MASTER: '大师',
  GRANDMASTER: '宗师',
  CHALLENGER: '王者'
}

const QUEUE_LABEL: Record<string, string> = {
  RANKED_SOLO_5x5: '单',
  RANKED_FLEX_SR: '灵',
  RANKED_TFT: '云顶'
}

const ROMAN_TO_ARABIC: Record<string, string> = {
  I: '1',
  II: '2',
  III: '3',
  IV: '4',
  V: '5'
}

// 大師以上無 division
const NO_DIVISION_TIERS = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER'])

const AES_ALGORITHM = 'aes-256-gcm'
const AES_IV_BYTES = 16
const AES_KEY_BYTES = 32
const ENCRYPTED_PREFIX = 'v2:'

let _fallbackKey: Buffer | null = null

function _getOrCreateKeyFile(): string {
  return path.join(app.getPath('userData'), '.akari-key')
}

function _getFallbackKey(): Buffer {
  if (_fallbackKey) return _fallbackKey
  const keyFile = _getOrCreateKeyFile()
  if (fs.existsSync(keyFile)) {
    _fallbackKey = fs.readFileSync(keyFile)
    if (_fallbackKey.length === AES_KEY_BYTES) return _fallbackKey
  }
  _fallbackKey = randomBytes(AES_KEY_BYTES)
  fs.writeFileSync(keyFile, _fallbackKey, { mode: 0o600 })
  return _fallbackKey
}

function encryptPassword(plaintext: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    return ENCRYPTED_PREFIX + safeStorage.encryptString(plaintext).toString('base64')
  }
  const iv = randomBytes(AES_IV_BYTES)
  const cipher = createCipheriv(AES_ALGORITHM, _getFallbackKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [ENCRYPTED_PREFIX, iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':')
}

function decryptPassword(ciphertext: string): string {
  if (!ciphertext) return ''
  if (!ciphertext.startsWith(ENCRYPTED_PREFIX)) {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(ciphertext, 'base64'))
    }
    throw new Error('无法解密密码：加密服务不可用')
  }
  const payload = ciphertext.slice(ENCRYPTED_PREFIX.length)
  if (payload.includes(':')) {
    const parts = payload.split(':')
    if (parts.length === 3) {
      const iv = Buffer.from(parts[0], 'base64')
      const tag = Buffer.from(parts[1], 'base64')
      const encrypted = Buffer.from(parts[2], 'base64')
      const decipher = createDecipheriv(AES_ALGORITHM, _getFallbackKey(), iv)
      decipher.setAuthTag(tag)
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
    }
  }
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(Buffer.from(payload, 'base64'))
  }
  throw new Error('无法解密密码：加密服务不可用')
}

/**
 * QQ 賬號管理 + 封禁查詢
 *
 * 持久化 QQ 賬號（QQ/大區/gameId/備註）；
 * 調 3rd-party 封禁查詢 API（yun.4png.com）。
 */
@Shard(QQAccountMain.id)
export class QQAccountMain implements IAkariShardInitDispose {
  static id = 'qq-account-main'
  static dependencies = [
    AkariIpcMain.id,
    StorageMain.id,
    LoggerFactoryMain.id,
    SgpMain.id,
    RiotClientMain.id,
    LeagueClientMain.id
  ]

  static BAN_API_BASE = 'https://yun.4png.com/api/query.html'
  static BAN_API_TOKEN = '4b62ebccce1f5b4d'
  static BAN_API_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

  private static readonly QQ_REGEX = /^\d{5,13}$/
  private static readonly BAN_TIME_REGEX = /\d{4}-\d{1,2}-\d{1,2}\s\d{1,2}:\d{1,2}:\d{1,2}/
  private static readonly BAN_REMAIN_REGEX = /距离解封还有\s*(.+)/

  private readonly _log: AkariLogger

  constructor(
    private readonly _ipc: AkariIpcMain,
    private readonly _storage: StorageMain,
    private readonly _loggerFactory: LoggerFactoryMain,
    private readonly _sgp: SgpMain,
    private readonly _rc: RiotClientMain,
    private readonly _lc: LeagueClientMain
  ) {
    this._log = _loggerFactory.create(QQAccountMain.id)
  }

  async onInit() {
    this._handleIpcCall()
  }

  // ===== CRUD =====

  async listAccounts(): Promise<QQAccountDto[]> {
    const rows = await this._storage.dataSource.manager.find(QQAccount, {
      order: { sortOrder: 'asc', createdAt: 'asc' }
    })
    return rows.map((r) => this._toDto(r))
  }

  /**
   * 拖拽更新排序：按 orderedIds 之順序賦 sortOrder = 0, 1, 2 ...
   */
  async reorderAccounts(orderedIds: string[]): Promise<QQAccountDto[]> {
    if (!orderedIds || orderedIds.length === 0) {
      return this.listAccounts()
    }
    await this._storage.dataSource.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.update(QQAccount, { id: orderedIds[i] }, { sortOrder: i })
      }
    })
    return this.listAccounts()
  }

  async createAccount(dto: CreateQQAccountDto): Promise<QQAccountDto> {
    if (!QQAccountMain.QQ_REGEX.test(dto.qq)) {
      throw new AkariIpcError('Invalid QQ (5-13 digits)', 'InvalidQQ')
    }
    if (!dto.area) {
      throw new AkariIpcError('Area required', 'InvalidArea')
    }

    const exists = await this._storage.dataSource.manager.findOne(QQAccount, {
      where: { qq: dto.qq }
    })
    if (exists) {
      throw new AkariIpcError(`QQ ${dto.qq} already exists`, 'QQAlreadyExists')
    }

    const maxRow = await this._storage.dataSource
      .getRepository(QQAccount)
      .createQueryBuilder('q')
      .select('MAX(q.sortOrder)', 'maxOrder')
      .getRawOne<{ maxOrder: number | null }>()
    const nextOrder = ((maxRow?.maxOrder as number | null) ?? -1) + 1

    const entity = new QQAccount()
    entity.id = randomUUID()
    entity.qq = dto.qq
    entity.area = dto.area
    entity.gameId = dto.gameId?.trim() || null
    entity.tag = dto.tag?.trim() || null
    entity.password = dto.password ? encryptPassword(dto.password) : null
    entity.banStatus = '未查询'
    entity.banUntil = null
    entity.banRemaining = null
    entity.lastCheckedAt = null
    entity.createdAt = new Date()
    entity.sortOrder = nextOrder

    const saved = await this._storage.dataSource.manager.save(entity)
    return this._toDto(saved)
  }

  async updateAccount(dto: UpdateQQAccountDto): Promise<QQAccountDto> {
    const entity = await this._storage.dataSource.manager.findOne(QQAccount, {
      where: { id: dto.id }
    })
    if (!entity) {
      throw new AkariIpcError(`Account ${dto.id} not found`, 'AccountNotFound')
    }

    if (dto.qq !== undefined) {
      if (!QQAccountMain.QQ_REGEX.test(dto.qq)) {
        throw new AkariIpcError('Invalid QQ (5-13 digits)', 'InvalidQQ')
      }
      entity.qq = dto.qq
    }
    if (dto.area !== undefined) entity.area = dto.area
    if (dto.gameId !== undefined) entity.gameId = dto.gameId?.trim() || null
    if (dto.tag !== undefined) entity.tag = dto.tag?.trim() || null
    if (dto.password) {
      entity.password = encryptPassword(dto.password)
    }

    const saved = await this._storage.dataSource.manager.save(entity)
    return this._toDto(saved)
  }

  async getDecryptedPassword(id: string): Promise<string | null> {
    const entity = await this._storage.dataSource.manager.findOne(QQAccount, { where: { id } })
    if (!entity || !entity.password) return null
    return decryptPassword(entity.password)
  }

  async deleteAccount(id: string): Promise<void> {
    await this._storage.dataSource.manager.delete(QQAccount, { id })
  }

  async queryAccountBan(id: string): Promise<QQAccountDto> {
    const entity = await this._storage.dataSource.manager.findOne(QQAccount, {
      where: { id }
    })
    if (!entity) {
      throw new AkariIpcError(`Account ${id} not found`, 'AccountNotFound')
    }

    try {
      const result = await this._queryBan(entity.qq)
      entity.banStatus = result.isBanned ? '已封禁' : '正常'
      entity.banUntil = result.banUntil || null
      entity.banRemaining = result.banRemaining || null
    } catch (e) {
      this._log.warn(`Ban query failed for ${entity.qq}: ${(e as Error).message}`)
      entity.banStatus = '查询失败'
      entity.banUntil = null
      entity.banRemaining = null
    }

    entity.lastCheckedAt = new Date()
    const saved = await this._storage.dataSource.manager.save(entity)
    return this._toDto(saved)
  }

  // ===== 封禁查詢 =====

  async querySingleBan(qq: string): Promise<BanQueryResult> {
    if (!QQAccountMain.QQ_REGEX.test(qq)) {
      throw new AkariIpcError('Invalid QQ (5-13 digits)', 'InvalidQQ')
    }
    return this._queryBan(qq)
  }

  async queryBatchBan(qqs: string[]): Promise<BatchBanQueryResult[]> {
    const unique = Array.from(new Set(qqs.map((q) => q.trim()).filter(Boolean)))
    const results: BatchBanQueryResult[] = []

    for (const qq of unique) {
      if (!QQAccountMain.QQ_REGEX.test(qq)) {
        results.push({
          qq,
          isBanned: false,
          status: '格式错误',
          color: 'gray',
          banUntil: '',
          banRemaining: ''
        })
        continue
      }

      try {
        const r = await this._queryBan(qq)
        if (r.isBanned) {
          results.push({
            qq,
            isBanned: true,
            status: `${r.banUntil}  |  ${r.banRemaining}`,
            color: 'red',
            banUntil: r.banUntil,
            banRemaining: r.banRemaining
          })
        } else {
          results.push({
            qq,
            isBanned: false,
            status: '正常',
            color: 'green',
            banUntil: '',
            banRemaining: ''
          })
        }
      } catch (e) {
        this._log.warn(`Batch ban query failed for ${qq}: ${(e as Error).message}`)
        results.push({
          qq,
          isBanned: false,
          status: '查询失败',
          color: 'red',
          banUntil: '',
          banRemaining: ''
        })
      }
    }

    return results
  }

  private async _queryBan(qq: string): Promise<BanQueryResult> {
    const url = QQAccountMain.BAN_API_BASE
    const resp = await axios.get(url, {
      params: { token: QQAccountMain.BAN_API_TOKEN, qq },
      headers: { 'User-Agent': QQAccountMain.BAN_API_UA },
      timeout: 15000,
      responseType: 'json'
    })

    const json: any = resp.data
    const data = json?.data

    if (!data) {
      return {
        qq,
        isBanned: false,
        banUntil: '',
        banRemaining: '',
        message: json?.msg || '无结果'
      }
    }

    const banmsg: string = data.banmsg || ''
    const rammsg: string = data.rammsg || ''

    if (banmsg) {
      const { endTime, remaining } = this._parseBanInfo(banmsg)
      return {
        qq,
        isBanned: true,
        banUntil: endTime,
        banRemaining: remaining,
        message: banmsg
      }
    }

    const msg = rammsg.includes('正常') ? '正常' : rammsg || '无结果'
    return {
      qq,
      isBanned: false,
      banUntil: '',
      banRemaining: '',
      message: msg
    }
  }

  private _parseBanInfo(msg: string): { endTime: string; remaining: string } {
    const timeMatch = msg.match(QQAccountMain.BAN_TIME_REGEX)
    const remainMatch = msg.match(QQAccountMain.BAN_REMAIN_REGEX)
    return {
      endTime: timeMatch ? timeMatch[0] : '—',
      remaining: remainMatch ? remainMatch[1].trim() : '—'
    }
  }

  // ===== 批量操作：所有賬號 =====

  /**
   * 批量查所有賬號封禁狀態（用內建 queryBatchBan），結果寫回 DB
   */
  async queryAllAccountsBan(): Promise<QQAccountDto[]> {
    const all = await this._storage.dataSource.manager.find(QQAccount)
    if (all.length === 0) return []

    const qqs = all.map((a) => a.qq)
    const results = await this.queryBatchBan(qqs)
    const resultMap = new Map(results.map((r) => [r.qq, r]))

    const now = new Date()
    for (const a of all) {
      const r = resultMap.get(a.qq)
      if (!r) continue
      if (r.status === '格式错误' || r.status === '查询失败') {
        a.banStatus = '查询失败'
        a.banUntil = null
        a.banRemaining = null
      } else if (r.isBanned) {
        a.banStatus = '已封禁'
        a.banUntil = r.banUntil
        a.banRemaining = r.banRemaining
      } else {
        a.banStatus = '正常'
        a.banUntil = null
        a.banRemaining = null
      }
      a.lastCheckedAt = now
    }

    await this._storage.dataSource.manager.save(all)
    return all.map((a) => this._toDto(a))
  }

  /**
   * 批量查所有賬號段位 — 僅查當前 LCU 大區匹配之賬號
   * 非當前大區帳號跳過，rankInfo 保留上次結果
   * LCU 未連線：拋 LcuNotConnected，不動任何 rankInfo
   */
  async queryAllAccountsRank(): Promise<{
    accounts: QQAccountDto[]
    queried: number
    skipped: number
    currentArea: string
  }> {
    if (!this._lc.state.isConnected || !this._lc.state.auth) {
      throw new AkariIpcError(
        '游戏客户端未启动或未连接，请启动 League 客户端后再试。当前展示为上次查询结果。',
        'LcuNotConnected'
      )
    }

    const auth = this._lc.state.auth
    const currentSgpId = getSgpServerId(auth.region, auth.rsoPlatformId).toUpperCase()
    const currentArea = SGP_TO_AREA[currentSgpId] || currentSgpId

    const all = await this._storage.dataSource.manager.find(QQAccount)
    if (all.length === 0) {
      return { accounts: [], queried: 0, skipped: 0, currentArea }
    }

    const now = new Date()
    let queried = 0
    let skipped = 0
    const touched: QQAccount[] = []

    for (const a of all) {
      const sgpServerId = AREA_TO_SGP[a.area]
      // 跳過：大區未支持 或 非當前 LCU 大區
      if (!sgpServerId || sgpServerId.toUpperCase() !== currentSgpId) {
        skipped++
        continue
      }
      if (!a.gameId || !a.gameId.includes('#')) {
        a.rankInfo = '游戏ID缺失'
        a.rankCheckedAt = now
        touched.push(a)
        queried++
        continue
      }
      const [name, tag] = a.gameId.split('#').map((s) => s.trim())
      if (!name || !tag) {
        a.rankInfo = 'ID格式错误'
        a.rankCheckedAt = now
        touched.push(a)
        queried++
        continue
      }

      try {
        a.rankInfo = await this._queryRankFor(name, tag, sgpServerId)
      } catch (e) {
        this._log.warn(
          `Rank query failed for ${a.gameId}@${a.area}: ${(e as Error).message}`
        )
        a.rankInfo = '查询失败'
      }
      a.rankCheckedAt = now
      touched.push(a)
      queried++
    }

    if (touched.length > 0) {
      await this._storage.dataSource.manager.save(touched)
    }
    return {
      accounts: all.map((x) => this._toDto(x)),
      queried,
      skipped,
      currentArea
    }
  }

  /**
   * 查單個玩家段位字串
   * 用 RiotClient PlayerAccount 查 puuid，再用 LCU ranked API（跨大區可用）
   * sgpServerId 保留簽名以兼容調用方，當前實現未使用
   */
  private async _queryRankFor(
    gameName: string,
    tagLine: string,
    _sgpServerId: string
  ): Promise<string> {
    const puuid = await this._lookupPuuid(gameName, tagLine)

    // LCU /lol-ranked/v1/ranked-stats/{puuid} 接受任意 puuid，跨區可查
    const { data: ranked } = await this._lc.api.ranked.getRankedStats(puuid)
    const queues: any[] = (ranked as any)?.queues || []

    const parts: string[] = []
    for (const q of queues) {
      const label = QUEUE_LABEL[q.queueType]
      if (!label || !q.tier || q.tier === 'UNRANKED') continue
      const tierKey = String(q.tier).toUpperCase()
      const tier = TIER_CN[tierKey] || q.tier
      const lp = Number(q.leaguePoints) || 0
      let tierStr = tier
      // LCU 用 division 字段（I/II/III/IV）；SGP 用 rank。兩者皆兼容
      const divRaw = q.division || q.rank
      if (!NO_DIVISION_TIERS.has(tierKey) && divRaw && divRaw !== 'NA') {
        const div = ROMAN_TO_ARABIC[String(divRaw).toUpperCase()] || divRaw
        tierStr = `${tier}${div}`
      }
      parts.push(`${label}:${tierStr} ${lp}分`)
    }

    return parts.length > 0 ? parts.join('/') : '无段位'
  }

  private async _lookupPuuid(gameName: string, tagLine: string): Promise<string> {
    try {
      const { data } = await this._rc.api.playerAccount.getPlayerAccountAlias(gameName, tagLine)
      const hit = data.find(
        (x) =>
          x.alias.game_name.toLowerCase() === gameName.toLowerCase() &&
          x.alias.tag_line.toLowerCase() === tagLine.toLowerCase()
      )
      const puuid = (hit || data[0])?.puuid
      if (!puuid) throw new Error('PUUID 未找到')
      return puuid
    } catch (e) {
      throw new Error(`查 PUUID 失败 (Riot Client 未连?): ${(e as Error).message}`)
    }
  }

  /**
   * 給定 area + gameId（"name#tag"）→ {puuid, sgpServerId}，用於跳 Akari 戰績頁
   */
  async resolveAccountForMatchHistory(
    area: string,
    gameId: string
  ): Promise<{ puuid: string; sgpServerId: string }> {
    if (!this._lc.state.isConnected) {
      throw new AkariIpcError(
        '游戏客户端未启动或未连接，请启动 League 客户端后再试',
        'LcuNotConnected'
      )
    }
    if (!gameId || !gameId.includes('#')) {
      throw new AkariIpcError('gameId 缺失或格式錯（需 name#tag）', 'InvalidGameId')
    }
    const [name, tag] = gameId.split('#').map((s) => s.trim())
    if (!name || !tag) {
      throw new AkariIpcError('gameId 格式錯', 'InvalidGameId')
    }
    const sgpServerId = AREA_TO_SGP[area]
    if (!sgpServerId) {
      throw new AkariIpcError(`大區未支持: ${area}`, 'UnsupportedArea')
    }
    const puuid = await this._lookupPuuid(name, tag)
    return { puuid, sgpServerId }
  }

  private _toDto(e: QQAccount): QQAccountDto {
    return {
      id: e.id,
      qq: e.qq,
      area: e.area,
      gameId: e.gameId,
      tag: e.tag,
      hasPassword: !!e.password,
      banStatus: e.banStatus || '未查询',
      banUntil: e.banUntil,
      banRemaining: e.banRemaining,
      rankInfo: e.rankInfo,
      rankCheckedAt: e.rankCheckedAt,
      lastCheckedAt: e.lastCheckedAt,
      createdAt: e.createdAt,
      sortOrder: e.sortOrder ?? 0
    }
  }

  // ===== IPC =====

  private _handleIpcCall() {
    this._ipc.onCall(QQAccountMain.id, 'listAccounts', () => this.listAccounts())
    this._ipc.onCall(QQAccountMain.id, 'reorderAccounts', (_, ids: string[]) =>
      this.reorderAccounts(ids)
    )
    this._ipc.onCall(QQAccountMain.id, 'createAccount', (_, dto: CreateQQAccountDto) =>
      this.createAccount(dto)
    )
    this._ipc.onCall(QQAccountMain.id, 'updateAccount', (_, dto: UpdateQQAccountDto) =>
      this.updateAccount(dto)
    )
    this._ipc.onCall(QQAccountMain.id, 'deleteAccount', (_, id: string) => this.deleteAccount(id))
    this._ipc.onCall(QQAccountMain.id, 'queryAccountBan', (_, id: string) =>
      this.queryAccountBan(id)
    )
    this._ipc.onCall(QQAccountMain.id, 'querySingleBan', (_, qq: string) =>
      this.querySingleBan(qq)
    )
    this._ipc.onCall(QQAccountMain.id, 'queryBatchBan', (_, qqs: string[]) =>
      this.queryBatchBan(qqs)
    )
    this._ipc.onCall(QQAccountMain.id, 'queryAllAccountsBan', () => this.queryAllAccountsBan())
    this._ipc.onCall(QQAccountMain.id, 'queryAllAccountsRank', () => this.queryAllAccountsRank())
    this._ipc.onCall(
      QQAccountMain.id,
      'resolveAccountForMatchHistory',
      (_, area: string, gameId: string) => this.resolveAccountForMatchHistory(area, gameId)
    )
  }
}
