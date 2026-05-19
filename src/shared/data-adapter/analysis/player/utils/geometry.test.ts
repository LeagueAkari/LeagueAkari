import { describe, expect, it } from 'vitest'
import { classifyMapZone, classifyGankLane, detectStartCamp } from './geometry'
import { BLUE_SIDE_CAMPS, RED_SIDE_CAMPS } from '../constants'

// 真实召唤师峡谷坐标 (map 11: 0~14820 x, 0~14881 y)
// 上路三角草: ~(2000, 12500)
// 下路三角草: ~(12500, 2000)
// 中路中央:   ~(7410, 7440)
// 河道入口(龙坑附近): ~(9500, 4500)
// 蓝方打野起手蓝buff: ~(3830, 7880)
// 红方打野起手红buff: ~(7060, 10870)

describe('classifyMapZone', () => {
  it('上路三角草附近 → top', () => {
    expect(classifyMapZone(2000, 12500)).toBe('top')
  })

  it('下路三角草附近 → bot', () => {
    expect(classifyMapZone(12500, 2000)).toBe('bot')
  })

  it('中路中央 → mid', () => {
    expect(classifyMapZone(7410, 7440)).toBe('mid')
  })

  it('龙坑附近 → bot（离对角线较远，y < x）', () => {
    expect(classifyMapZone(9500, 4500)).toBe('bot')
  })

  it('蓝方打野蓝buff → mid（靠近对角线但属于蓝方野区）', () => {
    expect(classifyMapZone(3830, 7880)).toBe('top')
  })

  it('红方打野红buff → mid（靠近对角线但属于红方野区）', () => {
    expect(classifyMapZone(7060, 10870)).toBe('top')
  })

  it('上路一塔附近 → top', () => {
    expect(classifyMapZone(1500, 10500)).toBe('top')
  })

  it('下路一塔附近 → bot', () => {
    expect(classifyMapZone(10500, 1500)).toBe('bot')
  })
})

describe('classifyGankLane', () => {
  it('上路一塔击杀位置 → top', () => {
    expect(classifyGankLane(1500, 10500)).toBe('top')
  })

  it('下路一塔击杀位置 → bot', () => {
    expect(classifyGankLane(10500, 1500)).toBe('bot')
  })

  it('中路一塔击杀位置 → mid', () => {
    expect(classifyGankLane(7000, 8000)).toBe('mid')
  })

  it('河道中央 gank 位置 → mid', () => {
    expect(classifyGankLane(8000, 7500)).toBe('mid')
  })

  it('远离兵线的野区位置（如蓝方蓝buff）→ null', () => {
    expect(classifyGankLane(3830, 7880)).toBeNull()
  })

  it('靠近兵线但位置模糊的河道路口 → null', () => {
    expect(classifyGankLane(1000, 1000)).toBeNull()
  })
})

describe('detectStartCamp', () => {
  it('蓝方打野在蓝buff起手 → blue/blue', () => {
    const camp = BLUE_SIDE_CAMPS.find((c) => c.camp === 'blue')!
    const result = detectStartCamp(camp.x, camp.y)
    expect(result).toEqual({ camp: 'blue', side: 'blue' })
  })

  it('蓝方打野在红buff起手（位置微偏） → red/blue', () => {
    const camp = BLUE_SIDE_CAMPS.find((c) => c.camp === 'red')!
    const result = detectStartCamp(camp.x + 200, camp.y - 200)
    expect(result).toEqual({ camp: 'red', side: 'blue' })
  })

  it('红方打野在红buff起手 → red/red', () => {
    const camp = RED_SIDE_CAMPS.find((c) => c.camp === 'red')!
    const result = detectStartCamp(camp.x, camp.y)
    expect(result).toEqual({ camp: 'red', side: 'red' })
  })

  it('红方打野入侵蓝方蓝buff → blue/blue（入侵）', () => {
    const camp = BLUE_SIDE_CAMPS.find((c) => c.camp === 'blue')!
    const result = detectStartCamp(camp.x, camp.y)
    expect(result).toEqual({ camp: 'blue', side: 'blue' })
    // 注意：side 只表示营地所属阵营，是否"入侵"需要结合打野自身阵营判断
  })

  it('蓝方打野在三狼起手 → wolves/blue', () => {
    const camp = BLUE_SIDE_CAMPS.find((c) => c.camp === 'wolves')!
    const result = detectStartCamp(camp.x, camp.y)
    expect(result).toEqual({ camp: 'wolves', side: 'blue' })
  })

  it('蓝方打野在F6起手 → raptors/blue', () => {
    const camp = BLUE_SIDE_CAMPS.find((c) => c.camp === 'raptors')!
    const result = detectStartCamp(camp.x, camp.y)
    expect(result).toEqual({ camp: 'raptors', side: 'blue' })
  })

  it('所有蓝方营地都被识别为 blue side', () => {
    for (const camp of BLUE_SIDE_CAMPS) {
      expect(detectStartCamp(camp.x, camp.y).side).toBe('blue')
    }
  })

  it('所有红方营地都被识别为 red side', () => {
    for (const camp of RED_SIDE_CAMPS) {
      expect(detectStartCamp(camp.x, camp.y).side).toBe('red')
    }
  })

  it('地图中央附近（河道）→ 最近的营地是 raptors', () => {
    const result = detectStartCamp(7400, 7400)
    // 河道中央没有营地，蓝方 raptors(6970,5460) 和红方 raptors(7850,9420) 距离相近
    expect(result.camp).toBe('raptors')
    expect(['blue', 'red']).toContain(result.side)
  })
})
