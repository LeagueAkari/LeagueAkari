<template>
  <div
    class="relative w-full min-w-175 [content-visibility:auto]"
    :style="{ containIntrinsicSize: `${MATCH_CARD_COLLAPSED_HEIGHT_PX}px` }"
  >
    <MatchCardOverview @toggle-expand="isExpanded = !isExpanded" />

    <KeepAlive>
      <MatchCardDetails v-if="isExpanded" :details-available="false" />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
import type { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import type { LanWebMatchDto } from '@shared/shards/lan-web'
import { computed, provide, ref, toRef } from 'vue'

import { MATCH_CARD_COLLAPSED_HEIGHT_PX } from './constants'
import { MatchCardContextKey, type MatchCardContext } from './context'
import MatchCardDetails from './MatchCardDetails.vue'
import MatchCardOverview from './MatchCardOverview.vue'
import { toRawDetailsFromParticipants } from './utils/details-table/raw-details'

const props = defineProps<{
  view: LanWebMatchDto['cardView']
  puuid: string
}>()

const emit = defineEmits<{
  navigateToSummonerByPuuid: [puuid: string]
}>()

const isExpanded = ref(false)
const puuid = toRef(props, 'puuid')
const basicInfo = computed(() => props.view.basicInfo)
const participants = computed(() => props.view.participants)
const teams = computed(() => props.view.teams)
const participant = computed(
  () => participants.value.find((entry) => entry.puuid === puuid.value) ?? null
)
const team = computed(() =>
  participant.value ? (teams.value.teamStatMap[participant.value.teamIdentifier] ?? null) : null
)
const rawStatsOverride = computed(() =>
  toRawDetailsFromParticipants(basicInfo.value, participants.value)
)

const context: MatchCardContext = {
  isExpanded,
  puuid,
  details: ref(null),
  summary: computed(() => null as unknown as LcuOrSgpGameSummary),
  hidePrivacy: ref(false),
  loadingDetails: ref(false),
  replayState: ref(null),
  canDryRunOngoingGame: ref(false),
  basicInfo,
  participants,
  teams,
  frames: ref([]),
  rawStatsOverride,
  participant,
  team,
  navigateToSummonerByPuuid: (targetPuuid) => emit('navigateToSummonerByPuuid', targetPuuid),
  loadReplay: () => {},
  watchReplay: () => {},
  loadDetails: () => {},
  dryRunOngoingGame: () => {}
}

provide(MatchCardContextKey, context)
</script>
