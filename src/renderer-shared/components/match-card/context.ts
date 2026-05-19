import { toFrames } from '@shared/data-adapter/match-history/frames'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import { toTeams } from '@shared/data-adapter/match-history/teams'
import { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { ReplayDownloadProgress } from '@shared/types/league-client/replays'
import { DraftOptions } from '@shared/types/shards/ongoing-game'
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
  theme: Ref<'light' | 'dark'>
  isExpanded: Ref<boolean>
  puuid: Ref<string | undefined>
  details: Ref<LcuOrSgpGameDetails | null | undefined>
  summary: Ref<LcuOrSgpGameSummary>
  hidePrivacy: Ref<boolean>
  loadingDetails: Ref<boolean>
  replayState: Ref<ReplayDownloadProgress | null | undefined>
  canDryRunOngoingGame: Ref<boolean>

  basicInfo: Ref<ReturnType<typeof toBasicInfo>>
  participants: Ref<ReturnType<typeof toParticipants>>
  teams: Ref<ReturnType<typeof toTeams>>
  frames: Ref<ReturnType<typeof toFrames>>

  participant: Ref<ReturnType<typeof toParticipants>[number] | null>
  team: Ref<ReturnType<typeof toTeams>['teamStatMap'][string] | null>

  // events
  navigateToSummonerByPuuid: (puuid: string, setCurrent?: boolean) => void
  loadReplay: (gameId: number) => void
  watchReplay: (gameId: number) => void
  loadDetails: (gameId: number) => void
  dryRunOngoingGame: () => void
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
  canDryRunOngoingGame: MaybeRefOrGetter<boolean>

  navigateToSummonerByPuuid: (puuid: string, setCurrent?: boolean) => void
  loadReplay: (gameId: number) => void
  watchReplay: (gameId: number) => void
  loadDetails: (gameId: number) => void
  dryRunOngoingGame: (draft: DraftOptions) => void
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

  const draftOptions = computed<DraftOptions>(() => {
    const focusedPuuid = toValue(props.puuid)
    const ownerPuuid =
      focusedPuuid && participants.value.some((p) => p.puuid === focusedPuuid) ? focusedPuuid : null

    const draftTeams: DraftOptions['teams'] = {}
    const championSelections: DraftOptions['championSelections'] = {}
    const positionAssignments: NonNullable<DraftOptions['positions']> = {}
    let hasPositions = false

    for (const participant of participants.value) {
      const teamIdentifier =
        basicInfo.value.gameMode === 'CHERRY' ? 'TEAM-ALL' : participant.teamIdentifier

      draftTeams[teamIdentifier] ??= []
      draftTeams[teamIdentifier].push(participant.puuid)
      championSelections[participant.puuid] = participant.championId

      if (participant.position) {
        positionAssignments[participant.puuid] = {
          selected: participant.position,
          primary: participant.position,
          secondary: ''
        }
        hasPositions = true
      }
    }

    return {
      gameModeKind: basicInfo.value.gameMode === 'CHERRY' ? 'cherry' : 'normal',
      queueId: basicInfo.value.queueId,
      puuid: ownerPuuid,
      teams: draftTeams,
      championSelections,
      positions: hasPositions ? positionAssignments : null
    }
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
    canDryRunOngoingGame: toRef(props.canDryRunOngoingGame),

    // computed states
    basicInfo,
    participants,
    teams,
    frames,

    participant,
    team,

    // events
    navigateToSummonerByPuuid: props.navigateToSummonerByPuuid,
    loadReplay: props.loadReplay,
    watchReplay: props.watchReplay,
    loadDetails: props.loadDetails,
    dryRunOngoingGame: () => {
      if (!toValue(props.canDryRunOngoingGame)) {
        return
      }

      props.dryRunOngoingGame(draftOptions.value)
    }
  })
}
