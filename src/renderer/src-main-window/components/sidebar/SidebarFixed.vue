<template>
  <div class="sidebar-fixed">
    <!-- respawn timer -->
    <NPopover
      placement="right"
      v-if="rts.settings.enabled && rts.info.isDead"
      :disabled="!isCollapsed"
    >
      <template #trigger>
        <div class="menu-item menu-item-no-click">
          <div class="menu-item__inner">
            <div class="menu-item__icon">
              <NProgress
                class="menu-item__icon-n-progress"
                type="circle"
                :gap-offset-degree="180"
                :stroke-width="4"
                :percentage="(rts.info.timeLeft / rts.info.totalTime) * 100"
                status="success"
              >
                <span class="font-size-12px">{{ formattedCountdown }}</span>
              </NProgress>
            </div>
            <div class="menu-item__label">
              {{
                t('SideBarFixed.respawnTimer.timeLeft', { seconds: rts.info.timeLeft.toFixed(0) })
              }}
              ({{ rts.info.totalTime.toFixed(0) }}
              s)
            </div>
          </div>
        </div>
      </template>
      <div>
        {{ t('SideBarFixed.respawnTimer.timeLeft', { seconds: rts.info.timeLeft.toFixed(0) }) }} ({{
          rts.info.totalTime.toFixed(0)
        }}
        s)
      </div>
    </NPopover>

    <!-- connection hub -->
    <NPopover placement="right-end" ref="popover-connection" :duration="250">
      <template #trigger>
        <div class="menu-item menu-item-no-click">
          <div class="menu-item__inner">
            <div class="menu-item__icon" v-if="lcs.summoner.me">
              <NProgress
                class="menu-item__icon-n-progress"
                @click="handleSummonerClick(lcs.summoner.me)"
                type="circle"
                :stroke-width="4"
                :percentage="
                  (lcs.summoner.me.xpSinceLastLevel / lcs.summoner.me.xpUntilNextLevel) * 100
                "
                :gap-degree="45"
              >
                <LcuImage
                  class="summoner-profile-icon"
                  :src="profileIconUri(lcs.summoner.me.profileIconId)"
                />
              </NProgress>
            </div>
            <NBadge
              v-else
              dot
              processing
              :show="!lcs.isInConnectionLoop && otherClients.length > 0"
            >
              <NIcon class="menu-item__icon"><PlugDisconnected20FilledIcon /></NIcon>
            </NBadge>
            <div class="menu-item__label">{{ t('SideBarFixed.notConnected') }}</div>
          </div>
        </div>
      </template>
      <ClientConnection ref="client-connection-body" />
    </NPopover>
    <NTooltip placement="right" :disabled="!isCollapsed">
      <template #trigger>
        <div class="menu-item" @click="handleOpenSettingsModal">
          <div class="menu-item__inner">
            <NIcon class="menu-item__icon"><Settings28FilledIcon /></NIcon>
            <div class="menu-item__label">{{ t('SideBarFixed.settings') }}</div>
          </div>
        </div>
      </template>
      <span class="menu-item-popover">
        {{ t('SideBarFixed.settings') }}
      </span>
    </NTooltip>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useRespawnTimerStore } from '@renderer-shared/shards/respawn-timer/store'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import {
  PlugDisconnected20Filled as PlugDisconnected20FilledIcon,
  Settings28Filled as Settings28FilledIcon
} from '@vicons/fluent'
import { useElementSize } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NBadge, NIcon, NPopover, NProgress, NTooltip } from 'naive-ui'
import { computed, inject, useTemplateRef, watch } from 'vue'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

import ClientConnection from './ClientConnection.vue'

const { isCollapsed = false } = defineProps<{
  isCollapsed?: boolean
}>()

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lcuxs = useLeagueClientUxStore()
const rts = useRespawnTimerStore()

const mh = useInstance(MatchHistoryTabsRenderer)

const formattedCountdown = computed(() => {
  const seconds = rts.info.timeLeft
  return seconds > 99 ? '99+' : `${seconds.toFixed(0)}`
})

const { navigateToTabByPuuid } = mh.useNavigateToTab()

const handleSummonerClick = (summoner: SummonerInfo) => {
  navigateToTabByPuuid(summoner.puuid)
}

const { openSettingsModal } = inject('app') as any
const handleOpenSettingsModal = () => {
  openSettingsModal()
}

const otherClients = computed(() => {
  return lcuxs.launchedClients.filter((c) => c.pid !== lcs.auth?.pid)
})

const popoverEl = useTemplateRef('popover-connection')
const clientConnectionBody = useTemplateRef('client-connection-body')

const { height } = useElementSize(() => clientConnectionBody.value?.$el)
watch(
  () => height.value,
  () => {
    popoverEl.value?.syncPosition()
  }
)
</script>

<style scoped>
.sidebar-fixed {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  width: 100%;
  position: relative;
  padding: 0 4px;
  box-sizing: border-box;
  cursor: pointer;

  .menu-item__inner {
    display: flex;
    gap: 4px;
    width: 100%;
    position: relative;
    align-items: center;
    border-radius: 8px;
    transition: background-color 0.2s;
    /* overflow: hidden; */
    padding: 0 4px;
    box-sizing: border-box;

    .summoner-profile-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
    }
  }

  .menu-item__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    width: 36px;
    font-size: 16px;
    transition:
      color 0.2s,
      font-size 0.2s;
    flex-shrink: 0;

    .collapsed & {
      font-size: 18px;
    }
  }

  .menu-item__icon-n-progress {
    width: 24px;
    height: 24px;
  }

  .menu-item__label {
    font-size: 14px;
    text-wrap-mode: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    transition:
      color 0.2s,
      opacity 0.2s;

    .collapsed & {
      opacity: 0;
    }
  }

  &:hover {
    .menu-item__icon,
    .menu-item__label {
      color: rgba(255, 255, 255, 1);
    }

    .menu-item__inner {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  &:not(.menu-item-no-click):active {
    .menu-item__icon,
    .menu-item__label {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .menu-item__icon,
  .menu-item__label {
    color: rgba(255, 255, 255, 0.8);
  }
}

.menu-item-popover {
  font-weight: bold;
  font-size: 14px;
}

.summoner-name {
  display: flex;
  align-items: flex-end;
  cursor: pointer;

  .game-name-line {
    font-size: 14px;
    font-weight: bold;
  }

  .tag-line {
    margin-left: 4px;
    font-size: 12px;
  }
}

.separator {
  margin: 8px 0;
  width: 100%;
  height: 1px;
}

.title-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 12px;

  .icon {
    font-size: 16px;
  }
}

.client {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: 0.2s all ease;
  border-radius: 2px;
  padding: 4px 16px;

  &.connectable {
    cursor: pointer;
  }

  .region-name {
    font-size: 12px;
    font-weight: bold;
  }

  .pid {
    font-size: 10px;
  }

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .loading {
    position: absolute;
    right: 0px;
    bottom: 0px;
  }
}

.font-size-12px {
  font-size: 12px;
}
</style>
