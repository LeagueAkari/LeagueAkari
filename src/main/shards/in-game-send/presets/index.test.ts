import {
  createDefaultInGameSendJunglePresetOptions,
  createDefaultInGameSendPremadePresetOptions,
  createDefaultInGameSendRatingPresetOptions
} from '@shared/shards/in-game-send'
import { describe, expect, it } from 'vitest'

import { buildJunglePresetLines, buildPremadePresetLines, buildRatingPresetLines } from './index'
import type { InGameSendJunglePresetLineOptions } from './jungle'
import type { InGameSendPremadePresetLineOptions } from './premade'
import type { InGameSendRatingPresetLineOptions } from './rating'
import type { InGameSendPresetContext } from './types'

function createMainContext() {
  return {
    leagueClient: {
      data: {
        summoner: {
          me: {
            puuid: 'p1'
          }
        },
        gameData: {
          championName: (id: number) => {
            return (
              {
                64: '盲僧',
                99: '光辉女郎',
                103: '无极剑圣',
                111: '深海泰坦',
                222: '暴走萝莉'
              }[id] ?? id.toString()
            )
          }
        }
      }
    },
    ongoingGame: {
      state: {
        teams: {
          'TEAM-100': ['p1', 'p2', 'p3', 'p4']
        },
        summoner: {
          p1: {
            gameName: 'RIP董事长',
            tagLine: '81406'
          },
          p2: {
            gameName: 'Lee Player',
            tagLine: '002'
          },
          p3: {
            gameName: 'Naut Player',
            tagLine: '003'
          },
          p4: {
            gameName: 'Jinx Player',
            tagLine: '004'
          }
        },
        championSelections: {
          p1: 103,
          p2: 64,
          p3: 111,
          p4: 222
        },
        positionAssignments: {
          p1: {
            position: 'MIDDLE'
          },
          p2: {
            position: 'JUNGLE'
          },
          p3: {
            position: 'UTILITY'
          },
          p4: {
            position: 'BOTTOM'
          }
        },
        mergedPremadeTeamMap: {
          p1: 1,
          p2: 1,
          p3: 2,
          p4: 2
        },
        additional: {
          spells: {}
        },
        analysis: {
          players: {
            p1: {
              count: 50,
              winLoss: {
                all: {
                  winRate: 0.59
                }
              },
              summary: {
                avgKda: 2.34,
                avgSoloKills: 0.8,
                avgVisionScore: 26.4
              },
              positions: {
                TOP: 4,
                JUNGLE: 15,
                MIDDLE: 28,
                BOTTOM: 2,
                UTILITY: 1
              },
              champions: {
                103: {
                  championId: 103,
                  winLoss: {
                    all: {
                      count: 16,
                      winRate: 0.667
                    }
                  },
                  summary: {
                    avgKda: 4.321,
                    avgSoloKills: 1.2,
                    avgVisionScore: 24.7
                  },
                  positions: {
                    TOP: 1,
                    JUNGLE: 2,
                    MIDDLE: 12,
                    BOTTOM: 1,
                    UTILITY: 0
                  }
                },
                64: {
                  championId: 64,
                  winLoss: {
                    all: {
                      count: 14,
                      winRate: 0.571
                    }
                  },
                  summary: {
                    avgKda: 2.4,
                    avgSoloKills: 0.6,
                    avgVisionScore: 18.3
                  },
                  positions: {
                    TOP: 0,
                    JUNGLE: 14,
                    MIDDLE: 0,
                    BOTTOM: 0,
                    UTILITY: 0
                  }
                },
                111: {
                  championId: 111,
                  winLoss: {
                    all: {
                      count: 12,
                      winRate: 0.5
                    }
                  },
                  summary: {
                    avgKda: 2.1,
                    avgSoloKills: 0.3,
                    avgVisionScore: 31.2
                  },
                  positions: {
                    TOP: 0,
                    JUNGLE: 0,
                    MIDDLE: 0,
                    BOTTOM: 0,
                    UTILITY: 12
                  }
                },
                222: {
                  championId: 222,
                  winLoss: {
                    all: {
                      count: 2,
                      winRate: 0.5
                    }
                  },
                  summary: {
                    avgKda: 1.8,
                    avgSoloKills: 0.1,
                    avgVisionScore: 16.1
                  },
                  positions: {
                    TOP: 0,
                    JUNGLE: 0,
                    MIDDLE: 0,
                    BOTTOM: 2,
                    UTILITY: 0
                  }
                }
              }
            } as any
          }
        }
      }
    }
  } as any
}

function createContext(): InGameSendPresetContext {
  return {
    target: 'friendly',
    mainContext: createMainContext()
  }
}

function createRatingOptions(): InGameSendRatingPresetLineOptions {
  const defaults = createDefaultInGameSendRatingPresetOptions()

  return {
    selectedPuuids: ['p1', 'p2'],
    kda: defaults.kda,
    winRate: defaults.winRate,
    avgSoloKills: defaults.avgSoloKills,
    avgVisionScore: defaults.avgVisionScore,
    mainChampions: defaults.mainChampions,
    mainPositions: defaults.mainPositions,
    nameDisplayStrategy: defaults.nameDisplayStrategy,
    showCurrentChampion: defaults.showCurrentChampion
  }
}

function createJungleAnalysis(overrides: Record<string, any> = {}) {
  return {
    gamesAnalyzed: 20,
    avgTopZonePercentage: 0.28,
    avgMidZonePercentage: 0.41,
    avgBotZonePercentage: 0.31,
    objectives: {
      firstDragonRate: 0.58,
      avgFirstDragonTime: 390,
      avgDragons: 1.7,
      avgVoidgrubs: 2.1,
      avgHeralds: 0.4,
      avgBarons: 0.2
    },
    firstClearCamp: {
      blue: {
        red: 8,
        blue: 0,
        wolves: 0,
        raptors: 0
      },
      red: {
        red: 0,
        blue: 8,
        wolves: 0,
        raptors: 0
      },
      blueInvade: {
        red: 1,
        blue: 1,
        wolves: 0,
        raptors: 0
      },
      redInvade: {
        red: 2,
        blue: 0,
        wolves: 0,
        raptors: 0
      },
      blueGames: 10,
      redGames: 10
    },
    earlyGank: {
      level3GankRate: 0.24,
      level4GankRate: 0.43
    },
    ...overrides
  }
}

function createJungleContext(): InGameSendPresetContext {
  const mainContext = createMainContext()
  const playerAnalysis = mainContext.ongoingGame.state.analysis.players.p1

  playerAnalysis.jungle = createJungleAnalysis()
  playerAnalysis.champions[103].jungle = createJungleAnalysis({
    gamesAnalyzed: 16,
    avgTopZonePercentage: 0.22,
    avgMidZonePercentage: 0.46,
    avgBotZonePercentage: 0.32,
    objectives: {
      firstDragonRate: 0.625,
      avgFirstDragonTime: 372,
      avgDragons: 1.9,
      avgVoidgrubs: 2.4,
      avgHeralds: 0.5,
      avgBarons: 0.3
    },
    firstClearCamp: {
      blue: {
        red: 4,
        blue: 2,
        wolves: 0,
        raptors: 0
      },
      red: {
        red: 2,
        blue: 6,
        wolves: 0,
        raptors: 0
      },
      blueInvade: {
        red: 0,
        blue: 2,
        wolves: 0,
        raptors: 0
      },
      redInvade: {
        red: 0,
        blue: 0,
        wolves: 0,
        raptors: 0
      },
      blueGames: 8,
      redGames: 8
    },
    earlyGank: {
      level3GankRate: 0.31,
      level4GankRate: 0.5
    }
  })
  playerAnalysis.champions[64].jungle = createJungleAnalysis({
    gamesAnalyzed: 12
  })
  playerAnalysis.champions[111].jungle = createJungleAnalysis({
    gamesAnalyzed: 8
  })
  playerAnalysis.champions[222].jungle = createJungleAnalysis({
    gamesAnalyzed: 1
  })

  return {
    target: 'friendly',
    mainContext
  }
}

function createJungleOptions(): InGameSendJunglePresetLineOptions {
  const defaults = createDefaultInGameSendJunglePresetOptions()

  return {
    selectedPuuids: ['p1'],
    activityPreference: defaults.activityPreference,
    firstClearDistribution: defaults.firstClearDistribution,
    earlyGank: defaults.earlyGank,
    dragonControl: defaults.dragonControl,
    monsterControl: defaults.monsterControl,
    mainChampions: defaults.mainChampions,
    nameDisplayStrategy: defaults.nameDisplayStrategy,
    showCurrentChampion: defaults.showCurrentChampion
  }
}

function createPremadeOptions(): InGameSendPremadePresetLineOptions {
  const defaults = createDefaultInGameSendPremadePresetOptions()

  return {
    selectedPremadeIndices: [1, 2],
    nameDisplayStrategy: defaults.nameDisplayStrategy
  }
}

describe('in-game-send presets', () => {
  it('builds rating lines from provided ongoing-game data', () => {
    const lines = buildRatingPresetLines(createContext(), createRatingOptions())

    expect(lines).toEqual([
      '无极剑圣：统计50场对局，胜率59% KDA2.34 场均单杀0.8 主玩英雄[无极剑圣，盲僧，深海泰坦] 主玩位置[中路，打野]',
      '盲僧：近期没有对局记录'
    ])
  })

  it('shows average vision score after average solo kills when enabled', () => {
    const lines = buildRatingPresetLines(createContext(), {
      ...createRatingOptions(),
      selectedPuuids: ['p1'],
      avgVisionScore: true,
      mainChampions: false,
      mainPositions: false
    })

    expect(lines).toEqual(['无极剑圣：统计50场对局，胜率59% KDA2.34 场均单杀0.8 场均视野得分26.4'])
  })

  it('shows player names when name display strategy prefers names', () => {
    const lines = buildRatingPresetLines(createContext(), {
      ...createRatingOptions(),
      nameDisplayStrategy: 'preferName'
    })

    expect(lines).toEqual([
      'RIP董事长#81406：统计50场对局，胜率59% KDA2.34 场均单杀0.8 主玩英雄[无极剑圣，盲僧，深海泰坦] 主玩位置[中路，打野]',
      'Lee Player#002：近期没有对局记录'
    ])
  })

  it('falls back to player names for duplicate champions when preferring champion names', () => {
    const mainContext = createMainContext()
    mainContext.ongoingGame.state.championSelections.p2 = 103

    const lines = buildRatingPresetLines(
      {
        target: 'friendly',
        mainContext
      },
      createRatingOptions()
    )

    expect(lines).toEqual([
      'RIP董事长#81406：统计50场对局，胜率59% KDA2.34 场均单杀0.8 主玩英雄[无极剑圣，盲僧，深海泰坦] 主玩位置[中路，打野]',
      'Lee Player#002：近期没有对局记录'
    ])
  })

  it('shows champion and player names together when requested', () => {
    const lines = buildRatingPresetLines(createContext(), {
      ...createRatingOptions(),
      selectedPuuids: ['p1'],
      nameDisplayStrategy: 'championNameWithName',
      avgSoloKills: false,
      avgVisionScore: false,
      mainChampions: false,
      mainPositions: false
    })

    expect(lines).toEqual(['无极剑圣（RIP董事长#81406）：统计50场对局，胜率59% KDA2.34'])
  })

  it('uses current champion rating stats when enabled', () => {
    const lines = buildRatingPresetLines(createContext(), {
      ...createRatingOptions(),
      showCurrentChampion: true
    })

    expect(lines).toEqual([
      '无极剑圣：统计本英雄16场，胜率67% KDA4.32 场均单杀1.2 主玩位置[中路，打野，上路，下路]',
      '盲僧：近期没有本英雄对局记录'
    ])
  })

  it('includes the current champion name in stats when current champion mode shows player names', () => {
    const lines = buildRatingPresetLines(createContext(), {
      ...createRatingOptions(),
      selectedPuuids: ['p1'],
      nameDisplayStrategy: 'preferName',
      showCurrentChampion: true,
      mainPositions: false
    })

    expect(lines).toEqual(['RIP董事长#81406：统计无极剑圣16场，胜率67% KDA4.32 场均单杀1.2'])
  })

  it('uses current champion name in stats when duplicate champions force player names', () => {
    const mainContext = createMainContext()
    mainContext.ongoingGame.state.championSelections.p2 = 103

    const lines = buildRatingPresetLines(
      {
        target: 'friendly',
        mainContext
      },
      {
        ...createRatingOptions(),
        selectedPuuids: ['p1', 'p2'],
        showCurrentChampion: true,
        mainPositions: false
      }
    )

    expect(lines).toEqual([
      'RIP董事长#81406：统计无极剑圣16场，胜率67% KDA4.32 场均单杀1.2',
      'Lee Player#002：近期没有无极剑圣对局记录'
    ])
  })

  it('uses current champion wording when champion and player names are both shown', () => {
    const lines = buildRatingPresetLines(createContext(), {
      ...createRatingOptions(),
      selectedPuuids: ['p1'],
      nameDisplayStrategy: 'championNameWithName',
      showCurrentChampion: true,
      mainPositions: false
    })

    expect(lines).toEqual([
      '无极剑圣（RIP董事长#81406）：统计本英雄16场，胜率67% KDA4.32 场均单杀1.2'
    ])
  })

  it('reports players without champion selection when current champion stats are enabled', () => {
    const mainContext = createMainContext()
    mainContext.ongoingGame.state.championSelections.p1 = 0

    const lines = buildRatingPresetLines(
      {
        target: 'friendly',
        mainContext
      },
      {
        ...createRatingOptions(),
        selectedPuuids: ['p1'],
        showCurrentChampion: true
      }
    )

    expect(lines).toEqual(['RIP董事长#81406：尚未选择英雄'])
  })

  it('omits unavailable game count without adding extra spacing around rating stats', () => {
    const mainContext = createMainContext()
    mainContext.ongoingGame.state.analysis.players.p1.count = null

    const lines = buildRatingPresetLines(
      {
        target: 'friendly',
        mainContext
      },
      {
        ...createRatingOptions(),
        selectedPuuids: ['p1']
      }
    )

    expect(lines).toEqual([
      '无极剑圣：胜率59% KDA2.34 场均单杀0.8 主玩英雄[无极剑圣，盲僧，深海泰坦] 主玩位置[中路，打野]'
    ])
  })

  it('does not append average solo kills when SGP-only value is unavailable', () => {
    const mainContext = createMainContext()
    mainContext.ongoingGame.state.analysis.players.p1.summary.avgSoloKills = null

    const lines = buildRatingPresetLines(
      {
        target: 'friendly',
        mainContext
      },
      {
        ...createRatingOptions(),
        selectedPuuids: ['p1'],
        mainChampions: false,
        mainPositions: false
      }
    )

    expect(lines).toEqual(['无极剑圣：统计50场对局，胜率59% KDA2.34'])
  })

  it('does not append main champions when champion usage is scattered', () => {
    const mainContext = createMainContext()
    const champions = mainContext.ongoingGame.state.analysis.players.p1.champions
    champions[103].winLoss.all.count = 8
    champions[64].winLoss.all.count = 7
    champions[111].winLoss.all.count = 6
    champions[222].winLoss.all.count = 5

    const lines = buildRatingPresetLines(
      {
        target: 'friendly',
        mainContext
      },
      {
        ...createRatingOptions(),
        selectedPuuids: ['p1'],
        avgSoloKills: false,
        avgVisionScore: false,
        mainPositions: false
      }
    )

    expect(lines).toEqual(['无极剑圣：统计50场对局，胜率59% KDA2.34'])
  })

  it('does not append main champions when disabled', () => {
    const lines = buildRatingPresetLines(createContext(), {
      ...createRatingOptions(),
      selectedPuuids: ['p1'],
      avgSoloKills: false,
      avgVisionScore: false,
      mainChampions: false,
      mainPositions: false
    })

    expect(lines).toEqual(['无极剑圣：统计50场对局，胜率59% KDA2.34'])
  })

  it('does not append main positions when position usage is scattered', () => {
    const mainContext = createMainContext()
    mainContext.ongoingGame.state.analysis.players.p1.positions = {
      TOP: 12,
      JUNGLE: 11,
      MIDDLE: 10,
      BOTTOM: 9,
      UTILITY: 8
    }

    const lines = buildRatingPresetLines(
      {
        target: 'friendly',
        mainContext
      },
      {
        ...createRatingOptions(),
        selectedPuuids: ['p1'],
        avgSoloKills: false,
        avgVisionScore: false,
        mainChampions: false
      }
    )

    expect(lines).toEqual(['无极剑圣：统计50场对局，胜率59% KDA2.34'])
  })

  it('does not append main positions when position data is unavailable', () => {
    const mainContext = createMainContext()
    mainContext.ongoingGame.state.analysis.players.p1.positions = null

    const lines = buildRatingPresetLines(
      {
        target: 'friendly',
        mainContext
      },
      {
        ...createRatingOptions(),
        selectedPuuids: ['p1'],
        avgSoloKills: false,
        avgVisionScore: false,
        mainChampions: false
      }
    )

    expect(lines).toEqual(['无极剑圣：统计50场对局，胜率59% KDA2.34'])
  })

  it('does not append main positions when disabled', () => {
    const lines = buildRatingPresetLines(createContext(), {
      ...createRatingOptions(),
      selectedPuuids: ['p1'],
      avgSoloKills: false,
      avgVisionScore: false,
      mainChampions: false,
      mainPositions: false
    })

    expect(lines).toEqual(['无极剑圣：统计50场对局，胜率59% KDA2.34'])
  })

  it('does not build rating lines when there are no sendable players', () => {
    expect(
      buildRatingPresetLines(createContext(), { ...createRatingOptions(), selectedPuuids: [] })
    ).toEqual([])

    expect(
      buildRatingPresetLines(
        {
          target: 'enemy',
          mainContext: createMainContext()
        },
        createRatingOptions()
      )
    ).toEqual([])
  })

  it('builds current champion jungle preference lines by default', () => {
    const lines = buildJunglePresetLines(createJungleContext(), createJungleOptions())

    expect(lines).toEqual([
      '无极剑圣：本英雄打野样本16场 前期偏中下，上22%中46%下32% 蓝方常规开75%[红Buff67%，蓝Buff33%] 蓝方入侵开25%[蓝Buff100%] 红方常规开100%[蓝Buff75%，红Buff25%] 红方入侵开0% 3级抓31% 4级抓50% 一龙率63%，首龙均时6:12 场均小龙1.9 野怪资源巢虫2.4/先锋0.5/大龙0.3'
    ])
  })

  it('builds global jungle preference lines when current champion filtering is disabled', () => {
    const lines = buildJunglePresetLines(createJungleContext(), {
      ...createJungleOptions(),
      showCurrentChampion: false
    })

    expect(lines).toEqual([
      '无极剑圣：打野样本20场 前期偏中下，上28%中41%下31% 3级抓24% 4级抓43% 一龙率58%，首龙均时6:30 场均小龙1.7 野怪资源巢虫2.1/先锋0.4/大龙0.2 主玩英雄[无极剑圣，盲僧，深海泰坦]'
    ])
  })

  it('uses player names in jungle lines when name display strategy prefers names', () => {
    const lines = buildJunglePresetLines(createJungleContext(), {
      ...createJungleOptions(),
      nameDisplayStrategy: 'preferName'
    })

    expect(lines[0].startsWith('RIP董事长#81406：无极剑圣打野样本16场')).toBe(true)
  })

  it('omits first clear distribution when disabled for current champion jungle lines', () => {
    const lines = buildJunglePresetLines(createJungleContext(), {
      ...createJungleOptions(),
      firstClearDistribution: false
    })

    expect(lines).toEqual([
      '无极剑圣：本英雄打野样本16场 前期偏中下，上22%中46%下32% 3级抓31% 4级抓50% 一龙率63%，首龙均时6:12 场均小龙1.9 野怪资源巢虫2.4/先锋0.5/大龙0.3'
    ])
  })

  it('omits main jungle champions when current champion filtering is enabled', () => {
    const lines = buildJunglePresetLines(createJungleContext(), {
      ...createJungleOptions(),
      firstClearDistribution: false,
      mainChampions: true
    })

    expect(lines[0]).not.toContain('主玩英雄')
  })

  it('reports jungle players without champion selection when current champion filtering is enabled', () => {
    const context = createJungleContext()
    context.mainContext.ongoingGame.state.championSelections.p1 = 0

    const lines = buildJunglePresetLines(context, createJungleOptions())

    expect(lines).toEqual(['RIP董事长#81406：尚未选择英雄'])
  })

  it('builds premade lines from selected premade groups', () => {
    const lines = buildPremadePresetLines(createContext(), createPremadeOptions())

    expect(lines).toEqual(['蓝方开黑：[无极剑圣, 盲僧] [深海泰坦, 暴走萝莉]'])
  })

  it('uses red side label for TEAM-200 premade lines', () => {
    const mainContext = createMainContext()
    mainContext.ongoingGame.state.teams = {
      'TEAM-200': ['p1', 'p2', 'p3', 'p4']
    }

    const lines = buildPremadePresetLines(
      {
        target: 'friendly',
        mainContext
      },
      createPremadeOptions()
    )

    expect(lines).toEqual(['红方开黑：[无极剑圣, 盲僧] [深海泰坦, 暴走萝莉]'])
  })

  it('shows player names in premade lines when name display strategy prefers names', () => {
    const lines = buildPremadePresetLines(createContext(), {
      ...createPremadeOptions(),
      nameDisplayStrategy: 'preferName'
    })

    expect(lines).toEqual([
      '蓝方开黑：[RIP董事长#81406, Lee Player#002] [Naut Player#003, Jinx Player#004]'
    ])
  })

  it('falls back to player names for duplicate champions in premade lines', () => {
    const mainContext = createMainContext()
    mainContext.ongoingGame.state.championSelections.p2 = 103

    const lines = buildPremadePresetLines(
      {
        target: 'friendly',
        mainContext
      },
      createPremadeOptions()
    )

    expect(lines).toEqual(['蓝方开黑：[RIP董事长#81406, Lee Player#002] [深海泰坦, 暴走萝莉]'])
  })

  it('omits side names for premade lines without standard team identifiers', () => {
    const mainContext = createMainContext()
    mainContext.ongoingGame.state.teams = {
      'CHERRY-1': ['p1', 'p2', 'p3', 'p4']
    }

    const lines = buildPremadePresetLines(
      {
        target: 'friendly',
        mainContext
      },
      createPremadeOptions()
    )

    expect(lines).toEqual(['开黑：[无极剑圣, 盲僧] [深海泰坦, 暴走萝莉]'])
  })

  it('reports standard teams without selected premade groups', () => {
    const mainContext = createMainContext()
    mainContext.ongoingGame.state.teams = {
      'TEAM-100': ['p1', 'p2'],
      'TEAM-200': ['p3', 'p4']
    }
    mainContext.ongoingGame.state.mergedPremadeTeamMap = {
      p1: 1,
      p2: 1
    }

    const lines = buildPremadePresetLines(
      {
        target: 'all',
        mainContext
      },
      createPremadeOptions()
    )

    expect(lines).toEqual(['蓝方开黑：[无极剑圣, 盲僧]', '红方无开黑'])
  })

  it('reports non-standard teams without selected premade groups without side labels', () => {
    const mainContext = createMainContext()
    mainContext.ongoingGame.state.teams = {
      'CHERRY-1': ['p1', 'p2', 'p3', 'p4']
    }
    mainContext.ongoingGame.state.mergedPremadeTeamMap = {}

    const lines = buildPremadePresetLines(
      {
        target: 'friendly',
        mainContext
      },
      createPremadeOptions()
    )

    expect(lines).toEqual(['无开黑小队'])
  })
})
