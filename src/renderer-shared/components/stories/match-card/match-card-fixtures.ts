import type {
  LcuOrSgpGameDetails,
  LcuOrSgpGameSummary,
  SgpGameDetails
} from '@shared/data-adapter/wrapper'
import lcuRankedGameRaw from '@shared/test-fixtures/api/snapshots/2026-05-16-tencent-hn10/lcu/match-history/games/q_420.json?raw'
import lcuArenaGameRaw from '@shared/test-fixtures/api/snapshots/2026-05-16-tencent-hn10/lcu/match-history/games/q_1700.json?raw'
import lcuRankedTimelineRaw from '@shared/test-fixtures/api/snapshots/2026-05-16-tencent-hn10/lcu/match-history/timelines/q_420.json?raw'
import lcuArenaTimelineRaw from '@shared/test-fixtures/api/snapshots/2026-05-16-tencent-hn10/lcu/match-history/timelines/q_1700.json?raw'
import sgpArenaRaw from '@shared/test-fixtures/api/snapshots/2026-05-16-tencent-hn10/sgp/match-history-query/q_1700.json?raw'
import type { Game, GameTimeline, TimelineFrame } from '@shared/types/league-client/match-history'
import type {
  ChampionStats,
  DamageStats,
  DetailedGameEvent,
  DetailedParticipantFrame,
  DetailedTimelineFrame,
  SgpGameDetailsLol,
  SgpGameSummaryLol,
  SgpMatchHistoryLol
} from '@shared/types/sgp/match-history'

interface StoryMatchCardFixture {
  summary: LcuOrSgpGameSummary
  details: LcuOrSgpGameDetails
  puuid: string
}

interface StoryGameResourceSamples {
  championIds: number[]
  itemIds: number[]
  spellIds: number[]
  perkIds: number[]
  perkstyleIds: number[]
  augmentIds: number[]
}

function readFixture<T>(raw: string): T {
  return JSON.parse(raw) as T
}

function uniqueNumbers(values: Iterable<number | null | undefined>, limit: number) {
  const result: number[] = []
  const seen = new Set<number>()

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue
    }

    seen.add(value)
    result.push(value)

    if (result.length >= limit) {
      break
    }
  }

  return result
}

function lcuFixture(game: Game, timeline: GameTimeline): StoryMatchCardFixture {
  const participantId = game.participants[0]?.participantId
  const identity = game.participantIdentities.find((item) => item.participantId === participantId)

  return {
    summary: {
      gameId: game.gameId,
      source: 'lcu',
      data: game
    },
    details: {
      gameId: game.gameId,
      source: 'lcu',
      data: timeline
    },
    puuid: identity?.player.puuid || ''
  }
}

function createChampionStats(frame: TimelineFrame['participantFrames'][string]): ChampionStats {
  const level = frame.level || 1
  const totalGold = frame.totalGold || 0

  return {
    abilityHaste: Math.round(level * 1.5),
    abilityPower: Math.round(totalGold / 120),
    armor: 30 + level * 4,
    armorPen: 0,
    armorPenPercent: 0,
    attackDamage: 55 + level * 3,
    attackSpeed: 70 + level * 2,
    bonusArmorPenPercent: 0,
    bonusMagicPenPercent: 0,
    ccReduction: 0,
    cooldownReduction: Math.round(level * 0.5),
    health: 500 + level * 85,
    healthMax: 650 + level * 100,
    healthRegen: 4 + level,
    lifesteal: 0,
    magicPen: 0,
    magicPenPercent: 0,
    magicResist: 28 + level * 2,
    movementSpeed: 335,
    omnivamp: 0,
    physicalVamp: 0,
    power: 250 + level * 20,
    powerMax: 320 + level * 28,
    powerRegen: 8 + level,
    spellVamp: 0
  }
}

function createDamageStats(frame: TimelineFrame['participantFrames'][string]): DamageStats {
  const totalGold = frame.totalGold || 0
  const totalDamageDoneToChampions = Math.round(totalGold * 1.35)
  const totalDamageTaken = Math.round(totalGold * 0.85)

  return {
    magicDamageDone: Math.round(totalGold * 1.1),
    magicDamageDoneToChampions: Math.round(totalDamageDoneToChampions * 0.35),
    magicDamageTaken: Math.round(totalDamageTaken * 0.35),
    physicalDamageDone: Math.round(totalGold * 1.8),
    physicalDamageDoneToChampions: Math.round(totalDamageDoneToChampions * 0.55),
    physicalDamageTaken: Math.round(totalDamageTaken * 0.55),
    totalDamageDone: Math.round(totalGold * 3.2),
    totalDamageDoneToChampions,
    totalDamageTaken,
    trueDamageDone: Math.round(totalGold * 0.15),
    trueDamageDoneToChampions: Math.round(totalDamageDoneToChampions * 0.1),
    trueDamageTaken: Math.round(totalDamageTaken * 0.1)
  }
}

function createDetailedFrame(frame: TimelineFrame): DetailedTimelineFrame {
  return {
    timestamp: frame.timestamp,
    events: frame.events as unknown as DetailedGameEvent[],
    participantFrames: Object.fromEntries(
      Object.entries(frame.participantFrames).map(([participantId, participantFrame]) => [
        participantId,
        {
          participantId: participantFrame.participantId,
          currentGold: participantFrame.currentGold,
          totalGold: participantFrame.totalGold,
          goldPerSecond: 0,
          level: participantFrame.level,
          xp: participantFrame.xp,
          minionsKilled: participantFrame.minionsKilled,
          jungleMinionsKilled: participantFrame.jungleMinionsKilled,
          position: participantFrame.position,
          timeEnemySpentControlled: 0,
          championStats: createChampionStats(participantFrame),
          damageStats: createDamageStats(participantFrame)
        } satisfies DetailedParticipantFrame
      ])
    )
  }
}

function sgpFixture(game: SgpGameSummaryLol, timeline: GameTimeline): StoryMatchCardFixture {
  const details: SgpGameDetails = {
    gameId: game.json.gameId,
    source: 'sgp',
    data: {
      metadata: game.metadata,
      json: {
        endOfGameResult: game.json.endOfGameResult,
        frameInterval: 60000,
        frames: timeline.frames.map(createDetailedFrame),
        gameId: game.json.gameId,
        participants: game.json.participants.map((participant) => ({
          participantId: participant.participantId,
          puuid: participant.puuid
        }))
      }
    } satisfies SgpGameDetailsLol
  }

  return {
    summary: {
      gameId: game.json.gameId,
      source: 'sgp',
      data: game
    },
    details,
    puuid: game.json.participants[0]?.puuid || ''
  }
}

const lcuRankedGame = readFixture<Game>(lcuRankedGameRaw)
const lcuRankedTimeline = readFixture<GameTimeline>(lcuRankedTimelineRaw)
const lcuArenaGame = readFixture<Game>(lcuArenaGameRaw)
const lcuArenaTimeline = readFixture<GameTimeline>(lcuArenaTimelineRaw)
const sgpArenaGame = readFixture<SgpMatchHistoryLol>(sgpArenaRaw).games[0]

function collectStoryGameResourceSamples(): StoryGameResourceSamples {
  const lcuParticipants = [lcuRankedGame, lcuArenaGame].flatMap((game) => game.participants)
  const sgpParticipants = sgpArenaGame.json.participants

  return {
    championIds: uniqueNumbers(
      [
        ...lcuParticipants.map((participant) => participant.championId),
        ...sgpParticipants.map((p) => p.championId)
      ],
      6
    ),
    itemIds: uniqueNumbers(
      [
        ...lcuParticipants.flatMap((participant) => [
          participant.stats.item0,
          participant.stats.item1,
          participant.stats.item2,
          participant.stats.item3,
          participant.stats.item4,
          participant.stats.item5,
          participant.stats.item6,
          participant.stats.roleBoundItem
        ]),
        ...sgpParticipants.flatMap((participant) => [
          participant.item0,
          participant.item1,
          participant.item2,
          participant.item3,
          participant.item4,
          participant.item5,
          participant.item6,
          participant.roleBoundItem
        ])
      ],
      6
    ),
    spellIds: uniqueNumbers(
      [
        ...lcuParticipants.flatMap((participant) => [participant.spell1Id, participant.spell2Id]),
        ...sgpParticipants.flatMap((participant) => [participant.spell1Id, participant.spell2Id])
      ],
      6
    ),
    perkIds: uniqueNumbers(
      [
        ...lcuParticipants.flatMap((participant) => [
          participant.stats.perk0,
          participant.stats.perk1,
          participant.stats.perk2,
          participant.stats.perk3,
          participant.stats.perk4,
          participant.stats.perk5
        ]),
        ...sgpParticipants.flatMap((participant) =>
          participant.perks.styles.flatMap((style) =>
            style.selections.map((selection) => selection.perk)
          )
        )
      ],
      6
    ),
    perkstyleIds: uniqueNumbers(
      [
        ...lcuParticipants.flatMap((participant) => [
          participant.stats.perkPrimaryStyle,
          participant.stats.perkSubStyle
        ]),
        ...sgpParticipants.flatMap((participant) =>
          participant.perks.styles.map((style) => style.style)
        )
      ],
      5
    ),
    augmentIds: uniqueNumbers(
      sgpParticipants.flatMap((participant) => [
        participant.playerAugment1,
        participant.playerAugment2,
        participant.playerAugment3,
        participant.playerAugment4,
        participant.playerAugment5,
        participant.playerAugment6
      ]),
      6
    )
  }
}

export const storyLcuRankedMatchCard = lcuFixture(lcuRankedGame, lcuRankedTimeline)
export const storyLcuArenaMatchCard = lcuFixture(lcuArenaGame, lcuArenaTimeline)
export const storySgpArenaMatchCard = sgpFixture(sgpArenaGame, lcuArenaTimeline)
export const storyGameResourceSamples = collectStoryGameResourceSamples()
