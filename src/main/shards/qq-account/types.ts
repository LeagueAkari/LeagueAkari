/**
 * QQ 賬號管理相關 DTO 與常量
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

export type QQArea = (typeof QQ_AREAS)[number]

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
  rankCheckedAt: Date | null
  lastCheckedAt: Date | null
  createdAt: Date
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
