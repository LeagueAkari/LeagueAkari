<template>
  <div class="ongoing-game-title">
    <template v-if="titleModel.visible">
      <div class="labels" ref="labels" :style="{ opacity: horizontalOverflow ? 0 : 1 }">
        <LcuImage v-if="titleModel.mapIconUri" :src="titleModel.mapIconUri" class="map-icon" />
        <NIcon v-if="titleModel.showDraftIcon" class="draft-icon">
          <DraftModeIcon />
        </NIcon>

        <template v-for="(item, index) of titleModel.items" :key="`${item.kind}:${item.text}`">
          <span v-if="index > 0" class="dot-separator">·</span>
          <span :class="item.className">{{ item.text }}</span>
        </template>
      </div>

      <div class="action-controls">
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

        <NTooltip v-if="titleModel.showExitDraft" :z-index="TITLEBAR_TOOLTIP_Z_INDEX">
          <template #trigger>
            <NButton
              class="exit-draft-button"
              secondary
              type="warning"
              size="tiny"
              @click="() => og.clearDraft()"
            >
              <template #icon>
                <NIcon><CloseRoundIcon /></NIcon>
              </template>
              {{ t('OngoingGameTitle.exitDraft') }}
            </NButton>
          </template>
          {{ t('OngoingGameTitle.exitDraft') }}
        </NTooltip>

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

        <NPopover trigger="click" placement="bottom-end" :z-index="TITLEBAR_TOOLTIP_Z_INDEX" raw>
          <template #trigger>
            <NButton class="settings-button" secondary circle size="tiny">
              <template #icon>
                <NIcon><TuneIcon /></NIcon>
              </template>
            </NButton>
          </template>

          <div class="title-settings-panel">
            <SettingsSection no-bg>
              <SettingsRow
                :label="t('OngoingGameTitle.settings.orderPlayerBy.label')"
                :label-width="200"
              >
                <NSelect
                  class="title-settings-control"
                  size="small"
                  :consistent-menu-width="false"
                  :options="orderOptions"
                  :value="ogs.settings.orderPlayerBy"
                  @update:value="(val) => og.setOrderPlayerBy(val)"
                />
              </SettingsRow>

              <SettingsRow
                :label="t('OngoingGameTitle.settings.showJunglePathingForAllPlayers.label')"
                :label-description="
                  t('OngoingGameTitle.settings.showJunglePathingForAllPlayers.description')
                "
                :label-width="200"
              >
                <NSwitch
                  size="small"
                  :value="ogs.settings.showJunglePathingForAllPlayers"
                  @update:value="(val) => og.setShowJunglePathingForAllPlayers(val)"
                />
              </SettingsRow>
            </SettingsSection>

            <div class="title-settings-actions">
              <NButton size="small" secondary type="primary" @click="handleOpenOngoingGameSettings">
                {{ t('OngoingGameTitle.settings.openOngoingGameSettings') }}
              </NButton>
            </div>
          </div>
        </NPopover>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useMainWindowAppContext } from '@main-window/context'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useOverflow } from '@renderer-shared/composables/useOverflowDetection'
import { ALL_SGPTAG_VALUE, useSgpTagOptions } from '@renderer-shared/composables/useSgpTagOptions'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import {
  CloseRound as CloseRoundIcon,
  EditNoteRound as DraftModeIcon,
  RefreshRound as RefreshIcon,
  TuneRound as TuneIcon
} from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NPopover, NSelect, NSwitch, NTooltip } from 'naive-ui'
import { computed, useTemplateRef } from 'vue'

const { t } = useTranslation()

const TITLEBAR_TOOLTIP_Z_INDEX = 75000

const ogs = useOngoingGameStore()
const og = useInstance(OngoingGameRenderer)
const lcs = useLeagueClientStore()
const appCommon = useAppCommonStore()
const sgp = useSgpStore()
const { openSettingsModal } = useMainWindowAppContext()

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

const handleOpenOngoingGameSettings = () => {
  openSettingsModal('ongoing-game')
}

const teamNameMap = computed(() => ({
  'TEAM-100': t('teams.TEAM-100', { ns: 'common' }),
  'TEAM-200': t('teams.TEAM-200', { ns: 'common' }),
  'TEAM-ALL': t('teams.TEAM-ALL', { ns: 'common' }),
  spectating: t('OngoingGameTitle.spectating')
}))

type TitleItem = {
  kind: 'draft' | 'mode' | 'map' | 'team'
  text: string
  className: string
}

const createTitleItem = (kind: TitleItem['kind'], text: string): TitleItem => ({
  kind,
  text,
  className: kind === 'team' ? 'ongoing-title-side' : 'ongoing-title-text'
})

const draftTeamName = computed(() => {
  if (ogs.draft) {
    const ownerPuuid = ogs.draft.puuid
    const team = ownerPuuid
      ? Object.entries(ogs.teams).find(([_teamId, puuids]) => puuids.includes(ownerPuuid))
      : null

    return team ? teamNameMap.value[team[0]] : null
  }

  return null
})

const liveTitleItems = computed<TitleItem[]>(() => {
  const mapName = lcs.gameflow.session?.map.name
  const modeName =
    lcs.gameflow.session?.gameData.queue.name || lcs.gameflow.session?.map.gameModeShortName

  const selfPuuid = lcs.summoner.me?.puuid
  const team = Object.entries(ogs.teams).find(([_teamId, puuids]) =>
    puuids.some((puuid) => puuid === selfPuuid)
  )
  const teamName = team ? teamNameMap.value[team[0]] : teamNameMap.value['spectating']
  const items: TitleItem[] = []

  if (modeName && mapName && modeName === mapName) {
    items.push(createTitleItem('mode', modeName))
  } else {
    if (modeName) {
      items.push(createTitleItem('mode', modeName))
    }

    if (mapName) {
      items.push(createTitleItem('map', mapName))
    }
  }

  if (teamName) {
    items.push(createTitleItem('team', teamName))
  }

  return items
})

const draftTitleItems = computed<TitleItem[]>(() => {
  const items = [createTitleItem('draft', t('OngoingGameTitle.draftMode'))]

  if (draftTeamName.value) {
    items.push(createTitleItem('team', draftTeamName.value))
  }

  return items
})

const titleModel = computed(() => {
  const isDraft = Boolean(ogs.draft)

  return {
    visible: ogs.queryStage.phase !== 'unavailable' && !isCsSpectateWait.value,
    items: isDraft ? draftTitleItems.value : liveTitleItems.value,
    mapIconUri: isDraft ? null : lcs.gameflow.session?.map?.assets?.['game-select-icon-hover'],
    showDraftIcon: isDraft,
    showExitDraft: isDraft
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

.queue-tag-select {
  width: 160px;
  -webkit-app-region: no-drag;
}

.refresh-button {
  -webkit-app-region: no-drag;
}

.exit-draft-button {
  -webkit-app-region: no-drag;
}

.settings-button {
  -webkit-app-region: no-drag;
}

.title-settings-panel {
  box-sizing: border-box;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgb(0 0 0 / 0.12);
  background-color: rgb(250 250 250 / 0.98);
  color: rgb(0 0 0 / 0.86);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.18);
  -webkit-app-region: no-drag;
}

.title-settings-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.title-settings-control {
  width: 132px;
}

.map-icon {
  width: 18px;
  height: 18px;
  margin-right: 4px;
}

.draft-icon {
  font-size: 18px;
  margin-right: 2px;
  flex-shrink: 0;
}

.ongoing-title-text,
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

  .title-settings-panel {
    border-color: rgb(255 255 255 / 0.12);
    background-color: rgb(24 24 27 / 0.98);
    color: rgb(255 255 255 / 0.88);
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.36);
  }
}

[data-theme='light'] {
  .ongoing-game-title {
    color: #000d;
  }
}

[data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) {
  .ongoing-game-title {
    color: color-mix(in oklch, var(--la-color-text-themed) 92%, transparent);
  }
}
</style>
