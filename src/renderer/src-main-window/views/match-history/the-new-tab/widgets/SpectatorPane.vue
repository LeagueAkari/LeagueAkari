<template>
  <div class="px-4 py-2 dark:bg-white/5 rounded bg-black/5" v-if="spectatorData">
    <!-- Queue Info -->
    <div class="flex items-center">
      <IndicatorPulse class="mr-2" />
      <div class="text-sm font-bold flex-1 w-0 truncate dark:text-white text-gray-900">
        {{
          lcs.gameData.queues[spectatorData.game.gameQueueConfigId]?.name ||
          spectatorData.game.gameQueueConfigId
        }}
      </div>
      <NPopover>
        <template #trigger>
          <NButton
            size="tiny"
            @click="() => handleSpectate(false)"
            :disabled="!isSpectatorAvailable || !canSpectate"
          >
            <template #icon>
              <NIcon><PlayCircleFilledIcon /></NIcon>
            </template>
            {{ t('SpectateStatus.button') }}
          </NButton>
        </template>
        <ControlItem
          class="mb-2"
          v-if="!isCrossRegion"
          :label="t('SpectateStatus.lcuSpectate.label')"
          :label-width="240"
        >
          <template #labelDescription>
            <div>{{ t('SpectateStatus.lcuSpectate.description') }}</div>
            <div class="text-yellow-400" v-if="lcs.gameflow.phase !== 'None'">
              {{ t('SpectateStatus.lcuSpectate.descriptionNotIdle') }}
            </div>
          </template>
          <NButton
            size="tiny"
            @click="() => handleSpectate(true)"
            :disabled="!isSpectatorAvailable || !canSpectate || lcs.gameflow.phase !== 'None'"
          >
            <template #icon>
              <NIcon><PlayCircleFilledIcon /></NIcon>
            </template>
            {{ t('SpectateStatus.lcuSpectate.button') }}
          </NButton>
        </ControlItem>
        <ControlItem
          :label="t('SpectateStatus.tokenSpectate.label')"
          :label-width="240"
          :label-description="t('SpectateStatus.tokenSpectate.description')"
        >
          <NButton size="tiny" @click="handleCopyToken" :disabled="!canSpectate">
            <template #icon>
              <NIcon><CopyAllFilledIcon /></NIcon>
            </template>
            {{ t('SpectateStatus.tokenSpectate.button') }}
          </NButton>
        </ControlItem>
      </NPopover>
    </div>

    <!-- Time Info -->
    <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-1">
      {{
        t('SpectateStatus.startFrom', {
          date: dayjs(spectatorData.playerCredentials.gameCreateDate).format('MM-DD HH:mm:ss'),
          relativeTime: relativeText
        })
      }}
    </div>

    <!-- Divider -->
    <div class="h-px bg-white/10 my-2"></div>

    <!-- Cherry Bans (斗魂竞技场) -->
    <div
      class="flex mb-2"
      v-if="spectatorData.game.gameMode === 'CHERRY' && spectatorData.game.bannedChampions.length"
    >
      <span class="text-10px text-gray-400 mr-1">{{ t('SpectateStatus.bans') }}</span>
      <div class="ml-auto flex items-end gap-0.5 flex-wrap max-w-160px">
        <LcuImage
          class="w-18px h-18px"
          v-for="ban of spectatorData.game.bannedChampions"
          :key="ban.championId"
          :src="championIconUri(ban.championId)"
        />
      </div>
    </div>

    <!-- Teams -->
    <div class="space-y-2">
      <!-- Team 1 -->
      <div v-if="teams?.team1?.players?.length">
        <div class="flex text-sm font-bold mb-1 dark:text-white text-gray-900">
          <span v-if="teams.team1.name">{{ teams.team1.name }}</span>
          <div class="ml-auto flex items-end gap-0.5" v-if="teams.team1.bans?.length">
            <span class="text-10px font-normal text-gray-400 mr-0.5">{{
              t('SpectateStatus.bans')
            }}</span>
            <LcuImage
              class="w-18px h-18px"
              v-for="ban of teams.team1.bans"
              :key="ban.championId"
              :src="championIconUri(ban.championId)"
            />
          </div>
        </div>
        <div
          class="flex flex-col gap-0.5 p-1 rounded-sm"
          :class="{
            'bg-blue-900/20': teams.team1.id === 100 || teams.team1.id === 0,
            'bg-red-900/20': teams.team1.id === 200
          }"
        >
          <div
            v-for="(player, index) in teams.team1.players"
            :key="player.puuid"
            class="flex items-center"
          >
            <PositionIcon
              v-if="player.selectedPosition !== 'NONE'"
              class="text-18px text-white/80 mr-0.5"
              :position="player.selectedPosition"
            />
            <LcuImage
              v-if="isTftMode"
              class="w-18px h-18px"
              :src="profileIconUri(player.profileIconId)"
            />
            <LcuImage v-else class="w-18px h-18px" :src="championIconUri(player.championId)" />
            <div
              v-if="premadeInfo[player.puuid]"
              class="text-11px font-bold leading-11px p-0.5 rounded-sm bg-white/20 min-w-12px text-center ml-1"
              :style="{ color: premadeInfo[player.puuid].color.foregroundColor }"
            >
              {{ premadeInfo[player.puuid]?.teamName }}
            </div>
            <div
              class="ml-0.5 text-xs cursor-pointer transition-colors px-0.5 rounded-sm hover:bg-white/20"
              @click="() => navigateToSummonerByPuuid(player.puuid, true)"
              @mouseup.prevent="(event) => handleMouseUp(event, player.puuid)"
              @mousedown="handleMouseDown"
              :class="{ 'font-bold': player.puuid === puuid }"
              :style="{ color: premadeInfo[player.puuid]?.color.foregroundColor || '#fffd' }"
            >
              <StreamerModeMaskedText>
                <template #masked>
                  <span class="font-bold">{{ summonerName(player.puuid, index) }}</span>
                </template>
                <span class="font-bold">{{
                  updatedSummonerInfo[player.puuid]?.gameName || player.summonerName
                }}</span>
                <span v-if="updatedSummonerInfo[player.puuid]" class="text-11px ml-0.5"
                  >#{{ updatedSummonerInfo[player.puuid].tagLine }}</span
                >
              </StreamerModeMaskedText>
            </div>
          </div>
        </div>
      </div>

      <!-- Team 2 -->
      <div v-if="teams?.team2?.players?.length">
        <div class="flex text-sm font-bold mb-1 dark:text-white text-gray-900">
          <span v-if="teams.team2.name">{{ teams.team2.name }}</span>
          <div class="ml-auto flex items-end gap-0.5" v-if="teams.team2.bans?.length">
            <span class="text-10px font-normal text-gray-400 mr-0.5">{{
              t('SpectateStatus.bans')
            }}</span>
            <LcuImage
              class="w-18px h-18px"
              v-for="ban of teams.team2.bans"
              :key="ban.championId"
              :src="championIconUri(ban.championId)"
            />
          </div>
        </div>
        <div
          class="flex flex-col gap-0.5 p-1 rounded-sm"
          :class="{
            'bg-blue-900/20': teams.team2.id === 100,
            'bg-red-900/20': teams.team2.id === 200
          }"
        >
          <div
            v-for="(player, index) in teams.team2.players"
            :key="player.puuid"
            class="flex items-center"
          >
            <PositionIcon
              v-if="player.selectedPosition !== 'NONE'"
              class="text-18px text-white/80 mr-0.5"
              :position="player.selectedPosition"
            />
            <LcuImage
              v-if="isTftMode"
              class="w-18px h-18px"
              :src="profileIconUri(player.profileIconId)"
            />
            <LcuImage v-else class="w-18px h-18px" :src="championIconUri(player.championId)" />
            <div
              v-if="premadeInfo[player.puuid]"
              class="text-11px font-bold leading-11px p-0.5 rounded-sm bg-white/20 min-w-12px text-center ml-1"
              :style="{ color: premadeInfo[player.puuid].color.foregroundColor }"
            >
              {{ premadeInfo[player.puuid]?.teamName }}
            </div>
            <div
              class="ml-0.5 text-xs cursor-pointer transition-colors px-0.5 rounded-sm hover:bg-white/20"
              @click="() => navigateToSummonerByPuuid(player.puuid, true)"
              @mouseup.prevent="(event) => handleMouseUp(event, player.puuid)"
              @mousedown="handleMouseDown"
              :class="{ 'font-bold': player.puuid === puuid }"
              :style="{ color: premadeInfo[player.puuid]?.color.foregroundColor || '#fffd' }"
            >
              <StreamerModeMaskedText>
                <template #masked>
                  <span class="font-bold">{{
                    summonerName(player.puuid, index + (teams.team1?.players?.length || 0))
                  }}</span>
                </template>
                <span class="font-bold">{{
                  updatedSummonerInfo[player.puuid]?.gameName || player.summonerName
                }}</span>
                <span v-if="updatedSummonerInfo[player.puuid]" class="text-11px ml-0.5"
                  >#{{ updatedSummonerInfo[player.puuid].tagLine }}</span
                >
              </StreamerModeMaskedText>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import {
  PREMADE_TEAMS,
  PREMADE_TEAM_COLORS
} from '@renderer-shared/components/ongoing-game-panel/ongoing-game-utils'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri, profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import {
  CopyAllFilled as CopyAllFilledIcon,
  PlayCircleFilled as PlayCircleFilledIcon
} from '@vicons/material'
import { useIntervalFn, useTimeoutFn } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NPopover, useMessage } from 'naive-ui'
import { computed, ref, shallowRef, watch } from 'vue'

import IndicatorPulse from '../../widgets/IndicatorPulse.vue'
import { usePlayerTab } from '../context'
import { useSpectator } from '../data/spectator'

const { t } = useTranslation()

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const sgps = useSgpStore()

const rc = useInstance(RiotClientRenderer)

const { puuid, sgpServerId, navigateToSummonerByPuuid } = usePlayerTab()
const { spectatorData, launchSpectator } = useSpectator()

const isCrossRegion = computed(() => sgps.availability.sgpServerId !== sgpServerId.value)

const canSpectate = computed(() => true)

const isTftMode = computed(() => spectatorData.value?.game.gameMode === 'TFT')

const teams = computed(() => {
  if (!spectatorData.value) {
    return null
  }

  const data = spectatorData.value

  if (data.game.gameMode === 'CHERRY') {
    return {
      team1: {
        id: 0,
        name: t('teams.TEAM-ALL', { ns: 'common' }),
        players: data.game.teamOne
      }
    }
  } else if (data.game.gameMode === 'TFT') {
    return {
      team1: {
        id: 0,
        name: '',
        players: data.game.teamOne
      }
    }
  }

  return {
    team1: {
      id: 100,
      name: t('teams.TEAM-100', { ns: 'common' }),
      players: data.game.teamOne,
      bans: data.game.bannedChampions.filter((ban) => ban.teamId === 100)
    },
    team2: {
      id: 200,
      name: t('teams.TEAM-200', { ns: 'common' }),
      players: data.game.teamTwo,
      bans: data.game.bannedChampions.filter((ban) => ban.teamId === 200)
    }
  }
})

// 相对时间文本
const relativeText = ref('')

useIntervalFn(
  () => {
    if (spectatorData.value) {
      relativeText.value = dayjs(spectatorData.value.playerCredentials.gameCreateDate)
        .locale(as.settings.locale.toLowerCase())
        .fromNow()
    }
  },
  1000 * 10,
  { immediate: true, immediateCallback: true }
)

watch(
  [() => spectatorData.value, () => as.settings.locale],
  ([data, locale]) => {
    if (data) {
      relativeText.value = dayjs(data.playerCredentials.gameCreateDate)
        .locale(locale.toLowerCase())
        .fromNow()
    }
  },
  { immediate: true }
)

// 更新召唤师信息
const updatedSummonerInfo = shallowRef<Record<string, { gameName: string; tagLine: string }>>({})

watch(
  spectatorData,
  async (data) => {
    if (data) {
      const puuids = data.game.teamOne.concat(data.game.teamTwo).map((p) => p.puuid)

      for (const puuid of puuids) {
        if (updatedSummonerInfo.value[puuid]) {
          continue
        }

        try {
          const { data: nameData } = await rc.api.playerAccount.getPlayerAccountNameset([puuid])

          if (nameData.namesets.length === 0) {
            continue
          }

          updatedSummonerInfo.value = {
            ...updatedSummonerInfo.value,
            [puuid]: {
              gameName: nameData.namesets[0].gnt.gameName,
              tagLine: nameData.namesets[0].gnt.tagLine
            }
          }
        } catch {}
      }
    }
  },
  { immediate: true }
)

// 防呆设计
const isSpectatorAvailable = ref(true)
const { start: startCooldown } = useTimeoutFn(() => {
  isSpectatorAvailable.value = true
}, 2000)

const handleSpectate = (byLcuApi: boolean) => {
  isSpectatorAvailable.value = false
  startCooldown()
  launchSpectator(byLcuApi)
}

const message = useMessage()

const handleCopyToken = () => {
  if (!spectatorData.value) return

  const token = {
    akariVersion: as.version,
    sgpServerId: sgpServerId.value,
    observerEncryptionKey: spectatorData.value.playerCredentials.observerEncryptionKey,
    observerServerPort: spectatorData.value.playerCredentials.observerServerPort,
    observerServerIp: spectatorData.value.playerCredentials.observerServerIp,
    gameId: spectatorData.value.game.id,
    gameMode: spectatorData.value.game.gameMode
  }

  const str = JSON.stringify(token)

  navigator.clipboard
    .writeText(str)
    .then(() => {
      message.success(t('SpectateStatus.tokenSpectate.copied'))
    })
    .catch(() => {
      message.error(t('SpectateStatus.tokenSpectate.copyFailed'))
    })
}

const { summonerName } = useStreamerModeMaskedText()

const handleMouseDown = (event: MouseEvent) => {
  if (event.button === 1) {
    event.preventDefault()
  }
}

const handleMouseUp = (event: MouseEvent, playerPuuid: string) => {
  if (event.button === 1) {
    navigateToSummonerByPuuid(playerPuuid, false)
  }
}

// 组队信息
const premadeInfo = computed(() => {
  if (!spectatorData.value) {
    return {}
  }

  let index = 0
  const teams: Record<number, string[]> = {}

  ;[...spectatorData.value.game.teamOne, ...spectatorData.value.game.teamTwo].forEach((player) => {
    if (!teams[player.teamParticipantId]) {
      teams[player.teamParticipantId] = []
    }
    teams[player.teamParticipantId].push(player.puuid)
  })

  return Object.entries(teams).reduce(
    (prev, cur) => {
      const [_teamId, puuids] = cur

      if (puuids.length < 2) {
        return prev
      }

      const teamName = PREMADE_TEAMS[index++]
      const color = PREMADE_TEAM_COLORS[teamName]
      puuids.forEach((puuid) => {
        prev[puuid] = {
          color,
          teamName
        }
      })

      return prev
    },
    {} as Record<string, any>
  )
})
</script>
