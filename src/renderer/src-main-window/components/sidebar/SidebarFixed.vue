<template>
  <div class="sidebar-fixed">
    <NPopover placement="right" v-if="rts.settings.enabled && rts.info.isDead">
      <template #trigger>
        <div class="menu-item">
          <div class="menu-item-inner">
            <NProgress
              type="circle"
              :gap-offset-degree="180"
              :stroke-width="4"
              :percentage="(rts.info.timeLeft / rts.info.totalTime) * 100"
              status="success"
            >
              <span class="respawn-timer-countdown">{{ formattedCountdown }}</span>
            </NProgress>
            <NIcon class="respawn-timer-hourglass"><HourglassIcon /></NIcon>
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
    <NPopover placement="right-end" ref="popover-connection" :duration="250">
      <template #trigger>
        <div class="menu-item">
          <div class="menu-item-inner">
            <NProgress
              v-if="lcs.summoner.me"
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
            <NBadge
              v-else
              dot
              processing
              :show="!lcs.isInConnectionLoop && otherClients.length > 0"
            >
              <NIcon class="menu-item-icon"><PlugDisconnected20FilledIcon /></NIcon>
            </NBadge>
          </div>
        </div>
      </template>
      <ClientConnection ref="client-connection-body" />
    </NPopover>
    <NTooltip placement="right">
      <template #trigger>
        <div class="menu-item" @click="handleOpenSettingsModal">
          <div class="menu-item-inner">
            <NIcon class="menu-item-icon"><Settings28FilledIcon /></NIcon>
          </div>
        </div>
      </template>
      <span class="simple-popover">
        <div class="title">{{ t('SideBarFixed.settings') }}</div>
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
import { Hourglass as HourglassIcon } from '@vicons/ionicons5'
import { useElementSize } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NBadge, NIcon, NPopover, NProgress, NTooltip } from 'naive-ui'
import { computed, inject, useTemplateRef, watch } from 'vue'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

import ClientConnection from './ClientConnection.vue'

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

<style lang="less" scoped>
.sidebar-fixed {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  position: relative;
  justify-content: center;
  align-items: center;
  height: 52px;
  width: 52px;
  padding: 2px;
  box-sizing: border-box;
  cursor: pointer;

  .menu-item-inner {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 72%;
    width: 72%;
    border-radius: 2px;

    .summoner-profile-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
    }
  }

  .menu-item-icon {
    font-size: 24px;
    transition: color 0.2s;
  }

  .menu-item-indicator {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    width: 5px;
    height: 64%;
    border-radius: 4px;
  }
}

.simple-popover {
  .title {
    font-weight: bold;
    font-size: 14px;
  }

  .content {
    margin-top: 8px;
    font-size: 12px;
  }
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

.no-client {
  font-size: 12px;
}

.respawn-timer-countdown {
  font-size: 12px;
}

.respawn-timer-hourglass {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 16px;
  transform: translate(25%, 25%);
  animation: hourglass-rotate 6s ease infinite;
}

[data-theme='dark'] {
  .menu-item {
    &:hover {
      .menu-item-icon {
        color: #fff;
      }
    }

    .menu-item-icon {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .summoner-name {
    .tag-line {
      color: rgba(255, 255, 255, 0.6);
    }
  }

  .region {
    .region-name {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .separator {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .title-label {
    color: rgba(255, 255, 255, 1);

    .icon {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .client {
    background-color: rgba(255, 255, 255, 0.03);

    &.connectable {
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      &:active {
        background-color: rgba(255, 255, 255, 0.08);
      }
    }

    .region-name {
      color: #fff;
    }

    .pid {
      color: #6a6a6ae3;
    }
  }

  .respawn-timer-hourglass {
    color: rgba(255, 255, 255, 0.4);
  }

  .no-client {
    color: rgba(255, 255, 255, 1);
  }

  .respawn-timer-countdown {
    color: rgba(255, 255, 255, 0.8);
  }
}

[data-theme='light'] {
  .menu-item {
    &:hover {
      .menu-item-icon {
        color: #000;
      }
    }

    .menu-item-icon {
      color: rgba(0, 0, 0, 0.8);
    }
  }

  .summoner-name {
    .tag-line {
      color: rgba(0, 0, 0, 0.6);
    }
  }

  .region {
    .region-name {
      color: rgba(0, 0, 0, 0.8);
    }
  }

  .separator {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .title-label {
    color: rgba(0, 0, 0, 1);

    .icon {
      color: rgba(0, 0, 0, 0.8);
    }
  }

  .client {
    background-color: rgba(0, 0, 0, 0.03);

    &.connectable {
      &:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      &:active {
        background-color: rgba(0, 0, 0, 0.08);
      }
    }

    .region-name {
      color: #000;
    }

    .pid {
      color: #3e3e3ee3;
    }
  }

  .respawn-timer-hourglass {
    color: rgba(0, 0, 0, 0.4);
  }

  .no-client {
    color: rgba(0, 0, 0, 1);
  }

  .respawn-timer-countdown {
    color: rgba(0, 0, 0, 0.8);
  }
}

@keyframes hourglass-rotate {
  0%,
  40% {
    transform: translate(25%, 25%) rotate(0deg); /* 保持静止 */
  }
  50%,
  90% {
    transform: translate(25%, 25%) rotate(180deg); /* 保持静止 */
  }
  100% {
    transform: translate(25%, 25%) rotate(360deg); /* 快速复原 */
  }
}
</style>
