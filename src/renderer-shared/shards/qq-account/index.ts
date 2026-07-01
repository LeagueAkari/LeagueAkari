import { Dep, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'

const MAIN_SHARD_NAMESPACE = 'qq-account-main'

/**
 * 與 main shard `types.ts` 保持同步（renderer 不引 main 路徑）
 */
export const QQ_AREAS = [
  '艾欧尼亚',
  '黑色玫瑰',
  '比尔吉沃特',
  '祖安',
  '诺克萨斯',
  '班德尔城',
  '德玛西亚',
  '皮尔特沃夫',
  '战争学院',
  '弗雷尔卓德',
  '巨神峰',
  '雷瑟守备',
  '无畏先锋',
  '裁决之地',
  '暗影岛',
  '钢铁烈阳',
  '水晶之痕',
  '影流',
  '守望之海',
  '征服之海',
  '恕瑞玛',
  '扭曲丛林',
  '卡拉曼达',
  '皮城警备',
  '巨龙之巢',
  '男爵领域',
  '均衡教派',
  '峡谷之巅',
  '教育网专区'
] as const

export interface QQAccountDto {
  id: string
  qq: string
  area: string
  gameId: string | null
  tag: string | null
  hasPassword: boolean
  banStatus: string
  banUntil: string | null
  banRemaining: string | null
  rankInfo: string | null
  rankCheckedAt: Date | string | null
  lastCheckedAt: Date | string | null
  createdAt: Date | string
  sortOrder: number
}

export interface CreateQQAccountDto {
  qq: string
  area: string
  gameId?: string | null
  tag?: string | null
  password?: string | null
}

export interface UpdateQQAccountDto {
  id: string
  qq?: string
  area?: string
  gameId?: string | null
  tag?: string | null
  password?: string | null
}

export interface BanQueryResult {
  qq: string
  isBanned: boolean
  banUntil: string
  banRemaining: string
  message: string
}

export interface BatchBanQueryResult {
  qq: string
  isBanned: boolean
  status: string
  color: 'green' | 'red' | 'gray'
  banUntil: string
  banRemaining: string
}

@Shard(QQAccountRenderer.id)
export class QQAccountRenderer {
  static id = 'qq-account-renderer'

  constructor(@Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer) {}

  listAccounts(): Promise<QQAccountDto[]> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'listAccounts')
  }

  reorderAccounts(orderedIds: string[]): Promise<QQAccountDto[]> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'reorderAccounts', orderedIds)
  }

  createAccount(dto: CreateQQAccountDto): Promise<QQAccountDto> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'createAccount', dto)
  }

  updateAccount(dto: UpdateQQAccountDto): Promise<QQAccountDto> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'updateAccount', dto)
  }

  deleteAccount(id: string): Promise<void> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'deleteAccount', id)
  }

  queryAccountBan(id: string): Promise<QQAccountDto> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'queryAccountBan', id)
  }

  querySingleBan(qq: string): Promise<BanQueryResult> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'querySingleBan', qq)
  }

  queryBatchBan(qqs: string[]): Promise<BatchBanQueryResult[]> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'queryBatchBan', qqs)
  }

  queryAllAccountsBan(): Promise<QQAccountDto[]> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'queryAllAccountsBan')
  }

  queryAllAccountsRank(): Promise<{
    accounts: QQAccountDto[]
    queried: number
    skipped: number
    currentArea: string
  }> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'queryAllAccountsRank')
  }

  resolveAccountForMatchHistory(
    area: string,
    gameId: string
  ): Promise<{ puuid: string; sgpServerId: string }> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'resolveAccountForMatchHistory', area, gameId)
  }
}
