import LcuImage from '@renderer-shared/components/LcuImage.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { championIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import type { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { formatI18nOrdinal } from '@shared/i18n'
import {
  ENCOUNTERED_GAME_QUERY_DEFAULT_PAGE_SIZE,
  type EncounteredGame
} from '@shared/shards/saved-player'
import dayjs from 'dayjs'

import type { PlayerCardTagContext, PlayerCardTagDefinition } from '../types'

interface EncounteredGameStats {
  gameId: number
  myChampionId: number
  opponentChampionId: number
  myPosition?: string | null
  opponentPosition?: string | null
  selfWinResult: string
  opponentWinResult: string
  selfKda: { k: number; d: number; a: number }
  opponentKda: { k: number; d: number; a: number }
  isSameTeam: boolean
  date: number
  mode: string
  myPlacement?: number | null
  opponentPlacement?: number | null
}

type PlayerCardEncounteredGame = Omit<EncounteredGame, 'id'> & {
  id?: number
  gameStats: EncounteredGameStats | null
  source: 'saved' | 'recent'
}

interface PlayerCardMergedSavedInfo {
  lastMetAt: Date | null
  encounteredGames: {
    data: PlayerCardEncounteredGame[]
    total: number
  }
}

function getEncounteredGameStats(
  game: LcuOrSgpGameSummary,
  selfPuuid: string,
  puuid: string
): EncounteredGameStats | null {
  const basicInfo = toBasicInfo(game)
  const participants = toParticipants(game, basicInfo)

  const selfParticipant = participants.find((p) => p.puuid === selfPuuid)
  const opponentParticipant = participants.find((p) => p.puuid === puuid)

  if (!selfParticipant || !opponentParticipant) {
    return null
  }

  const isSameTeam = basicInfo.isCherrySubteam
    ? selfParticipant.playerSubteamId === opponentParticipant.playerSubteamId
    : selfParticipant.teamId === opponentParticipant.teamId

  return {
    gameId: game.gameId,
    myChampionId: selfParticipant.championId,
    opponentChampionId: opponentParticipant.championId,
    myPosition: selfParticipant.position,
    opponentPosition: opponentParticipant.position,
    selfWinResult: selfParticipant.winResult,
    opponentWinResult: opponentParticipant.winResult,
    selfKda: {
      k: selfParticipant.kills,
      d: selfParticipant.deaths,
      a: selfParticipant.assists
    },
    opponentKda: {
      k: opponentParticipant.kills,
      d: opponentParticipant.deaths,
      a: opponentParticipant.assists
    },
    isSameTeam,
    date: basicInfo.gameCreation,
    mode: basicInfo.gameMode,
    myPlacement: selfParticipant.subteamPlacement,
    opponentPlacement: opponentParticipant.subteamPlacement
  }
}

function getEncounteredGameTimestamp(item: PlayerCardEncounteredGame) {
  return item.gameStats?.date ?? dayjs(item.updateAt).valueOf()
}

function mergeSavedInfoWithRecentGames(ctx: PlayerCardTagContext): PlayerCardMergedSavedInfo {
  const gamesByGameId = new Map<number, PlayerCardEncounteredGame>()

  for (const record of ctx.savedInfo?.encounteredGames.data ?? []) {
    const game = ctx.cachedGames[record.gameId]

    gamesByGameId.set(record.gameId, {
      ...record,
      gameStats: game ? getEncounteredGameStats(game, record.selfPuuid, record.puuid) : null,
      source: 'saved'
    })
  }

  if (ctx.selfPuuid) {
    for (const matchHistory of Object.values(ctx.matchHistory ?? {})) {
      for (const matchHistoryGame of matchHistory.data) {
        if (gamesByGameId.has(matchHistoryGame.gameId)) {
          continue
        }

        const game = ctx.cachedGames[matchHistoryGame.gameId] ?? matchHistoryGame
        let gameStats: EncounteredGameStats | null = null

        try {
          gameStats = getEncounteredGameStats(game, ctx.selfPuuid, ctx.puuid)
        } catch {
          continue
        }

        if (!gameStats) {
          continue
        }

        gamesByGameId.set(matchHistoryGame.gameId, {
          gameId: matchHistoryGame.gameId,
          puuid: ctx.puuid,
          selfPuuid: ctx.selfPuuid,
          region: '',
          rsoPlatformId: '',
          updateAt: new Date(gameStats.date),
          queueType: '',
          championId: gameStats.opponentChampionId,
          gameStats,
          source: 'recent'
        })
      }
    }
  }

  const encounteredGames = Array.from(gamesByGameId.values())
    .sort((a, b) => getEncounteredGameTimestamp(b) - getEncounteredGameTimestamp(a))
    .slice(0, ENCOUNTERED_GAME_QUERY_DEFAULT_PAGE_SIZE)

  const lastMetTimestamp = encounteredGames[0]
    ? getEncounteredGameTimestamp(encounteredGames[0])
    : null

  return {
    lastMetAt:
      lastMetTimestamp === null ? (ctx.savedInfo?.lastMetAt ?? null) : new Date(lastMetTimestamp),
    encounteredGames: {
      data: encounteredGames,
      total: encounteredGames.length
    }
  }
}

function getMetLabelKey(ctx: PlayerCardTagContext, mergedSavedInfo: PlayerCardMergedSavedInfo) {
  const latestEncounteredGame = mergedSavedInfo.encounteredGames.data[0]

  if (!ctx.selfPuuid || !latestEncounteredGame?.gameStats) {
    return 'ongoingGame.playerCard.met'
  }

  const latestGameIdOf = (puuid: string) => {
    let latest: { gameId: number; gameCreation: number } | null = null

    for (const game of ctx.matchHistory[puuid]?.data ?? []) {
      try {
        const basicInfo = toBasicInfo(game)

        if (!latest || basicInfo.gameCreation > latest.gameCreation) {
          latest = {
            gameId: game.gameId,
            gameCreation: basicInfo.gameCreation
          }
        }
      } catch {
        continue
      }
    }

    return latest?.gameId ?? null
  }

  if (
    latestGameIdOf(ctx.selfPuuid) !== latestEncounteredGame.gameId ||
    latestGameIdOf(ctx.puuid) !== latestEncounteredGame.gameId
  ) {
    return 'ongoingGame.playerCard.met'
  }

  return latestEncounteredGame.gameStats.isSameTeam
    ? 'ongoingGame.playerCard.metLastGameTeammate'
    : 'ongoingGame.playerCard.metLastGameOpponent'
}

const metResultClass = (result: string) => ({
  'text-emerald-600 dark:text-emerald-400': result === 'win',
  'text-red-600 dark:text-red-400': result === 'loss',
  'text-gray-600 dark:text-gray-400': result === 'abort' || result === 'remake'
})

const metRelationClass = (isSameTeam: boolean) => ({
  'text-emerald-600 dark:text-emerald-400': isSameTeam,
  'text-red-600 dark:text-red-400': !isSameTeam
})

const metTableHeaderCellClass =
  'border-l border-black/10 px-2.5 py-1.5 text-center font-medium whitespace-nowrap text-black/60 first:border-l-0 dark:border-white/10 dark:text-white/60'

const metTableCellClass =
  'border-l border-black/10 px-2.5 py-1.5 text-center whitespace-nowrap first:border-l-0 dark:border-white/10'

const renderChampionIcon = (championId: number) => (
  <LcuImage class="h-4 w-4 shrink-0 rounded-xs" src={championIconUri(championId)} />
)

const renderPositionIcon = (position: string) => (
  <PositionIcon class="shrink-0 text-base" position={position} />
)

const renderKda = (kda: EncounteredGameStats['selfKda']) => (
  <span class="text-[11px] leading-4 text-black/85 tabular-nums dark:text-white/85">
    {kda.k} / {kda.d} / {kda.a}
  </span>
)

const renderPlacement = (
  ctx: PlayerCardTagContext,
  placement: number | null | undefined,
  result: string
) => {
  if (!placement) {
    return null
  }

  return (
    <span
      class={[
        'rounded-xs bg-black/5 px-1 text-[10px] leading-4 font-semibold whitespace-nowrap dark:bg-white/8',
        metResultClass(result)
      ]}
    >
      {formatI18nOrdinal(placement, ctx.locale)}
    </span>
  )
}

const renderParticipantStats = (
  ctx: PlayerCardTagContext,
  championId: number,
  position: string | null | undefined,
  kda: EncounteredGameStats['selfKda'],
  placement: number | null | undefined,
  result: string
) => (
  <div class="flex items-center justify-center gap-1.5">
    {renderPlacement(ctx, placement, result)}
    <div class="flex items-center gap-1">
      {position ? renderPositionIcon(position) : null}
      {renderChampionIcon(championId)}
    </div>
    {renderKda(kda)}
  </div>
)

const renderMissingGameStatsCells = (storedChampionId?: number | null) => (
  <>
    <td class={[metTableCellClass, 'text-black/35 dark:text-white/30']}>-</td>
    <td class={[metTableCellClass, 'text-black/35 dark:text-white/30']}>-</td>
    <td class={[metTableCellClass, 'text-black/35 dark:text-white/30']}>-</td>
    <td class={[metTableCellClass, 'text-black/35 dark:text-white/30']}>
      {storedChampionId ? (
        <div class="flex items-center justify-center gap-1">
          {renderChampionIcon(storedChampionId)}
        </div>
      ) : (
        '-'
      )}
    </td>
  </>
)

const renderEncounteredGameStatsCells = (
  ctx: PlayerCardTagContext,
  item: PlayerCardEncounteredGame
) => {
  if (!item.gameStats) {
    return renderMissingGameStatsCells(item.championId)
  }

  const stats = item.gameStats

  return (
    <>
      <td class={metTableCellClass}>
        <span
          class={[
            'text-xs leading-4 font-bold whitespace-nowrap',
            metResultClass(stats.selfWinResult)
          ]}
        >
          {ctx.t(`ongoingGame.playerCard.metPopover.winResult.${stats.selfWinResult}`)}
        </span>
      </td>
      <td class={metTableCellClass}>
        <span
          class={[
            'rounded-xs bg-black/5 px-1.5 py-0.5 text-xs leading-4 font-bold whitespace-nowrap dark:bg-white/8',
            metRelationClass(stats.isSameTeam)
          ]}
        >
          {stats.isSameTeam
            ? ctx.t('ongoingGame.playerCard.metPopover.team.teammate')
            : ctx.t('ongoingGame.playerCard.metPopover.team.opponent')}
        </span>
      </td>
      <td class={metTableCellClass}>
        {renderParticipantStats(
          ctx,
          stats.myChampionId,
          stats.myPosition,
          stats.selfKda,
          stats.myPlacement,
          stats.selfWinResult
        )}
      </td>
      <td class={metTableCellClass}>
        {renderParticipantStats(
          ctx,
          stats.opponentChampionId,
          stats.opponentPosition,
          stats.opponentKda,
          stats.opponentPlacement,
          stats.opponentWinResult
        )}
      </td>
    </>
  )
}

const renderMetPopover = (
  ctx: PlayerCardTagContext,
  mergedSavedInfo: PlayerCardMergedSavedInfo
) => {
  const encounteredGames = mergedSavedInfo.encounteredGames.data

  return (
    <div class="w-fit max-w-3xl text-xs">
      <div class="mb-2 leading-5 text-black/75 dark:text-gray-200">
        <div>
          {ctx.t('ongoingGame.playerCard.metPopover.title', {
            date: dayjs(mergedSavedInfo.lastMetAt)
              .locale(ctx.locale.toLowerCase())
              .format('YYYY-MM-DD HH:mm:ss'),
            count: mergedSavedInfo.encounteredGames.total
          })}
        </div>
        <div class="text-black/45 dark:text-white/45">
          {ctx.t('ongoingGame.playerCard.metPopover.titleNote', {
            count: mergedSavedInfo.encounteredGames.data.length
          })}
        </div>
      </div>
      <div class="w-fit max-w-full overflow-x-auto rounded-md border border-black/10 bg-white/55 text-xs text-black shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/4 dark:text-gray-300 dark:shadow-black/20">
        <table class="min-w-max border-collapse border-spacing-0">
          <thead class="bg-black/4 dark:bg-white/6">
            <tr>
              <th class={metTableHeaderCellClass}>
                {ctx.t('ongoingGame.playerCard.metPopover.gameId')}
              </th>
              <th class={metTableHeaderCellClass}>
                {ctx.t('ongoingGame.playerCard.metPopover.date')}
              </th>
              <th class={metTableHeaderCellClass}>
                {ctx.t('ongoingGame.playerCard.metPopover.result')}
              </th>
              <th class={metTableHeaderCellClass}>
                {ctx.t('ongoingGame.playerCard.metPopover.relation')}
              </th>
              <th class={metTableHeaderCellClass}>
                {ctx.t('ongoingGame.playerCard.metPopover.self')}
              </th>
              <th class={metTableHeaderCellClass}>
                {ctx.t('ongoingGame.playerCard.metPopover.encounteredPlayer')}
              </th>
            </tr>
          </thead>
          <tbody>
            {encounteredGames.map((item, index) => {
              const gameTimestamp = getEncounteredGameTimestamp(item)

              return (
                <tr
                  key={item.gameId}
                  class="border-t border-black/10 transition-colors hover:bg-black/3 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <td class={[metTableCellClass, 'text-left']}>
                    <button
                      type="button"
                      class="m-0 cursor-pointer appearance-none rounded border-0 bg-black/8 px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap text-black/75 transition-colors hover:bg-black/10 hover:text-black focus-visible:outline focus-visible:outline-offset-1 focus-visible:outline-black/30 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20 dark:hover:text-white dark:focus-visible:outline-white/40"
                      onClick={() => ctx.previewEncounteredGame(item.gameId)}
                    >
                      {ctx.t('ongoingGame.playerCard.metPopover.inspectByGameId', {
                        gameId: ctx.masked(
                          item.gameId.toString(),
                          (index + 1).toString().padStart(6, '●')
                        )
                      })}
                    </button>
                  </td>
                  <td class={[metTableCellClass, 'text-black/75 dark:text-gray-100']}>
                    <div class="flex items-center justify-center gap-1.5">
                      <span>{dayjs(gameTimestamp).format('MM-DD HH:mm:ss')}</span>
                      <span class="text-black/40 dark:text-white/40">
                        ({dayjs(gameTimestamp).locale(ctx.locale.toLowerCase()).fromNow()})
                      </span>
                    </div>
                  </td>
                  {renderEncounteredGameStatsCells(ctx, item)}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const MET_TAG: PlayerCardTagDefinition = {
  id: 'met',
  render: (ctx) => {
    if (!ctx.settings.showMetTag || ctx.puuid === ctx.selfPuuid) {
      return null
    }

    const mergedSavedInfo = mergeSavedInfoWithRecentGames(ctx)
    const labelKey = getMetLabelKey(ctx, mergedSavedInfo)

    if (!mergedSavedInfo.encounteredGames.data.length && !mergedSavedInfo.lastMetAt) {
      return null
    }

    return {
      label: (
        <div class="rounded-xs bg-[#5cacea] px-1 py-0.5 text-[11px] leading-2.75 text-black">
          {ctx.t(labelKey)}
        </div>
      ),
      popover: {
        content: renderMetPopover(ctx, mergedSavedInfo),
        keepAliveOnHover: true,
        scrollable: true,
        maxHeight: 320
      }
    }
  }
}
