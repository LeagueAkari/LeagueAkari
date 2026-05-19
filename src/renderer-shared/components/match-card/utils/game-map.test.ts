import { describe, expect, it } from 'vitest'
import { mapToImagePosition, isSupportedMap, LOL_MAP_DOMAINS } from './game-map'

// 真实的游戏内坐标 → 图片像素映射场景
// JunglePathingInfo 中地图尺寸常用 48px（mini）和 140px（detail）

describe('mapToImagePosition', () => {
  const domain = LOL_MAP_DOMAINS[11]

  it('蓝方蓝buff (3830, 7880) 在 140px 地图上的正确位置', () => {
    const result = mapToImagePosition(3830, 7880, 140, 140, 11)
    // x: ~25.8% → 36px, y: ~47% → 66px (invertY: maxY-y)
    expect(result.left).toBeCloseTo(36, 0)
    expect(result.top).toBeCloseTo(66, 0)
  })

  it('红方红buff (7060, 10870) 在 140px 地图上的正确位置', () => {
    const result = mapToImagePosition(7060, 10870, 140, 140, 11)
    // x: ~47.6% → 67px, y: (14881-10870)/14881 ≈ 27% → 38px
    expect(result.left).toBeCloseTo(67, 0)
    expect(result.top).toBeCloseTo(38, 0)
  })

  it('地图左下角 (0, 0) → (0, 140) 在 140px 地图上', () => {
    const result = mapToImagePosition(0, 0, 140, 140, 11)
    expect(result.left).toBeCloseTo(0)
    expect(result.top).toBeCloseTo(140)
  })

  it('地图右上角 (maxX, maxY) → (140, 0) 在 140px 地图上', () => {
    const result = mapToImagePosition(domain.maxX, domain.maxY, 140, 140, 11)
    expect(result.left).toBeCloseTo(140)
    expect(result.top).toBeCloseTo(0)
  })

  it('地图中心点在 mini 地图上也在中心', () => {
    const result = mapToImagePosition(
      (domain.minX + domain.maxX) / 2,
      (domain.minY + domain.maxY) / 2,
      48,
      48,
      11
    )
    expect(result.left).toBeCloseTo(24, 0)
    expect(result.top).toBeCloseTo(24, 0)
  })

  it('clamp: true 时超出地图范围的坐标被限制在图片边界', () => {
    const result = mapToImagePosition(-500, 20000, 140, 140, 11)
    expect(result.left).toBe(0)
    expect(result.top).toBe(0)
  })

  it('clamp: false 时允许超出图片边界（用于特殊渲染场景）', () => {
    const result = mapToImagePosition(-500, 20000, 140, 140, 11, { clamp: false })
    expect(result.left).toBeLessThan(0)
    expect(result.top).toBeLessThan(0)
  })

  it('invertY: false 时 y 轴不反转（用于特殊坐标系）', () => {
    const result = mapToImagePosition(0, 0, 100, 100, 11, { invertY: false })
    // y: (0 - minY)/rangeY * 100
    expect(result.top).toBeCloseTo(0)
  })
})

describe('isSupportedMap', () => {
  it('召唤师峡谷 (11) 支持', () => {
    expect(isSupportedMap(11)).toBe(true)
  })

  it('嚎哭深渊 (12) 支持', () => {
    expect(isSupportedMap(12)).toBe(true)
  })

  it('ARAM (21) 支持', () => {
    expect(isSupportedMap(21)).toBe(true)
  })

  it('旧版扭曲丛林 (10) 不支持', () => {
    expect(isSupportedMap(10)).toBe(false)
  })

  it('未知地图 ID 不支持', () => {
    expect(isSupportedMap(999)).toBe(false)
  })
})
