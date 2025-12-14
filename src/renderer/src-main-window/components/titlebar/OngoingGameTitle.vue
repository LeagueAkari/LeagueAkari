<template>
  <div class="ongoing-game-title">
    <template v-if="ogs.queryStage.phase !== 'unavailable' && !isCsSpectateWait">
      <div class="labels" ref="labels" :style="{ opacity: horizontalOverflow ? 0 : 1 }">
        <LcuImage v-if="intelligence.mapIconUri" :src="intelligence.mapIconUri" class="map-icon" />
        <template
          v-if="
            intelligence.modeName &&
            intelligence.mapName &&
            intelligence.modeName === intelligence.mapName
          "
        >
          <span class="ongoing-title-map-name">{{ intelligence.modeName }}</span>
        </template>
        <template v-else>
          <span class="ongoing-title-map-name" v-if="intelligence.modeName">{{
            intelligence.modeName
          }}</span>
          <span class="dot-separator" v-if="intelligence.modeName && intelligence.mapName">·</span>
          <span class="ongoing-title-map-name" v-if="intelligence.mapName">{{
            intelligence.mapName
          }}</span>
        </template>
        <span class="dot-separator" v-if="intelligence.mapName && intelligence.teamName">·</span>
        <span class="ongoing-title-side" v-if="intelligence.teamName">
          {{ intelligence.teamName }}</span
        >
      </div>
      <div class="action-controls">
        <NSelect
          class="order-select"
          size="tiny"
          :consistent-menu-width="false"
          :options="orderOptions"
          :value="ogs.settings.orderPlayerBy"
          @update:value="(val) => og.setOrderPlayerBy(val)"
        />
        <NSelect
          class="queue-tag-select"
          v-if="
            appCommon.settings.preferredLolSource === 'sgp' &&
            sgp.availability.serversSupported.matchHistory
          "
          size="tiny"
          :value="ogs.matchHistoryTagParams?.tag || ALL_SGPTAG_VALUE"
          :consistent-menu-width="false"
          @update:value="handleSgpTagChange"
          :options="sgpTagOptions"
        />
        <NTooltip :z-index="TITLEBAR_TOOLTIP_Z_INDEX">
          <template #trigger>
            <NButton class="refresh-button" secondary circle size="tiny" @click="() => og.reload()">
              <template #icon>
                <NIcon><RefreshIcon /></NIcon>
              </template>
            </NButton>
          </template>
          {{ t('OngoingGameTitle.refresh') }}
        </NTooltip>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useOverflow } from '@renderer-shared/composables/useOverflowDetection'
import { ALL_SGPTAG_VALUE, useSgpTagOptions } from '@renderer-shared/composables/useSgpTagOptions'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { RefreshRound as RefreshIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NSelect, NTooltip } from 'naive-ui'
import { computed, useTemplateRef } from 'vue'

const { t } = useTranslation()

const TITLEBAR_TOOLTIP_Z_INDEX = 75000

const ogs = useOngoingGameStore()
const og = useInstance(OngoingGameRenderer)
const lcs = useLeagueClientStore()
const appCommon = useAppCommonStore()
const sgp = useSgpStore()

const labelsEl = useTemplateRef('labels')
const { horizontal: horizontalOverflow } = useOverflow(labelsEl)

const isCsSpectateWait = computed(() => {
  return (
    lcs.champSelect.session &&
    lcs.champSelect.session.isSpectating &&
    Object.values(ogs.teams).flat().length === 0
  )
})

const orderOptions = computed(() => {
  return [
    {
      label: t('OngoingGameTitle.orderOptions.default'),
      value: 'default'
    },
    {
      label: t('OngoingGameTitle.orderOptions.position'),
      value: 'position'
    },
    {
      label: t('OngoingGameTitle.orderOptions.premade-team'),
      value: 'premade-team'
    },
    {
      label: t('OngoingGameTitle.orderOptions.win-rate'),
      value: 'win-rate'
    },
    {
      label: t('OngoingGameTitle.orderOptions.kda'),
      value: 'kda'
    },
    {
      label: t('OngoingGameTitle.orderOptions.akari-score'),
      value: 'akari-score'
    }
  ]
})

const sgpTagOptions = useSgpTagOptions()

const handleSgpTagChange = (val: string) => {
  if (!val || val === ALL_SGPTAG_VALUE) {
    og.setMatchHistoryTagParams({})
    return
  }

  og.setMatchHistoryTagParams({
    tag: val,
    tagsQueryType: 'AND'
  })
}

const teamNameMap = computed(() => ({
  'TEAM-100': t('teams.TEAM-100', { ns: 'common' }),
  'TEAM-200': t('teams.TEAM-200', { ns: 'common' }),
  'TEAM-ALL': t('teams.TEAM-ALL', { ns: 'common' }),
  spectating: t('OngoingGameTitle.spectating')
}))

const intelligence = computed(() => {
  const mapName = lcs.gameflow.session?.map.name
  const modeName =
    lcs.gameflow.session?.gameData.queue.name || lcs.gameflow.session?.map.gameModeShortName

  const selfPuuid = lcs.summoner.me?.puuid
  const team = Object.entries(ogs.teams).find(([_teamId, puuids]) =>
    puuids.some((puuid) => puuid === selfPuuid)
  )
  const teamName = team ? teamNameMap.value[team[0]] : teamNameMap.value['spectating']

  return {
    mapName,
    modeName,
    teamName,
    mapIconUri: lcs.gameflow.session?.map?.assets?.['game-select-icon-hover']
  }
})
</script>

<style scoped>
.ongoing-game-title {
  height: 100%;
  align-items: center;
  display: flex;
  gap: 8px;
}

.labels {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 100%;
  flex: 1;
  overflow: hidden;
  transition: opacity 0.2s;
}

.order-select {
  width: 160px;
  -webkit-app-region: no-drag;
}

.queue-tag-select {
  width: 160px;
  -webkit-app-region: no-drag;
}

.refresh-button {
  -webkit-app-region: no-drag;
}

.map-icon {
  width: 18px;
  height: 18px;
  margin-right: 4px;
}

.ongoing-title-map-name {
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
}

.ongoing-title-side {
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
}

.action-controls {
  display: flex;
  gap: 8px;
  height: 100%;
  align-items: center;
  box-sizing: border-box;
}

[data-theme='dark'] {
  .ongoing-game-title {
    color: #fffd;
  }
}

[data-theme='light'] {
  .ongoing-game-title {
    color: #000d;
  }
}
</style>
