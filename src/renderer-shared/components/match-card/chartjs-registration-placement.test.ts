import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function readRelativeFile(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

describe('ChartJS registration placement', () => {
  it('keeps ChartJS registration colocated with chart users', () => {
    expect(existsSync(new URL('./chartjs-register.ts', import.meta.url))).toBe(false)
    expect(readRelativeFile('./MatchCard.vue')).not.toContain('registerChartJS')

    expect(readRelativeFile('./widgets/StatsBarChart.vue')).toContain('ChartJS.register')
    expect(readRelativeFile('./widgets/RadarChart.vue')).toContain('ChartJS.register')
    expect(readRelativeFile('./tabs/timeline/MatchCardDiffLineChart.vue')).toContain(
      'ChartJS.register'
    )
    expect(
      readRelativeFile(
        '../ongoing-game-panel/widgets/player-info-card/player-card-tags/tags/suspicious-flash-position.tsx'
      )
    ).toContain('ChartJS.register')
  })
})
