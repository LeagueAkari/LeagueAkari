import { EMPTY_PUUID } from '@shared/constants/common'
import { ChampSelectSession, ChampSelectTeam } from '@shared/types/league-client/champ-select'
import { describe, expect, it, vi } from 'vitest'

import {
  ChampSelectHandoffSnapshot,
  ChampSelectHandoffSnapshotSchema,
  buildChampSelectHandoffSnapshot
} from './champ-select-handoff'
import { OngoingGameChampSelectHandoffController } from './champ-select-handoff-controller'
import { collectVisibleChampSelectMembers } from './champ-select-members'
import type { OngoingGameMainContext } from './context'

vi.mock('@main/native', () => ({
  magic: (value: string) => {
    if (value === '906167b8-d673-63a8-d1dc-3d469bc442b2') {
      return '11111111-2222-3333-4444-555555555555'
    }

    return ''
  }
}))

const SNAPSHOT_STORAGE_KEY = 'champSelectHandoffSnapshot'

function createMember(overrides: Partial<ChampSelectTeam>): ChampSelectTeam {
  return {
    assignedPosition: '',
    cellId: 0,
    championId: 0,
    championPickIntent: 0,
    gameName: '',
    internalName: '',
    isAutofilled: false,
    isHumanoid: true,
    nameVisibilityType: 'VISIBLE',
    obfuscatedPuuid: '',
    obfuscatedSummonerId: 0,
    pickMode: 0,
    pickTurn: 0,
    playerAlias: '',
    playerType: '',
    puuid: '',
    selectedSkinId: 0,
    spell1Id: 0,
    spell2Id: 0,
    summonerId: 0,
    tagLine: '',
    team: 100,
    wardSkinId: 0,
    ...overrides
  }
}

function createSession(overrides: Partial<ChampSelectSession>): ChampSelectSession {
  return {
    actions: [],
    allowBattleBoost: false,
    allowDuplicatePicks: false,
    allowLockedEvents: false,
    allowPlayerPickSameChampion: false,
    allowRerolling: false,
    allowSkinSelection: false,
    allowSubsetChampionPicks: false,
    benchChampions: [],
    benchEnabled: false,
    boostableSkinCount: 0,
    counter: 0,
    disallowBanningTeammateHoveredChampions: false,
    gameId: 0,
    bans: { myTeamBans: [], numBans: 0, theirTeamBans: [] },
    chatDetails: {
      mucJwtDto: { channelClaim: '', domain: '', jwt: '', targetRegion: '' },
      multiUserChatId: '',
      multiUserChatPassword: ''
    },
    hasSimultaneousBans: false,
    hasSimultaneousPicks: false,
    id: '',
    isCustomGame: false,
    isLegacyChampSelect: false,
    isSpectating: false,
    localPlayerCellId: 0,
    lockedEventIndex: 0,
    myTeam: [],
    pickOrderSwaps: [],
    positionSwaps: [],
    queueId: 0,
    rerollsRemaining: 0,
    showQuitButton: false,
    skipChampionSelect: false,
    theirTeam: [],
    timer: {
      adjustedTimeLeftInPhase: 0,
      internalNowInEpochMs: 0,
      isInfinite: false,
      phase: 'PLANNING',
      totalTimeInPhase: 0
    },
    trades: [],
    ...overrides
  }
}

function createContext(options: {
  deobfuscation?: boolean
  persistedSnapshot?: unknown
  session?: ChampSelectSession | null
}) {
  const state = {
    draft: null,
    queryStage: {
      phase: 'champ-select',
      gameInfo: {
        queueId: 420,
        queueType: 'CLASSIC',
        gameMode: 'CLASSIC',
        gameId: options.session?.gameId ?? 12345
      }
    },
    champSelectHandoffSnapshot: null as ChampSelectHandoffSnapshot | null,
    setChampSelectHandoffSnapshot: vi.fn((value: ChampSelectHandoffSnapshot | null) => {
      state.champSelectHandoffSnapshot = value
    })
  }

  const storage = {
    get: vi.fn(async () => options.persistedSnapshot),
    save: vi.fn(async () => {}),
    remove: vi.fn(async () => {})
  }

  const context = {
    logger: {
      warn: vi.fn()
    },
    settingService: {
      _getFromStorage: storage.get,
      _saveToStorage: storage.save,
      _removeFromStorage: storage.remove
    },
    state,
    remoteConfig: {
      state: {
        ongoingGameConfig: {
          spotlight: {
            deobfuscation: options.deobfuscation ?? true
          }
        }
      }
    },
    leagueClient: {
      data: {
        champSelect: {
          session: options.session ?? null
        }
      }
    },
    mobxUtils: {
      reaction: vi.fn((selector, effect, reactionOptions) => {
        const value = selector()
        if (reactionOptions?.fireImmediately) {
          effect(value)
        }
      })
    }
  } as unknown as OngoingGameMainContext

  return { context, state, storage }
}

describe('buildChampSelectHandoffSnapshot', () => {
  it('records visible players with champion, position, and spell data', () => {
    const hiddenPuuid = '11111111-2222-3333-4444-555555555555'
    const session = createSession({
      gameId: 12345,
      myTeam: [
        createMember({
          puuid: 'p1',
          championId: 1,
          championPickIntent: 11,
          assignedPosition: 'top',
          spell1Id: 4,
          spell2Id: 14,
          team: 100
        }),
        createMember({
          puuid: EMPTY_PUUID,
          championId: 2,
          assignedPosition: 'jungle',
          team: 100
        })
      ],
      theirTeam: [
        createMember({
          nameVisibilityType: 'HIDDEN',
          obfuscatedPuuid: '906167b8-d673-63a8-d1dc-3d469bc442b2',
          championId: 0,
          championPickIntent: 99,
          assignedPosition: 'middle',
          spell1Id: 7,
          spell2Id: 4,
          team: 200
        })
      ]
    })

    expect(
      buildChampSelectHandoffSnapshot(session, {
        spotlight: {
          deobfuscation: true
        }
      })
    ).toEqual({
      gameId: 12345,
      teams: {
        'TEAM-100': ['p1'],
        'TEAM-200': [hiddenPuuid]
      },
      players: {
        p1: {
          championId: 1,
          position: 'TOP',
          spell1Id: 4,
          spell2Id: 14
        },
        [hiddenPuuid]: {
          championId: 99,
          position: 'MIDDLE',
          spell1Id: 7,
          spell2Id: 4
        }
      }
    })
  })

  it('returns null when deobfuscation is disabled', () => {
    const session = createSession({
      gameId: 12345,
      myTeam: [createMember({ puuid: 'p1', championId: 1, team: 100 })]
    })

    expect(
      buildChampSelectHandoffSnapshot(session, {
        spotlight: {
          deobfuscation: false
        }
      })
    ).toBeNull()
  })

  it('collects visible champ-select members for other controllers', () => {
    const session = createSession({
      gameId: 12345,
      myTeam: [
        createMember({
          puuid: 'p1',
          championId: 1,
          assignedPosition: 'top',
          spell1Id: 4,
          spell2Id: 14,
          team: 100
        })
      ],
      theirTeam: [
        createMember({
          puuid: 'p2',
          championPickIntent: 99,
          assignedPosition: 'middle',
          spell1Id: 7,
          spell2Id: 4,
          team: 200
        })
      ]
    })

    expect(
      collectVisibleChampSelectMembers(session, {
        spotlight: {
          deobfuscation: false
        }
      })
    ).toEqual([
      {
        puuid: 'p1',
        teamIdentifier: 'TEAM-100',
        championId: 1,
        position: 'TOP',
        spell1Id: 4,
        spell2Id: 14
      },
      {
        puuid: 'p2',
        teamIdentifier: 'TEAM-200',
        championId: 99,
        position: 'MIDDLE',
        spell1Id: 7,
        spell2Id: 4
      }
    ])
  })
})

describe('ChampSelectHandoffSnapshotSchema', () => {
  it('validates persisted snapshot shape', () => {
    expect(
      ChampSelectHandoffSnapshotSchema.safeParse({
        gameId: 12345,
        teams: {
          'TEAM-100': ['p1']
        },
        players: {
          p1: {
            championId: 1,
            position: 'TOP',
            spell1Id: 4,
            spell2Id: 14
          }
        }
      }).success
    ).toBe(true)

    expect(
      ChampSelectHandoffSnapshotSchema.safeParse({
        gameId: 12345,
        teams: {
          'TEAM-100': ['p1']
        },
        players: {
          p1: {
            championId: '1',
            position: 'TOP',
            spell1Id: 4,
            spell2Id: 14
          }
        }
      }).success
    ).toBe(false)
  })
})

describe('OngoingGameChampSelectHandoffController', () => {
  it('restores a persisted snapshot when deobfuscation is enabled', async () => {
    const snapshot: ChampSelectHandoffSnapshot = {
      gameId: 12345,
      teams: {
        'TEAM-100': ['p1']
      },
      players: {
        p1: {
          championId: 1,
          position: 'TOP',
          spell1Id: 4,
          spell2Id: 14
        }
      }
    }
    const { context, state, storage } = createContext({
      persistedSnapshot: snapshot,
      deobfuscation: true
    })

    await new OngoingGameChampSelectHandoffController(context).init()

    expect(storage.get).toHaveBeenCalledWith(SNAPSHOT_STORAGE_KEY)
    expect(storage.remove).not.toHaveBeenCalled()
    expect(state.champSelectHandoffSnapshot).toEqual(snapshot)
  })

  it('clears the persisted snapshot when deobfuscation is disabled', async () => {
    const { context, storage } = createContext({
      deobfuscation: false
    })

    await new OngoingGameChampSelectHandoffController(context).init()

    expect(storage.get).not.toHaveBeenCalled()
    expect(storage.remove).toHaveBeenCalledWith(SNAPSHOT_STORAGE_KEY)
  })

  it('records and persists the current champ-select snapshot', () => {
    const session = createSession({
      gameId: 12345,
      myTeam: [
        createMember({
          puuid: 'p1',
          championId: 1,
          assignedPosition: 'top',
          spell1Id: 4,
          spell2Id: 14,
          team: 100
        })
      ]
    })
    const { context, state, storage } = createContext({
      session,
      deobfuscation: true
    })

    new OngoingGameChampSelectHandoffController(context).watch()

    const snapshot: ChampSelectHandoffSnapshot = {
      gameId: 12345,
      teams: {
        'TEAM-100': ['p1']
      },
      players: {
        p1: {
          championId: 1,
          position: 'TOP',
          spell1Id: 4,
          spell2Id: 14
        }
      }
    }

    expect(state.champSelectHandoffSnapshot).toEqual(snapshot)
    expect(storage.save).toHaveBeenCalledWith(SNAPSHOT_STORAGE_KEY, snapshot)
  })
})
