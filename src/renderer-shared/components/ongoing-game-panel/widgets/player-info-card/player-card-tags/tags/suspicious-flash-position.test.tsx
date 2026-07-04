import { describe, expect, it } from 'vitest'

import {
  SUSPICIOUS_FLASH_POSITION_CHART_BORDER_WIDTH,
  resolveSuspiciousFlashPositionChartDevicePixelRatio
} from './suspicious-flash-position'

describe('suspicious flash position chart', () => {
  it('keeps the small popover pie chart rendered at high pixel density', () => {
    expect(resolveSuspiciousFlashPositionChartDevicePixelRatio(1)).toBe(3)
    expect(resolveSuspiciousFlashPositionChartDevicePixelRatio(1.25)).toBe(3)
    expect(resolveSuspiciousFlashPositionChartDevicePixelRatio(2)).toBe(3)
    expect(resolveSuspiciousFlashPositionChartDevicePixelRatio(4)).toBe(4)
  })

  it('falls back to the high-density minimum for invalid browser ratios', () => {
    expect(resolveSuspiciousFlashPositionChartDevicePixelRatio(0)).toBe(3)
    expect(resolveSuspiciousFlashPositionChartDevicePixelRatio(Number.NaN)).toBe(3)
  })

  it('uses a thin separator stroke between pie slices', () => {
    expect(SUSPICIOUS_FLASH_POSITION_CHART_BORDER_WIDTH).toBe(1)
  })
})
