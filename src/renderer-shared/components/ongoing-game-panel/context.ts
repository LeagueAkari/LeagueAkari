import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import type { MatchParticipantPosition } from '@shared/data-adapter/match-history/participants'
import { findOutliersByIqr } from '@shared/data-adapter/utils'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { InjectionKey, MaybeRefOrGetter, Ref, computed, inject, provide, toRef } from 'vue'

import { IQR_THRESHOLD } from './constants'

export type OngoingGamePanelContext = {
  contentWidth: Readonly<Ref<number>>
  contentHeight: Readonly<Ref<number>>

  columnsNeed: Readonly<Ref<number>>
  linesPerTeam: Readonly<Ref<number>>
  isTwoTeamsMode: Readonly<Ref<boolean>>
  mergedPremadeTeams: Readonly<
    Ref<{
      groups: Record<string, string[]>
      premadeTeamIdMap: Record<string, string>
    }>
  >

  /** 低于或高于平均 KDA 的玩家 */
  kdaOutliers: Readonly<Ref<Record<string, 'over' | 'below'>>>

  navigateToSummonerByPuuid: (puuid: string) => void
  navigateToSummonerByPuuidWithChampion: (puuid: string, championId: number) => void
  navigateToSummonerByPuuidWithPosition: (puuid: string, position: MatchParticipantPosition) => void
  previewGame: (summary: LcuOrSgpGameSummary | number, puuid?: string) => void
}

export const OngoingGamePanelContextKey: InjectionKey<OngoingGamePanelContext> =
  Symbol('OngoingGamePanelContext')

export function useOngoingGamePanel(): OngoingGamePanelContext {
  const context = inject(OngoingGamePanelContextKey)

  if (!context) {
    throw new Error('useOngoingGamePanel must be used within a ongoing game panel component')
  }

  return context
}

export function provideOngoingGamePanel(props: {
  contentWidth: MaybeRefOrGetter<number>
  contentHeight: MaybeRefOrGetter<number>

  columnsNeed: MaybeRefOrGetter<number>
  linesPerTeam: MaybeRefOrGetter<number>
  isTwoTeamsMode: MaybeRefOrGetter<boolean>
  mergedPremadeTeams: MaybeRefOrGetter<{
    groups: Record<string, string[]>
    premadeTeamIdMap: Record<string, string>
  }>

  navigateToSummonerByPuuid: (puuid: string) => void
  navigateToSummonerByPuuidWithChampion: (puuid: string, championId: number) => void
  navigateToSummonerByPuuidWithPosition: (puuid: string, position: MatchParticipantPosition) => void
  previewGame: (summary: LcuOrSgpGameSummary | number, puuid?: string) => void
}) {
  const ogs = useOngoingGameStore()

  const kdaOutliers = computed(() => {
    if (!ogs.playerStats || Object.keys(ogs.playerStats.players).length < 5) {
      return {}
    }

    const kdaList = Object.entries(ogs.playerStats.players).map(([puuid, p]) => ({
      puuid,
      kda: p.summary.avgKda
    }))

    const iqr = findOutliersByIqr(kdaList, (a) => a.kda, IQR_THRESHOLD)
    const result: Record<string, 'over' | 'below'> = {}

    iqr.over.forEach((a) => {
      result[a.puuid] = 'over'
    })

    iqr.below.forEach((a) => {
      result[a.puuid] = 'below'
    })

    return result
  })

  provide(OngoingGamePanelContextKey, {
    contentWidth: toRef(props.contentWidth),
    contentHeight: toRef(props.contentHeight),

    columnsNeed: toRef(props.columnsNeed),
    linesPerTeam: toRef(props.linesPerTeam),
    isTwoTeamsMode: toRef(props.isTwoTeamsMode),
    mergedPremadeTeams: toRef(props.mergedPremadeTeams),

    kdaOutliers,

    navigateToSummonerByPuuid: props.navigateToSummonerByPuuid,
    navigateToSummonerByPuuidWithChampion: props.navigateToSummonerByPuuidWithChampion,
    navigateToSummonerByPuuidWithPosition: props.navigateToSummonerByPuuidWithPosition,
    previewGame: props.previewGame
  })
}
