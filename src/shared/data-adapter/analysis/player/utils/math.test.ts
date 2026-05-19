import { describe, expect, it } from 'vitest'
import { avgOrZero, avgOrNull, avgIfAllNonNull } from './math'

describe('avgOrZero', () => {
  it('空样本（玩家无有效对局）→ 0', () => {
    expect(avgOrZero([])).toBe(0)
  })

  it('单场 KDA 3.5 → 3.5', () => {
    expect(avgOrZero([3.5])).toBe(3.5)
  })

  it('5 场 KDA：3.5, 2.0, 4.0, 1.5, 5.0 → 3.2', () => {
    expect(avgOrZero([3.5, 2.0, 4.0, 1.5, 5.0])).toBeCloseTo(3.2)
  })

  it('场均击杀数：3, 5, 2, 8, 1 → 3.8', () => {
    expect(avgOrZero([3, 5, 2, 8, 1])).toBeCloseTo(3.8)
  })

  it('伤害占比（百分比小数）：0.25, 0.30, 0.20 → 0.25', () => {
    expect(avgOrZero([0.25, 0.30, 0.20])).toBeCloseTo(0.25)
  })
})

describe('avgOrNull', () => {
  it('无首龙时间样本 → null（表示没有数据）', () => {
    expect(avgOrNull([])).toBeNull()
  })

  it('单场首龙时间 8:30（510秒）→ 510', () => {
    expect(avgOrNull([510])).toBe(510)
  })

  it('多场首龙时间：510s, 600s, 480s → 530s ≈ 8:50', () => {
    expect(avgOrNull([510, 600, 480])).toBeCloseTo(530)
  })

  it('场均视野得分：18.5, 22.0, 15.0 → 18.5', () => {
    expect(avgOrNull([18.5, 22.0, 15.0])).toBeCloseTo(18.5)
  })

  it('场均补刀：150, 180, 160, 200 → 172.5', () => {
    expect(avgOrNull([150, 180, 160, 200])).toBeCloseTo(172.5)
  })
})

describe('avgIfAllNonNull', () => {
  it('LCU 未提供对局详情 → null', () => {
    expect(avgIfAllNonNull([])).toBeNull()
  })

  it('所有对局都有 timeline 详情，取平均', () => {
    // 3 场对局的场均伤害百分比
    expect(avgIfAllNonNull([0.22, 0.28, 0.25])).toBeCloseTo(0.25)
  })

  it('部分对局缺少 timeline（null）→ 整体返回 null', () => {
    // 假设第 2 场对局的 details 为 null
    expect(avgIfAllNonNull([0.22, null, 0.25])).toBeNull()
  })

  it('单场有效对局且有详情 → 该场数值', () => {
    expect(avgIfAllNonNull([0.35])).toBe(0.35)
  })

  it('全部为 null（所有对局都缺少详情）→ null', () => {
    expect(avgIfAllNonNull([null, null, null])).toBeNull()
  })
})
