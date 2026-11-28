import axios, { type AxiosInstance } from 'axios'
import { AxiosRetry } from 'axios-retry'

const axiosRetry = require('axios-retry').default as AxiosRetry

/**
 * 官方「每周免费英雄」页面使用的内容数据。
 *
 * 页面地址：https://lol.qq.com/act/a20200421weekfree/Index.html
 * 该 JS 以 `ZMSubject_Board_Site_List` 的形式导出每期数据，其中 `fightHero`
 * 即当期大乱斗免费英雄的 id 列表。
 */
const WEEK_FREE_BOARD_URL =
  'https://lol.qq.com/act/AutoCMS/publish/LOLAct/ZMSubject_Board_Site/ZMSubject_Board_Site.js'

interface WeekFreeBoardEntry {
  fightHero?: string
  freeHero?: string
  foreverFreeHero?: string
  newBulle?: {
    freeNum?: string
    iDate?: string
    version?: string
  }
}

type WeekFreeBoard = Record<string, WeekFreeBoardEntry>

/** 提取 `(function(){ return {...}; })();` 中 `return` 之后的第一段完整 JSON 对象 */
function extractJson(text: string): string | null {
  // 包装函数中可能先出现其他花括号，数据对象始终紧跟在最后一个 `return ` 之后
  const returnIndex = text.lastIndexOf('return ')
  const start = text.indexOf('{', returnIndex === -1 ? 0 : returnIndex)
  if (start === -1) {
    return null
  }

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i += 1) {
    const char = text[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
    } else if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return text.slice(start, i + 1)
      }
    }
  }

  return null
}

function periodOf(entry: WeekFreeBoardEntry): number {
  const period = Number(entry.newBulle?.freeNum)
  return Number.isFinite(period) ? period : 0
}

export class LolQqWeekFreeApi {
  static USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'

  private _http: AxiosInstance

  get http() {
    return this._http
  }

  constructor(http?: AxiosInstance) {
    this._http =
      http ??
      axios.create({
        headers: {
          'User-Agent': LolQqWeekFreeApi.USER_AGENT
        }
      })

    axiosRetry(this._http, {
      retries: 2
    })
  }

  /** 解析逗号分隔的英雄 id 串，过滤非法项 */
  private _parseIds(raw: string | undefined): number[] {
    return (raw ?? '')
      .split(',')
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0)
  }

  /** 拉取并解析周免面板数据，返回期数最大的一期（数据异常时返回 null） */
  private async _fetchLatestEntry(): Promise<WeekFreeBoardEntry | null> {
    // 该数据源为 GBK 编码，需按原始字节读取后解码，避免中文导致 JSON 解析失败
    const { data } = await this._http.get<ArrayBuffer>(WEEK_FREE_BOARD_URL, {
      responseType: 'arraybuffer'
    })

    const bytes =
      data instanceof ArrayBuffer ? new Uint8Array(data) : (data as unknown as Uint8Array)

    let text: string
    try {
      text = new TextDecoder('gbk').decode(bytes)
    } catch {
      text = new TextDecoder('utf-8').decode(bytes)
    }

    const json = extractJson(text)
    if (!json) {
      return null
    }

    const board = JSON.parse(json) as WeekFreeBoard

    const entries = Object.values(board).filter((entry) => entry?.fightHero || entry?.freeHero)
    if (!entries.length) {
      return null
    }

    // 以活动期数（freeNum）最大的一期作为当前名单
    entries.sort((a, b) => periodOf(b) - periodOf(a))
    return entries[0]
  }

  /** 拉取当期大乱斗免费英雄 id 列表（fightHero 字段），失败时返回空数组 */
  async getAramFreeChampionIds(): Promise<number[]> {
    const entry = await this._fetchLatestEntry()
    return this._parseIds(entry?.fightHero)
  }

  /** 拉取当期召唤师峡谷每周免费英雄 id 列表（同一数据源的 freeHero 字段），失败时返回空数组 */
  async getRiftFreeChampionIds(): Promise<number[]> {
    const entry = await this._fetchLatestEntry()
    return this._parseIds(entry?.freeHero)
  }
}
