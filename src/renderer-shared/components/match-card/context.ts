import { toFrames } from '@shared/data-adapter/match-history/frames'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import { toTeams } from '@shared/data-adapter/match-history/teams'
import { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { ReplayDownloadProgress } from '@shared/types/league-client/replays'
import {
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
  computed,
  inject,
  provide,
  toRef,
  toValue
} from 'vue'

export type MatchCardContext = {
  theme: Readonly<Ref<'light' | 'dark'>>
  isExpanded: Readonly<Ref<boolean>>
  puuid: Readonly<Ref<string | undefined>>
  details: Readonly<Ref<LcuOrSgpGameDetails | null | undefined>>
  summary: Readonly<Ref<LcuOrSgpGameSummary>>
  hidePrivacy: Readonly<Ref<boolean>>

  loadingDetails: Readonly<Ref<boolean>>
  replayState: Readonly<Ref<ReplayDownloadProgress | null | undefined>>

  basicInfo: Readonly<Ref<ReturnType<typeof toBasicInfo>>>
  participants: Readonly<Ref<ReturnType<typeof toParticipants>>>
  teams: Readonly<Ref<ReturnType<typeof toTeams>>>
  frames: Readonly<Ref<ReturnType<typeof toFrames>>>

  participant: Readonly<Ref<ReturnType<typeof toParticipants>[number] | null>>
  team: Readonly<Ref<ReturnType<typeof toTeams>['teamStatMap'][string] | null>>

  // events
  onNavigateToSummonerByPuuid: (puuid: string, setCurrent?: boolean) => void
  onLoadReplay: (gameId: number) => void
  onWatchReplay: (gameId: number) => void
  onLoadDetails: (gameId: number) => void
}

export const MatchCardContextKey: InjectionKey<MatchCardContext> = Symbol('MatchCardContext')

export function useMatchCard(): MatchCardContext {
  const context = inject(MatchCardContextKey)

  if (!context) {
    throw new Error('useMatchCard must be used within a match card component')
  }

  return context
}

export function provideMatchCard(props: {
  theme: MaybeRefOrGetter<'light' | 'dark'>
  isExpanded: MaybeRefOrGetter<boolean>
  summary: MaybeRefOrGetter<LcuOrSgpGameSummary>
  puuid: MaybeRefOrGetter<string | undefined>
  details: MaybeRefOrGetter<LcuOrSgpGameDetails | null | undefined>
  hidePrivacy: MaybeRefOrGetter<boolean>
  loadingDetails: MaybeRefOrGetter<boolean>
  replayState: MaybeRefOrGetter<ReplayDownloadProgress | null>

  onNavigateToSummonerByPuuid: (puuid: string, setCurrent?: boolean) => void
  onLoadReplay: (gameId: number) => void
  onWatchReplay: (gameId: number) => void
  onLoadDetails: (gameId: number) => void
}) {
  const basicInfo = computed(() => toBasicInfo(toValue(props.summary)))
  const participants = computed(() => toParticipants(toValue(props.summary), basicInfo.value))
  const teams = computed(() => toTeams(toValue(props.summary), basicInfo.value, participants.value))
  const frames = computed(() => {
    const d = toValue(props.details)
    if (!d) {
      return []
    }

    return toFrames(d)
  })

  const participant = computed(() => {
    return participants.value.find((p) => p.puuid === toValue(props.puuid)) ?? null
  })

  const team = computed(() => {
    if (!participant.value) return null
    return teams.value.teamStatMap[participant.value.teamIdentifier] ?? null
  })

  provide(MatchCardContextKey, {
    // props pass-through
    theme: toRef(props.theme),
    isExpanded: toRef(props.isExpanded),
    summary: toRef(props.summary),
    details: toRef(props.details),
    puuid: toRef(props.puuid),
    loadingDetails: toRef(props.loadingDetails),
    replayState: toRef(props.replayState),
    hidePrivacy: toRef(props.hidePrivacy),

    // computed states
    basicInfo,
    participants,
    teams,
    frames,

    participant,
    team,

    // events
    onNavigateToSummonerByPuuid: props.onNavigateToSummonerByPuuid,
    onLoadReplay: props.onLoadReplay,
    onWatchReplay: props.onWatchReplay,
    onLoadDetails: props.onLoadDetails
  })
}
