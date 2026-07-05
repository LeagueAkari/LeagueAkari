import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./PlayerInfoCardChampionUsage.vue', import.meta.url), 'utf8')

describe('PlayerInfoCardChampionUsage', () => {
  it('wires recent champion avatar clicks to champion collection', () => {
    expect(source).toContain('@click.stop="() => collectByChampion(c.id)"')
    expect(source).toContain('collectByChampionId: championId')
    expect(source).toContain('expectedCount: ongoingGame.value.settings.matchHistoryLoadCount')
  })

  it('guards champion collection for standalone ongoing-game window', () => {
    expect(source).toContain('canCollectByChampion')
  })
})
