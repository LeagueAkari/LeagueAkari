import LcuImage from '@renderer-shared/components/LcuImage.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { championIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import type { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { formatI18nOrdinal } from '@shared/i18n'
import type { EncounteredGame, SavedInfo } from '@shared/shards/saved-player'
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

type PlayerCardEncounteredGame = EncounteredGame & {
  gameStats: EncounteredGameStats | null
}

function getEncounteredGames(
  savedInfo: SavedInfo,
  cachedGames: Record<number, LcuOrSgpGameSummary>
): PlayerCardEncounteredGame[] {
  return savedInfo.encounteredGames.data.map((record) => {
    const game = cachedGames[record.gameId]

    if (!game) {
      return { gameStats: null, ...record }
    }

    const basicInfo = toBasicInfo(game)
    const participants = toParticipants(game, basicInfo)

    const selfParticipant = participants.find((p) => p.puuid === record.selfPuuid)
    const opponentParticipant = participants.find((p) => p.puuid === record.puuid)

    if (!selfParticipant || !opponentParticipant) {
      return { gameStats: null, ...record }
    }

    const isSameTeam = basicInfo.isCherrySubteam
      ? selfParticipant.playerSubteamId === opponentParticipant.playerSubteamId
      : selfParticipant.teamId === opponentParticipant.teamId

    return {
      gameStats: {
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
      },
      ...record
    }
  })
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
    {kda.k}/{kda.d}/{kda.a}
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

const renderMissingGameStatsCells = () => (
  <>
    <td class={[metTableCellClass, 'text-black/35 dark:text-white/30']}>-</td>
    <td class={[metTableCellClass, 'text-black/35 dark:text-white/30']}>-</td>
    <td class={[metTableCellClass, 'text-black/35 dark:text-white/30']}>-</td>
    <td class={[metTableCellClass, 'text-black/35 dark:text-white/30']}>-</td>
  </>
)

const renderEncounteredGameStatsCells = (
  ctx: PlayerCardTagContext,
  item: PlayerCardEncounteredGame
) => {
  if (!item.gameStats) {
    return renderMissingGameStatsCells()
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
  savedInfo: SavedInfo,
  encounteredGames: PlayerCardEncounteredGame[]
) => (
  <div class="w-fit max-w-3xl text-xs">
    <div class="mb-2 leading-5 text-black/75 dark:text-gray-200">
      <div>
        {ctx.t('ongoingGame.playerCard.metPopover.title', {
          date: dayjs(savedInfo.lastMetAt)
            .locale(ctx.locale.toLowerCase())
            .format('YYYY-MM-DD HH:mm:ss'),
          count: savedInfo.encounteredGames.total
        })}
      </div>
      <div class="text-black/45 dark:text-white/45">
        {ctx.t('ongoingGame.playerCard.metPopover.titleNote', {
          count: savedInfo.encounteredGames.data.length
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
          {encounteredGames.map((item, index) => (
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
                  <span>{dayjs(item.updateAt).format('MM-DD HH:mm:ss')}</span>
                  <span class="text-black/40 dark:text-white/40">
                    ({dayjs(item.updateAt).locale(ctx.locale.toLowerCase()).fromNow()})
                  </span>
                </div>
              </td>
              {renderEncounteredGameStatsCells(ctx, item)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

export const MET_TAG: PlayerCardTagDefinition = {
  id: 'met',
  render: (ctx) => {
    const savedInfo = ctx.savedInfo

    if (!ctx.settings.showMetTag || !savedInfo?.lastMetAt || ctx.puuid === ctx.selfPuuid) {
      return null
    }

    return {
      label: (
        <div class="rounded-xs bg-[#5cacea] px-1 py-0.5 text-[11px] leading-2.75 text-black">
          {ctx.t('ongoingGame.playerCard.met')}
        </div>
      ),
      popover: {
        content: renderMetPopover(ctx, savedInfo, getEncounteredGames(savedInfo, ctx.cachedGames)),
        keepAliveOnHover: true,
        scrollable: true,
        maxHeight: 240
      }
    }
  }
}
