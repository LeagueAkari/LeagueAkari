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
            <div class="menu-item__custom-icon">
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
          <div
            class="menu-item__inner"
            @click="lcs.summoner.me ? handleSummonerClick(lcs.summoner.me) : undefined"
          >
            <div class="menu-item__custom-icon" v-if="lcs.summoner.me">
              <NProgress
                class="menu-item__icon-n-progress"
                type="circle"
                :stroke-width="4"
                :percentage="
                  (lcs.summoner.me.xpSinceLastLevel / lcs.summoner.me.xpUntilNextLevel) * 100 + 60
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
              :offset="[-6, 8]"
              :show="!lcs.isInConnectionLoop && otherClients.length > 0"
            >
              <NIcon class="menu-item__icon"><PlugDisconnected20FilledIcon /></NIcon>
            </NBadge>
            <template v-if="lcs.isConnected">
              <StreamerModeMaskedText>
                <template #masked>
                  <div class="menu-item__label">{{ t('summoner', { ns: 'common' }) }}</div>
                </template>
                <div class="menu-item__label" v-if="lcs.summoner.me">
                  <span class="menu-item__label-game-name">{{ lcs.summoner.me.gameName }}</span>
                  <span class="menu-item__label-tag-line">#{{ lcs.summoner.me.tagLine }}</span>
                </div>
                <div class="menu-item__label" v-else>{{ t('SideBarFixed.unknown') }}</div>
              </StreamerModeMaskedText>
            </template>
            <template v-else-if="lcs.isInConnectionLoop">
              <div class="menu-item__label">{{ t('SideBarFixed.inConnectionLoop') }}</div>
            </template>
            <template v-else>
              <div class="menu-item__label menu-item__label--not-connected">
                {{ t('SideBarFixed.notConnected') }}
              </div>
            </template>
          </div>
        </div>
      </template>
      <ClientConnection ref="client-connection-body" />
    </NPopover>

    <!-- settings -->
    <NTooltip placement="right" :disabled="!isCollapsed">
      <template #trigger>
        <div class="menu-item" @click="() => openSettingsModal()">
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
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useRespawnTimerStore } from '@renderer-shared/shards/respawn-timer/store'
import { useMainWindowStore } from '@renderer-shared/shards/window-manager/store'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import {
  PlugDisconnected20Filled as PlugDisconnected20FilledIcon,
  Settings28Filled as Settings28FilledIcon
} from '@vicons/fluent'
import { useElementSize } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NBadge, NIcon, NPopover, NProgress, NTooltip, useNotification } from 'naive-ui'
import { computed, useTemplateRef, watch } from 'vue'

import { useAppContext } from '@main-window/context'
import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'

import ClientConnection from './ClientConnection.vue'

const { isCollapsed = false } = defineProps<{
  isCollapsed?: boolean
}>()

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lcuxs = useLeagueClientUxStore()
const rts = useRespawnTimerStore()
const mws = useMainWindowStore()

const pt = useInstance(PlayerTabsRenderer)

const formattedCountdown = computed(() => {
  const seconds = rts.info.timeLeft
  return seconds > 99 ? '99+' : `${seconds.toFixed(0)}`
})

const notification = useNotification()

watch(
  () => rts.info.isDead,
  (isDead, prevIsDead) => {
    if (!isDead && prevIsDead && mws.focus === 'focused') {
      notification.success({
        title: t('SideBarFixed.respawned'),
        content: t('SideBarFixed.respawnedContent'),
        duration: 4000
      })
    }
  }
)

const { navigateToTabByPuuid } = pt.useNavigateToTab()

const handleSummonerClick = (summoner: SummonerInfo) => {
  navigateToTabByPuuid(summoner.puuid)
}

const { openSettingsModal } = useAppContext()

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
    padding: 0 4px;
    box-sizing: border-box;
  }

  .menu-item__icon,
  .menu-item__custom-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    width: 36px;
    flex-shrink: 0;
  }

  .menu-item__icon {
    font-size: 16px;
    transition:
      color 0.2s,
      font-size 0.2s;

    .collapsed & {
      font-size: 20px;
    }
  }

  .menu-item__icon-n-progress {
    width: 24px;
    height: 24px;
    transition:
      width 0.2s,
      height 0.2s;

    .collapsed & {
      width: 28px;
      height: 28px;
    }

    .summoner-profile-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      transition:
        width 0.2s,
        height 0.2s;
      max-width: none;

      .collapsed & {
        width: 24px;
        height: 24px;
      }
    }
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

    .menu-item__label-game-name {
      font-weight: bold;
    }

    .menu-item__label-tag-line {
      font-size: 12px;
      margin-left: 4px;
      color: rgba(0, 0, 0, 0.6);

      [data-theme='dark'] & {
        color: rgba(255, 255, 255, 0.6);
      }
    }

    &.menu-item__label--not-connected {
      color: rgba(0, 0, 0, 0.6);

      [data-theme='dark'] & {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }

  &:hover {
    .menu-item__icon,
    .menu-item__label {
      color: rgba(0, 0, 0, 1);

      [data-theme='dark'] & {
        color: rgba(255, 255, 255, 1);
      }
    }

    .menu-item__inner {
      background-color: rgba(0, 0, 0, 0.05);

      [data-theme='dark'] & {
        background-color: rgba(255, 255, 255, 0.05);
      }
    }
  }

  &:not(.menu-item-no-click):active {
    .menu-item__icon,
    .menu-item__label {
      color: rgba(0, 0, 0, 0.8);

      [data-theme='dark'] & {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  .menu-item__icon,
  .menu-item__label {
    color: rgba(0, 0, 0, 0.8);

    [data-theme='dark'] & {
      color: rgba(255, 255, 255, 0.8);
    }
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
