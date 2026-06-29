<template>
  <div v-if="details" class="flex h-142 w-full gap-4">
    <!-- 左侧：时间线区域 -->
    <div class="min-h-0 flex-1">
      <NScrollbar class="h-full w-full">
        <div class="pt-2 pl-4">
          <NTimeline>
            <NTimelineItem
              :title="t('matchCard.eventsTab.start')"
              :time="formatDuration(firstAndEndTime.firstTime)"
            />

            <template v-for="e of filteredEvents">
              <NTimelineItem
                v-if="e.type === 'CHAMPION_KILL' && selectedFilters.includes('CHAMPION_KILL')"
                type="success"
                :time="formatDuration(e.timestamp)"
              >
                <template #header>
                  <div class="flex items-center gap-2">
                    <div>{{ frameEventType(e.type) }}</div>

                    <!-- view map position -->
                    <NPopover
                      v-if="isSupportedMap(basicInfo.mapId)"
                      :show-arrow="false"
                      placement="right"
                    >
                      <template #trigger>
                        <div :class="tagTheme">{{ t('matchCard.eventsTab.viewPosition') }}</div>
                      </template>
                      <MapPosition :mapId="basicInfo.mapId" :points="[e.position]" />
                    </NPopover>

                    <!-- view victim damage details -->
                    <NPopover
                      v-if="isSgpChampionKillEvent(e)"
                      :show-arrow="false"
                      placement="right"
                    >
                      <template #trigger>
                        <div :class="tagTheme">
                          {{ t('matchCard.eventsTab.viewVictimDamageDetails') }}
                        </div>
                      </template>
                      <VictimDamageDetails :event="e" />
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
                    {{ t('matchCard.eventsTab.kill') }}
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
                      {{ t('matchCard.eventsTab.firstBlood') }}
                    </div>
                    <div v-else-if="e.killType === 'KILL_MULTI'">
                      {{ t('matchCard.eventsTab.multiKill', { count: e.multiKillLength }) }}
                    </div>
                    <div v-else-if="e.killType === 'KILL_ACE'">
                      {{ t('matchCard.eventsTab.ace') }}
                    </div>
                    <NPopover
                      v-if="isSupportedMap(basicInfo.mapId)"
                      :show-arrow="false"
                      placement="right"
                    >
                      <template #trigger>
                        <div :class="tagTheme">{{ t('matchCard.eventsTab.viewPosition') }}</div>
                      </template>
                      <MapPosition :mapId="basicInfo.mapId" :points="[e.position]" />
                    </NPopover>
                  </div>
                </template>
              </NTimelineItem>

              <NTimelineItem
                v-if="e.type === 'BUILDING_KILL' && selectedFilters.includes('BUILDING_KILL')"
                :title="t('matchCard.eventsTab.destroyBuilding')"
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
                        {{ t('matchCard.eventsTab.destroyed') }}
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
                :title="t('matchCard.eventsTab.destroyPlateTitle')"
                type="warning"
                :time="formatDuration(e.timestamp)"
              >
                <div class="flex w-fit cursor-pointer items-center gap-2">
                  <ChampionIcon
                    :champion-id="participantMap[e.killerId]?.championId"
                    class="size-5 rounded"
                  />
                  <div class="text-black/60 dark:text-white/60">
                    {{ t('matchCard.eventsTab.destroyed') }}
                  </div>
                  <div class="font-bold">
                    {{
                      e.laneType
                        ? t('matchCard.eventsTab.plateLane', { lane: laneType(e.laneType) })
                        : t('matchCard.eventsTab.plate')
                    }}
                  </div>
                </div>
              </NTimelineItem>
            </template>

            <NTimelineItem
              :title="t('matchCard.eventsTab.end')"
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
            {{ t('matchCard.eventsTab.filters') }}
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

        <div class="h-px bg-black/10 dark:bg-white/10"></div>

        <!-- 按英雄筛选 -->
        <div class="flex w-full flex-col gap-2">
          <div class="text-xs font-semibold text-black/60 dark:text-white/60">
            {{ t('matchCard.eventsTab.filterByChampion') }}
          </div>
          <NCheckboxGroup v-model:value="selectedChampionIds">
            <div class="flex flex-col gap-1.5">
              <NCheckbox
                v-for="opt of championFilterOptions"
                :key="opt.championId"
                :value="opt.championId"
              >
                <template #default>
                  <div class="flex items-center gap-1.5">
                    <ChampionIcon :champion-id="opt.championId" class="size-4 rounded" />
                    <span class="text-sm">{{ opt.label }}</span>
                  </div>
                </template>
              </NCheckbox>
            </div>
          </NCheckboxGroup>
        </div>

        <!-- 展示防御塔镀层每人数量 -->
        <template v-if="platesTakeParticipants">
          <div class="h-px bg-black/10 dark:bg-white/10"></div>

          <div class="text-xs font-semibold text-black/60 dark:text-white/60">
            {{ t('matchCard.eventsTab.plateStats') }}
          </div>

          <div class="flex flex-col gap-1">
            <div v-for="k of platesTakeParticipants">
              <div class="flex items-center gap-2">
                <ChampionIcon :champion-id="k.championId" class="size-5 rounded" />
                <div class="text-sm text-black/80 dark:text-white/80">
                  {{ lcs.gameData.championName(k.championId) }}
                </div>
                <div :class="tagTheme">
                  {{ t('matchCard.eventsTab.plateCount', { count: k.platesTake }) }}
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
        <span>{{ t('matchCard.common.loading') }}</span>
      </div>
    </template>
    <template v-else>
      <div class="flex items-center gap-2">
        <span>{{ t('matchCard.common.noData') }}</span>
        <NButton type="primary" size="small" @click="loadDetails(basicInfo.gameId)">
          {{ t('matchCard.common.refresh') }}
        </NButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { isSgpChampionKillEvent } from '@shared/data-adapter/match-history/frames'
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
import { computed, ref, watch } from 'vue'

import { useMatchCard } from '../context'
import Inhibitor from '../icons/Inhibitor.vue'
import Tower from '../icons/Tower.vue'
import { isSupportedMap } from '../utils/game-map'
import { useBuildingType, useFrameEventType, useLaneType, useTowerType } from '../utils/text'
import { useWinResultTagClass } from '../utils/theme'
import MapPosition from '../widgets/MapPosition.vue'
import VictimDamageDetails from '../widgets/VictimDamageDetails.vue'

const { participants, details, basicInfo, frames, team, loadingDetails, loadDetails } =
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

/** 按英雄筛选：为空表示不过滤，否则只显示与所选英雄相关的事件 */
const selectedChampionIds = ref<number[]>([])

const formatDuration = (timestamp: number) => {
  if (timestamp > 60 * 60 * 1000) {
    return dayjs.duration(timestamp).format('HH:mm:ss:SSS')
  }

  return dayjs.duration(timestamp).format('mm:ss:SSS')
}

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

/** 获取事件涉及的 participantId 列表（击杀者、助攻、被击杀者等） */
function getEventParticipantIds(e: (typeof events.value)[number]): number[] {
  const ids: number[] = []
  if ('killerId' in e && e.killerId) ids.push(e.killerId)
  if ('victimId' in e && e.victimId) ids.push(e.victimId)
  if ('assistingParticipantIds' in e && Array.isArray(e.assistingParticipantIds)) {
    ids.push(...e.assistingParticipantIds)
  }
  return ids
}

const filteredEvents = computed(() => {
  const championIds = selectedChampionIds.value
  if (championIds.length === 0) return events.value
  const map = participantMap.value
  return events.value.filter((e) => {
    const pids = getEventParticipantIds(e)
    const involvedChampionIds = pids
      .map((pid) => map[pid]?.championId)
      .filter((id): id is number => id != null)
    return involvedChampionIds.some((cid) => championIds.includes(cid))
  })
})

/** 本局出现的英雄列表（按 championId 去重），用于按英雄筛选 */
const championFilterOptions = computed(() => {
  const seen = new Set<number>()
  return participants.value
    .filter((p) => {
      if (seen.has(p.championId)) return false
      seen.add(p.championId)
      return true
    })
    .map((p) => ({
      championId: p.championId,
      label: lcs.gameData.championName(p.championId)
    }))
    .toSorted((a, b) => a.label.localeCompare(b.label))
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

const tagTheme = useWinResultTagClass(() => team.value?.winResult)

watch(
  [details, loadingDetails, () => basicInfo.value.gameId],
  ([d, l, g]) => {
    if (!d && !l) {
      loadDetails(g)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
@import '../match-card.css';
</style>
