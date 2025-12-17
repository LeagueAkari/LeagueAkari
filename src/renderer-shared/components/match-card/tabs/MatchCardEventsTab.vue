<template>
  <div v-if="details" class="flex h-142 w-full gap-4">
    <!-- 左侧：时间线区域 -->
    <div class="min-h-0 flex-1">
      <NScrollbar class="h-full w-full">
        <div class="pt-2 pl-4">
          <NTimeline>
            <NTimelineItem
              :title="t('MatchCard.eventsTab.start')"
              :time="formatDuration(firstAndEndTime.firstTime)"
            />

            <template v-for="e of events">
              <NTimelineItem
                v-if="e.type === 'CHAMPION_KILL' && selectedFilters.includes('CHAMPION_KILL')"
                type="success"
                :time="formatDuration(e.timestamp)"
              >
                <template #header>
                  <div class="flex items-center gap-2">
                    <div>{{ frameEventType(e.type) }}</div>
                    <NPopover v-if="canViewPosition" :show-arrow="false" placement="right">
                      <template #trigger>
                        <div :class="tagTheme">{{ t('MatchCard.eventsTab.viewPosition') }}</div>
                      </template>
                      <MapPosition :mapId="basicInfo.mapId" :points="[e.position]" />
                    </NPopover>
                  </div>
                </template>
                <div class="flex w-fit items-center gap-2">
                  <div class="flex items-end">
                    <ChampionIcon
                      :champion-id="participantMap[e.killerId]?.championId"
                      class="size-5 rounded not-last:mr-1"
                    />
                    <ChampionIcon
                      v-for="a of e.assistingParticipantIds"
                      :key="a"
                      :champion-id="participantMap[a].championId"
                      class="size-3.5 rounded not-last:mr-0.5"
                    />
                  </div>
                  <div class="text-sm text-black/80 dark:text-white/80">
                    {{ t('MatchCard.eventsTab.kill') }}
                  </div>
                  <ChampionIcon
                    :champion-id="participantMap[e.victimId].championId"
                    class="size-5 rounded"
                  />
                </div>
              </NTimelineItem>

              <NTimelineItem
                v-if="
                  e.type === 'CHAMPION_SPECIAL_KILL' &&
                  selectedFilters.includes('CHAMPION_SPECIAL_KILL')
                "
                :title="`${e.killType}`"
                type="success"
                :time="formatDuration(e.timestamp)"
              >
                <template #header>
                  <div class="flex w-fit cursor-pointer items-center gap-2">
                    <ChampionIcon
                      :champion-id="participantMap[e.killerId]?.championId"
                      class="size-5 rounded"
                    />
                    <div v-if="e.killType === 'KILL_FIRST_BLOOD'">
                      {{ t('MatchCard.eventsTab.firstBlood') }}
                    </div>
                    <div v-else-if="e.killType === 'KILL_MULTI'">
                      {{ t('MatchCard.eventsTab.multiKill', { count: e.multiKillLength }) }}
                    </div>
                    <div v-else-if="e.killType === 'KILL_ACE'">
                      {{ t('MatchCard.eventsTab.ace') }}
                    </div>
                    <NPopover v-if="canViewPosition" :show-arrow="false" placement="right">
                      <template #trigger>
                        <div :class="tagTheme">{{ t('MatchCard.eventsTab.viewPosition') }}</div>
                      </template>
                      <MapPosition :mapId="basicInfo.mapId" :points="[e.position]" />
                    </NPopover>
                  </div>
                </template>
              </NTimelineItem>

              <NTimelineItem
                v-if="e.type === 'BUILDING_KILL' && selectedFilters.includes('BUILDING_KILL')"
                :title="t('MatchCard.eventsTab.destroyBuilding')"
                type="warning"
                :time="formatDuration(e.timestamp)"
              >
                <NPopover :show-arrow="false" placement="right">
                  <template #trigger>
                    <div class="flex w-fit cursor-pointer items-center gap-2">
                      <ChampionIcon
                        :champion-id="participantMap[e.killerId]?.championId"
                        class="size-5 rounded"
                      />
                      <div class="text-black/60 dark:text-white/60">
                        {{ t('MatchCard.eventsTab.destroyed') }}
                      </div>
                      <template v-if="e.buildingType === 'TOWER_BUILDING'">
                        <Tower class="size-4" />
                        <div class="font-bold">
                          {{ e.laneType ? laneType(e.laneType) : '' }}
                          {{ e.towerType ? towerType(e.towerType) : buildingType(e.buildingType) }}
                        </div>
                      </template>
                      <template v-else-if="e.buildingType === 'INHIBITOR_BUILDING'">
                        <Inhibitor class="size-4" />
                        <div class="font-bold">
                          {{ buildingType(e.buildingType) }}
                        </div>
                      </template>
                    </div>
                  </template>
                  <MapPosition :mapId="basicInfo.mapId" :points="[e.position]" />
                </NPopover>
              </NTimelineItem>

              <NTimelineItem
                v-if="
                  e.type === 'TURRET_PLATE_DESTROYED' &&
                  e.killerId !== 0 &&
                  selectedFilters.includes('TURRET_PLATE_DESTROYED')
                "
                :title="t('MatchCard.eventsTab.destroyPlateTitle')"
                type="warning"
                :time="formatDuration(e.timestamp)"
              >
                <div class="flex w-fit cursor-pointer items-center gap-2">
                  <ChampionIcon
                    :champion-id="participantMap[e.killerId]?.championId"
                    class="size-5 rounded"
                  />
                  <div class="text-black/60 dark:text-white/60">
                    {{ t('MatchCard.eventsTab.destroyed') }}
                  </div>
                  <div class="font-bold">
                    {{
                      e.laneType
                        ? t('MatchCard.eventsTab.plateLane', { lane: laneType(e.laneType) })
                        : t('MatchCard.eventsTab.plate')
                    }}
                  </div>
                </div>
              </NTimelineItem>
            </template>

            <NTimelineItem
              :title="t('MatchCard.eventsTab.end')"
              :time="formatDuration(firstAndEndTime.endTime)"
            />
          </NTimeline>
        </div>
      </NScrollbar>
    </div>

    <!-- 右侧：控制面板（与 DiffLineChart 风格一致） -->
    <NScrollbar class="w-52!">
      <div class="flex flex-col gap-3">
        <!-- 筛选器 -->
        <div class="flex w-full flex-col gap-2">
          <div class="text-xs font-semibold text-black/60 dark:text-white/60">
            {{ t('MatchCard.eventsTab.filters') }}
          </div>
          <NCheckboxGroup v-model:value="selectedFilters">
            <div class="flex flex-col gap-1.5">
              <NCheckbox
                v-for="type of eventTypes"
                :key="type"
                :value="type"
                :label="frameEventType(type)"
              />
            </div>
          </NCheckboxGroup>
        </div>

        <!-- 展示防御塔镀层每人数量 -->
        <template v-if="platesTakeParticipants">
          <div class="h-px bg-black/10 dark:bg-white/10"></div>

          <div class="text-xs font-semibold text-black/60 dark:text-white/60">
            {{ t('MatchCard.eventsTab.plateStats') }}
          </div>

          <div class="flex flex-col gap-1">
            <div v-for="k of platesTakeParticipants">
              <div class="flex items-center gap-2">
                <ChampionIcon :champion-id="k.championId" class="size-5 rounded" />
                <div class="text-sm text-black/80 dark:text-white/80">
                  {{ lcs.gameData.championName(k.championId) }}
                </div>
                <div :class="tagTheme">
                  {{ t('MatchCard.eventsTab.plateCount', { count: k.platesTake }) }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </NScrollbar>
  </div>
  <div
    v-else
    class="flex h-142 w-full items-center justify-center text-sm text-black/60 dark:text-white/60"
  >
    <template v-if="loadingDetails">
      <div class="flex items-center gap-2">
        <NSpin :size="16" />
        <span>{{ t('MatchCard.common.loading') }}</span>
      </div>
    </template>
    <template v-else>
      <div class="flex items-center gap-2">
        <span>{{ t('MatchCard.common.noData') }}</span>
        <NButton type="primary" size="small" @click="onLoadDetails(basicInfo.gameId)">
          {{ t('MatchCard.common.refresh') }}
        </NButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NCheckbox,
  NCheckboxGroup,
  NPopover,
  NScrollbar,
  NSpin,
  NTimeline,
  NTimelineItem
} from 'naive-ui'
import { computed, ref } from 'vue'

import { useMatchCard } from '../context'
import Inhibitor from '../icons/Inhibitor.vue'
import Tower from '../icons/Tower.vue'
import { useBuildingType, useFrameEventType, useLaneType, useTowerType } from '../utils/text'
import { useWinResultTagTheme } from '../utils/theme'
import MapPosition from '../widgets/MapPosition.vue'

const { participants, details, basicInfo, frames, team, loadingDetails, onLoadDetails } =
  useMatchCard()

const lcs = useLeagueClientStore()
const { t } = useTranslation()

const SUPPORTED_EVENT_TYPES = [
  'CHAMPION_KILL',
  'CHAMPION_SPECIAL_KILL',
  'BUILDING_KILL',
  'TURRET_PLATE_DESTROYED'
]
const selectedFilters = ref<(typeof SUPPORTED_EVENT_TYPES)[number][]>([
  'CHAMPION_KILL',
  'BUILDING_KILL'
])

const formatDuration = (timestamp: number) => dayjs.duration(timestamp).format('mm:ss:SSS')

if (!details.value && !loadingDetails.value) {
  onLoadDetails(basicInfo.value.gameId)
}

const canViewPosition = computed(() => {
  return [12, 11, 21].includes(basicInfo.value.mapId)
})

const eventTypes = computed(() => {
  return [
    ...new Set(
      frames.value
        .map((frame) => frame.events)
        .flat()
        .map((event) => event.type)
        .filter((type) => SUPPORTED_EVENT_TYPES.includes(type))
    )
  ]
})

const events = computed(() => {
  return frames.value.map((frame) => frame.events).flat()
})

const platesTakeParticipants = computed(() => {
  const plateEvents = events.value
    .filter((e) => e.type === 'TURRET_PLATE_DESTROYED')
    .filter((e) => e.killerId !== 0)

  if (plateEvents.length === 0) return null

  const map = plateEvents.reduce(
    (acc, event) => {
      acc[event.killerId] = (acc[event.killerId] || 0) + 1
      return acc
    },
    {} as Record<number, number>
  )

  return Object.entries(map)
    .toSorted((a, b) => b[1] - a[1])
    .map(([k, v]) => {
      const participant = participants.value.find((p) => p.participantId === Number(k))

      if (!participant) return null

      return {
        championId: participant.championId,
        platesTake: v
      }
    })
    .filter((p) => p !== null)
})

const participantMap = computed(() => {
  return participants.value.reduce(
    (acc, participant) => {
      acc[participant.participantId] = participant
      return acc
    },
    {} as Record<number, (typeof participants.value)[number]>
  )
})

const firstAndEndTime = computed(() => {
  if (frames.value.length === 0) return { firstTime: 0, endTime: 0 }

  // sgp source 会记录真正时间，所以有数据就直接用
  const lastFrame = frames.value[frames.value.length - 1]
  const lastEvent = lastFrame?.events?.[lastFrame.events.length - 1]

  let endTime = 0
  if (lastEvent && lastEvent.type === 'GAME_END') {
    endTime = lastEvent.timestamp
  } else {
    endTime = lastFrame.timestamp
  }

  return {
    firstTime: frames.value[0].timestamp,
    endTime
  }
})

const frameEventType = useFrameEventType()
const buildingType = useBuildingType()
const towerType = useTowerType()
const laneType = useLaneType()

const tagTheme = useWinResultTagTheme(() => team.value?.winResult)
</script>

<style scoped>
@import '../match-card.css';
</style>
