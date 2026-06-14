import { createDefaultInGameSendPresetOptions } from '@shared/types/shards/in-game-send'
import { describe, expect, it } from 'vitest'

import { buildInGameSendPresetLines } from './index'
import type { InGameSendPresetContext } from './types'

function createContext(): InGameSendPresetContext {
  return {
    target: 'friendly',
    presetOptions: createDefaultInGameSendPresetOptions(),
    mainContext: {
      state: {
        ratingPuuids: ['p1', 'p2'],
        junglePuuids: ['p1'],
        premadeIndices: [1]
      },
      leagueClient: {
        data: {
          summoner: {
            me: {
              puuid: 'p1'
            }
          }
        }
      },
      ongoingGame: {
        state: {
          teams: {
            'TEAM-100': ['p1', 'p2']
          },
          summoner: {
            p1: {
              gameName: 'Ahri Player',
              tagLine: '001'
            },
            p2: {
              gameName: 'Lee Player',
              tagLine: '002'
            }
          },
          championSelections: {
            p1: 103,
            p2: 64
          },
          positionAssignments: {
            p1: {
              position: 'MIDDLE'
            },
            p2: {
              position: 'JUNGLE'
            }
          },
          mergedPremadeTeamMap: {
            p1: 1,
            p2: 1
          },
          additional: {
            spells: {}
          },
          analysis: {
            players: {
              p1: {
                count: 12,
                winLoss: {
                  all: {
                    winRate: 0.583
                  }
                },
                summary: {
                  avgKda: 3.456
                },
                akariScore: {
                  total: 7.89
                }
              } as any
            }
          }
        }
      }
    } as any
  } as InGameSendPresetContext
}

describe('in-game-send presets', () => {
  it('builds rating lines from provided ongoing-game data', () => {
    const lines = buildInGameSendPresetLines('rating', createContext())

    expect(lines.join('\n')).toContain('Ahri Player#001')
    expect(lines.join('\n')).toContain('样本 12')
    expect(lines.join('\n')).toContain('Akari 7.9')
  })

  it('builds premade lines from selected premade groups', () => {
    const lines = buildInGameSendPresetLines('premade', createContext())

    expect(lines.join('\n')).toContain('组 A(2)')
    expect(lines.join('\n')).toContain('Ahri Player#001 / Lee Player#002')
  })
})
