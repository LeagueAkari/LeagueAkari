import { Column, Entity, Index, PrimaryColumn } from 'typeorm'

/**
 * QQ 賬號管理 - 含大區、遊戲 ID、封禁狀態
 */
@Entity('QQAccounts')
export class QQAccount {
  @PrimaryColumn({ type: 'varchar' })
  id: string

  @Column({ type: 'varchar', nullable: false })
  @Index('qq_accounts_qq_index')
  qq: string

  @Column({ type: 'varchar', nullable: false })
  area: string

  @Column({ type: 'varchar', nullable: true })
  gameId: string | null

  @Column({ type: 'varchar', nullable: true })
  tag: string | null

  /**
   * 未查 / 正常 / 已封禁 / 查詢失敗
   */
  @Column({ type: 'varchar', nullable: false, default: "''" })
  banStatus: string

  @Column({ type: 'varchar', nullable: true })
  banUntil: string | null

  @Column({ type: 'varchar', nullable: true })
  banRemaining: string | null

  /**
   * 段位字串 (e.g. "单:翡翠416分/灵:黄金112分")
   */
  @Column({ type: 'varchar', nullable: true })
  rankInfo: string | null

  @Column({ type: 'datetime', nullable: true })
  rankCheckedAt: Date | null

  @Column({ type: 'datetime', nullable: true })
  lastCheckedAt: Date | null

  @Column({ type: 'datetime', nullable: false })
  createdAt: Date

  /**
   * 自定義排序序號，UI 拖拽更新；越小越靠前
   */
  @Column({ type: 'integer', nullable: false, default: 0 })
  sortOrder: number

  /**
   * QQ 密码（加密存储），为空则不启用快捷登录
   */
  @Column({ type: 'varchar', nullable: true })
  password: string | null
}
