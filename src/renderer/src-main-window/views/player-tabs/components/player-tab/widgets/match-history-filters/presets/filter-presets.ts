import { CombinatorNode, NonNullCombinatorArgNodeRef, nodeArg, paramArg } from '../combinator-nodes'
import {
  MatchHistoryFilterState,
  ROOT_ID,
  STATE_VERSION,
  SimpleSummonerResult
} from '../filter-state'

export const MATCH_HISTORY_FILTER_PRESET_IDS = {
  cleanMatchSamples: 'clean-match-samples',
  strongSelfPerformance: 'strong-self-performance',
  kiwiJayceSlowAndSteady: 'kiwi-jayce-slow-and-steady'
} as const

export const MATCH_HISTORY_FILTER_PRESET_ASSETS = {
  kiwiJayceSlowAndSteady: {
    queueId: 2400,
    championId: 126,
    augmentId: 1250
  }
} as const

export const createCleanMatchSamplesPreset = (
  cachedSummoners: Record<string, SimpleSummonerResult> = {}
): MatchHistoryFilterState => {
  const rootId = ROOT_ID
  const rootAndId = 'preset-clean-match-samples-root-and'
  const matchedGameId = 'preset-clean-match-samples-matched-game'
  const durationId = 'preset-clean-match-samples-duration'
  const notDirtyId = 'preset-clean-match-samples-not-dirty'
  const dirtyOrId = 'preset-clean-match-samples-dirty-or'
  const abortId = 'preset-clean-match-samples-abort'
  const remakeId = 'preset-clean-match-samples-remake'
  const pveId = 'preset-clean-match-samples-pve'

  const nodeMap: Record<string, CombinatorNode> = {
    [rootId]: {
      id: rootId,
      type: 'game',
      args: [nodeArg(rootAndId)],
      parentId: null
    },
    [rootAndId]: {
      id: rootAndId,
      type: 'and',
      args: [
        nodeArg(matchedGameId) as NonNullCombinatorArgNodeRef,
        nodeArg(durationId) as NonNullCombinatorArgNodeRef,
        nodeArg(notDirtyId) as NonNullCombinatorArgNodeRef
      ],
      parentId: rootId,
      argDeleteStrategy: 'remove-from-array'
    },
    [matchedGameId]: {
      id: matchedGameId,
      type: 'isMatchedGame',
      args: [],
      parentId: rootAndId
    },
    [durationId]: {
      id: durationId,
      type: 'durationBetween',
      args: [paramArg(600), paramArg(999999)],
      parentId: rootAndId
    },
    [notDirtyId]: {
      id: notDirtyId,
      type: 'not',
      args: [nodeArg(dirtyOrId)],
      parentId: rootAndId
    },
    [dirtyOrId]: {
      id: dirtyOrId,
      type: 'or',
      args: [
        nodeArg(abortId) as NonNullCombinatorArgNodeRef,
        nodeArg(remakeId) as NonNullCombinatorArgNodeRef,
        nodeArg(pveId) as NonNullCombinatorArgNodeRef
      ],
      parentId: notDirtyId,
      argDeleteStrategy: 'remove-from-array'
    },
    [abortId]: {
      id: abortId,
      type: 'isAbort',
      args: [],
      parentId: dirtyOrId
    },
    [remakeId]: {
      id: remakeId,
      type: 'isRemake',
      args: [],
      parentId: dirtyOrId
    },
    [pveId]: {
      id: pveId,
      type: 'isPveGame',
      args: [],
      parentId: dirtyOrId
    }
  }

  return {
    version: STATE_VERSION,
    rootId,
    nodeMap,
    cachedSummoners
  }
}

export const createStrongSelfPerformancePreset = (
  currentPuuid: string,
  cachedSummoners: Record<string, SimpleSummonerResult> = {}
): MatchHistoryFilterState => {
  const rootId = ROOT_ID
  const rootAndId = 'preset-strong-self-performance-root-and'
  const matchedGameId = 'preset-strong-self-performance-matched-game'
  const durationId = 'preset-strong-self-performance-duration'
  const notDirtyId = 'preset-strong-self-performance-not-dirty'
  const dirtyOrId = 'preset-strong-self-performance-dirty-or'
  const abortId = 'preset-strong-self-performance-abort'
  const remakeId = 'preset-strong-self-performance-remake'
  const pveId = 'preset-strong-self-performance-pve'
  const playerId = 'preset-strong-self-performance-player'
  const playerAndId = 'preset-strong-self-performance-player-and'
  const kdaId = 'preset-strong-self-performance-kda'
  const deathsId = 'preset-strong-self-performance-deaths'
  const contributionOrId = 'preset-strong-self-performance-contribution-or'
  const winId = 'preset-strong-self-performance-win'
  const killsId = 'preset-strong-self-performance-kills'
  const assistsId = 'preset-strong-self-performance-assists'
  const goldId = 'preset-strong-self-performance-gold'

  const nodeMap: Record<string, CombinatorNode> = {
    [rootId]: {
      id: rootId,
      type: 'game',
      args: [nodeArg(rootAndId)],
      parentId: null
    },
    [rootAndId]: {
      id: rootAndId,
      type: 'and',
      args: [
        nodeArg(matchedGameId) as NonNullCombinatorArgNodeRef,
        nodeArg(durationId) as NonNullCombinatorArgNodeRef,
        nodeArg(notDirtyId) as NonNullCombinatorArgNodeRef,
        nodeArg(playerId) as NonNullCombinatorArgNodeRef
      ],
      parentId: rootId,
      argDeleteStrategy: 'remove-from-array'
    },
    [matchedGameId]: {
      id: matchedGameId,
      type: 'isMatchedGame',
      args: [],
      parentId: rootAndId
    },
    [durationId]: {
      id: durationId,
      type: 'durationBetween',
      args: [paramArg(600), paramArg(999999)],
      parentId: rootAndId
    },
    [notDirtyId]: {
      id: notDirtyId,
      type: 'not',
      args: [nodeArg(dirtyOrId)],
      parentId: rootAndId
    },
    [dirtyOrId]: {
      id: dirtyOrId,
      type: 'or',
      args: [
        nodeArg(abortId) as NonNullCombinatorArgNodeRef,
        nodeArg(remakeId) as NonNullCombinatorArgNodeRef,
        nodeArg(pveId) as NonNullCombinatorArgNodeRef
      ],
      parentId: notDirtyId,
      argDeleteStrategy: 'remove-from-array'
    },
    [abortId]: {
      id: abortId,
      type: 'isAbort',
      args: [],
      parentId: dirtyOrId
    },
    [remakeId]: {
      id: remakeId,
      type: 'isRemake',
      args: [],
      parentId: dirtyOrId
    },
    [pveId]: {
      id: pveId,
      type: 'isPveGame',
      args: [],
      parentId: dirtyOrId
    },
    [playerId]: {
      id: playerId,
      type: 'player',
      args: [paramArg(currentPuuid), nodeArg(playerAndId)],
      parentId: rootAndId
    },
    [playerAndId]: {
      id: playerAndId,
      type: 'and',
      args: [
        nodeArg(kdaId) as NonNullCombinatorArgNodeRef,
        nodeArg(deathsId) as NonNullCombinatorArgNodeRef,
        nodeArg(contributionOrId) as NonNullCombinatorArgNodeRef
      ],
      parentId: playerId,
      argDeleteStrategy: 'remove-from-array'
    },
    [kdaId]: {
      id: kdaId,
      type: 'kdaBetween',
      args: [paramArg(4), paramArg(999)],
      parentId: playerAndId
    },
    [deathsId]: {
      id: deathsId,
      type: 'deathsBetween',
      args: [paramArg(0), paramArg(4)],
      parentId: playerAndId
    },
    [contributionOrId]: {
      id: contributionOrId,
      type: 'or',
      args: [
        nodeArg(winId) as NonNullCombinatorArgNodeRef,
        nodeArg(killsId) as NonNullCombinatorArgNodeRef,
        nodeArg(assistsId) as NonNullCombinatorArgNodeRef,
        nodeArg(goldId) as NonNullCombinatorArgNodeRef
      ],
      parentId: playerAndId,
      argDeleteStrategy: 'remove-from-array'
    },
    [winId]: {
      id: winId,
      type: 'isWin',
      args: [],
      parentId: contributionOrId
    },
    [killsId]: {
      id: killsId,
      type: 'killsBetween',
      args: [paramArg(8), paramArg(999)],
      parentId: contributionOrId
    },
    [assistsId]: {
      id: assistsId,
      type: 'assistsBetween',
      args: [paramArg(12), paramArg(999)],
      parentId: contributionOrId
    },
    [goldId]: {
      id: goldId,
      type: 'goldBetween',
      args: [paramArg(12000), paramArg(999999)],
      parentId: contributionOrId
    }
  }

  return {
    version: STATE_VERSION,
    rootId,
    nodeMap,
    cachedSummoners
  }
}

export const createKiwiJayceSlowAndSteadyPreset = (
  currentPuuid: string,
  cachedSummoners: Record<string, SimpleSummonerResult> = {}
): MatchHistoryFilterState => {
  const rootId = ROOT_ID
  const rootAndId = 'preset-kiwi-jayce-slow-and-steady-root-and'
  const queueId = 'preset-kiwi-jayce-slow-and-steady-queue'
  const enemiesId = 'preset-kiwi-jayce-slow-and-steady-enemies'
  const anyoneId = 'preset-kiwi-jayce-slow-and-steady-anyone'
  const participantAndId = 'preset-kiwi-jayce-slow-and-steady-participant-and'
  const championId = 'preset-kiwi-jayce-slow-and-steady-champion'
  const augmentId = 'preset-kiwi-jayce-slow-and-steady-augment'

  const nodeMap: Record<string, CombinatorNode> = {
    [rootId]: {
      id: rootId,
      type: 'game',
      args: [nodeArg(rootAndId)],
      parentId: null
    },
    [rootAndId]: {
      id: rootAndId,
      type: 'and',
      args: [
        nodeArg(queueId) as NonNullCombinatorArgNodeRef,
        nodeArg(enemiesId) as NonNullCombinatorArgNodeRef
      ],
      parentId: rootId,
      argDeleteStrategy: 'remove-from-array'
    },
    [queueId]: {
      id: queueId,
      type: 'isQueue',
      args: [paramArg(MATCH_HISTORY_FILTER_PRESET_ASSETS.kiwiJayceSlowAndSteady.queueId)],
      parentId: rootAndId
    },
    [enemiesId]: {
      id: enemiesId,
      type: 'enemies',
      args: [paramArg(currentPuuid), nodeArg(anyoneId)],
      parentId: rootAndId
    },
    [anyoneId]: {
      id: anyoneId,
      type: 'anyone',
      args: [nodeArg(participantAndId)],
      parentId: enemiesId
    },
    [participantAndId]: {
      id: participantAndId,
      type: 'and',
      args: [
        nodeArg(championId) as NonNullCombinatorArgNodeRef,
        nodeArg(augmentId) as NonNullCombinatorArgNodeRef
      ],
      parentId: anyoneId,
      argDeleteStrategy: 'remove-from-array'
    },
    [championId]: {
      id: championId,
      type: 'isChampion',
      args: [paramArg(MATCH_HISTORY_FILTER_PRESET_ASSETS.kiwiJayceSlowAndSteady.championId)],
      parentId: participantAndId
    },
    [augmentId]: {
      id: augmentId,
      type: 'hasAugment',
      args: [
        paramArg(MATCH_HISTORY_FILTER_PRESET_ASSETS.kiwiJayceSlowAndSteady.augmentId),
        paramArg(-1)
      ],
      parentId: participantAndId
    }
  }

  return {
    version: STATE_VERSION,
    rootId,
    nodeMap,
    cachedSummoners
  }
}
