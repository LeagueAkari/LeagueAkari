<template>
  <div v-if="details" class="w-full h-142 flex gap-4">
    <!-- 左侧：时间线区域 -->
    <div class="flex-1 min-h-0">
      <NScrollbar class="h-full w-full">
        <div class="pl-4 pt-2">
          <NTimeline>
            <NTimelineItem
              title="开始游戏"
              :time="dayjs.duration(firstAndEndTime.firstTime).format('mm:ss:SSS')"
            />

            <template v-for="e of events">
              <NTimelineItem
                v-if="e.type === 'CHAMPION_KILL' && selectedFilters.includes('CHAMPION_KILL')"
                type="success"
                :time="dayjs.duration(e.timestamp).format('mm:ss:SSS')"
              >
                <template #header>
                  <div class="flex items-center gap-2">
                    <div>{{ frameEventType(e.type) }}</div>
                    <NPopover v-if="canViewPosition" :show-arrow="false" placement="right">
                      <template #trigger>
                        <div :class="tagTheme">查看位置</div>
                      </template>
                      <MapPosition :mapId="basicInfo.mapId" :points="[e.position]" />
                    </NPopover>
                  </div>
                </template>
                <div class="flex gap-2 items-center w-fit">
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
                  <div class="dark:text-white/80 text-black/80 text-sm">击杀</div>
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
                :time="dayjs.duration(e.timestamp).format('mm:ss:SSS')"
              >
                <template #header>
                  <div class="flex gap-2 items-center w-fit cursor-pointer">
                    <ChampionIcon
                      :champion-id="participantMap[e.killerId]?.championId"
                      class="size-5 rounded"
                    />
                    <div v-if="e.killType === 'KILL_FIRST_BLOOD'">第一滴血</div>
                    <div v-else-if="e.killType === 'KILL_MULTI'">{{ e.multiKillLength }} 杀</div>
                    <div v-else-if="e.killType === 'KILL_ACE'">团灭敌队</div>
                    <NPopover v-if="canViewPosition" :show-arrow="false" placement="right">
                      <template #trigger>
                        <div :class="tagTheme">查看位置</div>
                      </template>
                      <MapPosition :mapId="basicInfo.mapId" :points="[e.position]" />
                    </NPopover>
                  </div>
                </template>
              </NTimelineItem>

              <NTimelineItem
                v-if="e.type === 'BUILDING_KILL' && selectedFilters.includes('BUILDING_KILL')"
                title="摧毁建筑"
                type="warning"
                :time="dayjs.duration(e.timestamp).format('mm:ss:SSS')"
              >
                <NPopover :show-arrow="false" placement="right">
                  <template #trigger>
                    <div class="flex gap-2 items-center w-fit cursor-pointer">
                      <ChampionIcon
                        :champion-id="participantMap[e.killerId]?.championId"
                        class="size-5 rounded"
                      />
                      <div class="dark:text-white/60 text-black/60">摧毁了</div>
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
                title="摧毁防御塔镀层"
                type="warning"
                :time="dayjs.duration(e.timestamp).format('mm:ss:SSS')"
              >
                <div class="flex gap-2 items-center w-fit cursor-pointer">
                  <ChampionIcon
                    :champion-id="participantMap[e.killerId]?.championId"
                    class="size-5 rounded"
                  />
                  <div class="dark:text-white/60 text-black/60">摧毁</div>
                  <div class="font-bold">
                    {{ e.laneType ? laneType(e.laneType) : '' }} 防御塔镀层
                  </div>
                </div>
              </NTimelineItem>
            </template>

            <NTimelineItem
              title="结束游戏"
              :time="dayjs.duration(firstAndEndTime.endTime).format('mm:ss:SSS')"
            />
          </NTimeline>
        </div>
      </NScrollbar>
    </div>

    <!-- 右侧：控制面板（与 DiffLineChart 风格一致） -->
    <NScrollbar class="!w-52">
      <div class="flex flex-col gap-3">
        <!-- 筛选器 -->
        <div class="flex flex-col gap-2 w-full">
          <div class="text-xs dark:text-white/60 text-black/60 font-semibold">筛选</div>
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
          <div class="h-px dark:bg-white/10 bg-black/10"></div>

          <div class="dark:text-white/60 text-black/60 text-xs font-semibold">防御塔镀层统计</div>

          <div class="flex flex-col gap-1">
            <div v-for="k of platesTakeParticipants">
              <div class="flex items-center gap-2">
                <ChampionIcon :champion-id="k.championId" class="size-5 rounded" />
                <div class="dark:text-white/80 text-black/80 text-sm">
                  {{ lcs.gameData.championName(k.championId) }}
                </div>
                <div :class="tagTheme">{{ k.platesTake }} 层</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </NScrollbar>
  </div>
  <div
    v-else
    class="w-full h-142 flex items-center justify-center dark:text-white/60 text-black/60 text-sm"
  >
    <template v-if="loadingDetails">
      <div class="flex gap-2 items-center">
        <NSpin :size="16" />
        <span>加载中...</span>
      </div>
    </template>
    <template v-else>
      <div class="flex gap-2 items-center">
        <span>暂无数据</span>
        <NButton type="primary" size="small" @click="onLoadDetails(basicInfo.gameId)">刷新</NButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import dayjs from 'dayjs'
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
