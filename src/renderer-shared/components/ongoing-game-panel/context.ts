import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { findOutliersByIqr } from '@shared/data-adapter/utils'
import { InjectionKey, MaybeRefOrGetter, Ref, computed, inject, provide, toRef } from 'vue'

import type { MatchPreviewPayload } from '../match-preview'
import { IQR_THRESHOLD } from './constants'

export interface OngoingGamePanelMatchHistoryInitParams {
  collectByChampionId?: number
  collectByPosition?: string
  expectedCount?: number
}

export interface OngoingGamePanelPlayerTabInitParams {
  matchHistory?: OngoingGamePanelMatchHistoryInitParams
}

export type OngoingGamePanelContext = {
  contentWidth: Ref<number>
  contentHeight: Ref<number>

  columnsNeed: Ref<number>
  linesPerTeam: Ref<number>
  isTwoTeamsMode: Ref<boolean>
  mergedPremadeTeams: Ref<{
    groups: Record<string, string[]>
    premadeTeamIdMap: Record<string, string>
  }>

  /** 低于或高于平均 KDA 的玩家 */
  kdaOutliers: Ref<Record<string, 'over' | 'below'>>

  navigateToSummonerByPuuid: (
    puuid: string,
    initParams?: OngoingGamePanelPlayerTabInitParams
  ) => void
  previewGame: (payload: MatchPreviewPayload) => void
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

  navigateToSummonerByPuuid: (
    puuid: string,
    initParams?: OngoingGamePanelPlayerTabInitParams
  ) => void
  previewGame: (payload: MatchPreviewPayload) => void
}) {
  const ogs = useOngoingGameStore()

  const kdaOutliers = computed(() => {
    if (!ogs.analysis || Object.keys(ogs.analysis.players).length < 5) {
      return {}
    }

    const kdaList = Object.entries(ogs.analysis.players).map(([puuid, p]) => ({
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
    previewGame: props.previewGame
  })
}
