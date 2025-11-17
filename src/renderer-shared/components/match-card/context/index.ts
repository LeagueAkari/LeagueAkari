import { toFrames } from '@shared/data-adapter/match-history/frames'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import { toTeams } from '@shared/data-adapter/match-history/teams'
import { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import {
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
  computed,
  inject,
  provide,
  ref,
  toRef,
  toValue
} from 'vue'

export type MatchCardContext = {
  width: Readonly<Ref<number>>
  theme: Readonly<Ref<'light' | 'dark'>>
  isExpanded: Readonly<Ref<boolean>>
  puuid: Readonly<Ref<string | undefined>>
  details: Readonly<Ref<LcuOrSgpGameDetails | null | undefined>>
  summary: Readonly<Ref<LcuOrSgpGameSummary>>

  isDetailsLoading: Readonly<Ref<boolean>>
  loadDetailsError: Readonly<Ref<Error | null>>
  setDetailsLoading: (loading: boolean) => void
  loadDetails: () => Promise<void>

  isDownloadingReplays: Readonly<Ref<boolean>>
  downloadReplaysError: Readonly<Ref<Error | null>>
  setDownloadingReplays: (downloading: boolean) => void
  downloadReplays: () => Promise<void>

  basicInfo: Readonly<Ref<ReturnType<typeof toBasicInfo>>>
  participants: Readonly<Ref<ReturnType<typeof toParticipants>>>
  teams: Readonly<Ref<ReturnType<typeof toTeams>>>
  frames: Readonly<Ref<ReturnType<typeof toFrames>>>

  participant: Readonly<Ref<ReturnType<typeof toParticipants>[number] | null>>
  team: Readonly<Ref<ReturnType<typeof toTeams>['teamStatMap'][string] | null>>
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
  width: MaybeRefOrGetter<number>
  theme: MaybeRefOrGetter<'light' | 'dark'>
  isExpanded: MaybeRefOrGetter<boolean>
  summary: MaybeRefOrGetter<LcuOrSgpGameSummary>
  details: MaybeRefOrGetter<LcuOrSgpGameDetails | null | undefined>
  puuid: MaybeRefOrGetter<string | undefined>
}) {
  const isDetailsLoading = ref(false)
  const loadDetailsError = ref<Error | null>(null)
  const setDetailsLoading = (loading: boolean) => {
    isDetailsLoading.value = loading
  }

  const loadDetails = async () => {
    if (isDetailsLoading.value) {
      return
    }

    setDetailsLoading(true)
    // TODO
    try {
    } catch {
    } finally {
      setDetailsLoading(false)
    }
  }

  const isDownloadingReplays = ref(false)
  const downloadReplaysError = ref<Error | null>(null)
  const setDownloadingReplays = (downloading: boolean) => {
    isDownloadingReplays.value = downloading
  }

  const downloadReplays = async () => {}

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
    width: toRef(props.width),
    theme: toRef(props.theme),
    isExpanded: toRef(props.isExpanded),
    summary: toRef(props.summary),
    details: toRef(props.details),
    puuid: toRef(props.puuid),

    // global loading state
    isDetailsLoading: toRef(isDetailsLoading),
    loadDetailsError: toRef(loadDetailsError),
    setDetailsLoading,
    loadDetails,

    isDownloadingReplays: toRef(isDownloadingReplays),
    downloadReplaysError: toRef(downloadReplaysError),
    setDownloadingReplays,
    downloadReplays,

    // computed states
    basicInfo,
    participants,
    teams,
    frames,

    participant,
    team
  })
}
