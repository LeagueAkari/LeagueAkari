<template>
  <div class="client-connection">
    <div class="client-group" v-if="lcs.auth">
      <div class="group-name">{{ $t('ClientConnection.connectedGroup') }}</div>
      <div class="clients">
        <div class="client connected">
          <div class="client-wrapper">
            <LcuImage
              class="client-icon"
              :src="lcs.summoner.me ? profileIconUri(lcs.summoner.me.profileIconId) : undefined"
            />
            <div class="client-info">
              <NEllipsis class="summoner-name" v-if="lcs.summoner.me">
                <span class="summoner-name-text">{{ lcs.summoner.me.gameName }}</span>
                <span class="summoner-name-tag">#{{ lcs.summoner.me.tagLine }}</span>
              </NEllipsis>
              <div class="summoner-name-none" v-else>{{ $t('ClientConnection.noData') }}</div>
              <div class="client-region">
                {{
                  sgps.sgpServerConfig.serverNames[as.settings.locale]?.[
                    sgps.availability.sgpServerId
                  ] || sgps.availability.sgpServerId
                }}
              </div>
            </div>
          </div>
          <div class="client-actions">
            <NButton size="tiny" secondary @click="handleRestartUx">
              <template #icon>
                <NIcon>
                  <RefreshIcon />
                </NIcon>
              </template>
              {{ $t('ClientConnection.restartUx') }}
            </NButton>
            <NButton size="tiny" secondary @click="() => lc.disconnect()">
              <template #icon>
                <NIcon>
                  <PlugDisconnected24FilledIcon />
                </NIcon>
              </template>
              {{ $t('ClientConnection.disconnect') }}
            </NButton>
            <NDropdown
              :theme-overrides="{
                color: '#222e',
                fontSizeSmall: '12px',
                optionHeightSmall: '24px'
              }"
              trigger="click"
              placement="top-start"
              size="small"
              :options="actions"
              @select="handleActionSelect"
            >
              <NButton size="tiny" secondary>
                <template #icon>
                  <NIcon>
                    <MoreHorizFilledIcon />
                  </NIcon>
                </template>
                {{ $t('ClientConnection.more') }}
              </NButton>
            </NDropdown>
          </div>
        </div>
      </div>
    </div>
    <div class="client-group" v-if="otherClients.length > 0">
      <div class="group-name" v-if="lcs.auth">
        {{ $t('ClientConnection.launchedOtherClientsGroup') }}
      </div>
      <div class="group-name" v-else>
        {{ $t('ClientConnection.launchedClientsGroup') }}
      </div>
      <NScrollbar style="max-height: 240px">
        <div class="clients">
          <div
            class="client"
            v-for="cmd of otherClients"
            :key="cmd.pid"
            @click="handleConnect(cmd)"
          >
            <div class="client-wrapper">
              <LcuImage
                class="client-icon"
                :src="clientExtraInfo[cmd.pid] ? clientExtraInfo[cmd.pid].profileIcon : undefined"
              />
              <div class="client-info">
                <NEllipsis class="summoner-name" v-if="clientExtraInfo[cmd.pid]">
                  <span class="summoner-name-text">{{
                    clientExtraInfo[cmd.pid].summoner.gameName
                  }}</span>
                  <span class="summoner-name-tag"
                    >#{{ clientExtraInfo[cmd.pid].summoner.tagLine }}</span
                  >
                </NEllipsis>
                <div class="summoner-name-none" v-else>{{ $t('ClientConnection.noData') }}</div>
                <div class="client-region">
                  {{
                    sgps.sgpServerConfig.serverNames[as.settings.locale]?.[
                      getSgpServerId(cmd.region, cmd.rsoPlatformId)
                    ] || getSgpServerId(cmd.region, cmd.rsoPlatformId)
                  }}
                  (PID: {{ cmd.pid }})
                </div>
              </div>
              <div class="connecting-indicator" v-if="lcs.connectingClient?.pid === cmd.pid">
                <NSpin :size="10" />
                <span class="connecting-indicator-text">{{
                  $t('ClientConnection.connecting')
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </NScrollbar>
    </div>
    <div class="client-group" v-if="!lcs.auth && otherClients.length === 0">
      <div class="group-name">{{ $t('ClientConnection.noClientGroup') }}</div>
      <div class="no-client">{{ $t('ClientConnection.noClient') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { UxCommandLine, useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { getSgpServerId } from '@shared/data-sources/sgp/utils'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { PlugDisconnected24Filled as PlugDisconnected24FilledIcon } from '@vicons/fluent'
import { RefreshSharp as RefreshIcon } from '@vicons/ionicons5'
import {
  CloseFilled as CloseFilledIcon,
  MoreHorizFilled as MoreHorizFilledIcon,
  MoveDownFilled as MoveDownFilledIcon,
  RocketLaunchRound as RocketLaunchRoundIcon
} from '@vicons/material'
import { useIntervalFn } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NEllipsis, NIcon, NScrollbar, NSpin } from 'naive-ui'
import { computed, h, ref, watch } from 'vue'

const { t } = useTranslation()

const lc = useInstance(LeagueClientRenderer)

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const lcuxs = useLeagueClientUxStore()

const sgps = useSgpStore()

const otherClients = computed(() => {
  return lcuxs.launchedClients.filter((c) => c.pid !== lcs.auth?.pid)
})

const actions = computed(() => {
  return [
    {
      label: t('ClientConnection.launchUx'),
      key: 'start-ux',
      icon: () => h(NIcon, () => h(RocketLaunchRoundIcon))
    },
    {
      label: t('ClientConnection.killUx'),
      key: 'close-ux',
      icon: () => h(NIcon, () => h(CloseFilledIcon))
    },
    {
      type: 'divider'
    },
    {
      label: t('ClientConnection.quitClient'),
      key: 'quit-client',
      icon: () => h(NIcon, () => h(CloseFilledIcon))
    }
  ]
})

const clientExtraInfo = ref<
  Record<string, { summoner: SummonerInfo; profileIcon: string; lastUpdate: number }>
>({})

const updateConnectableClientExtraInfo = async () => {
  const peekFn = async (cmd: UxCommandLine) => {
    const prev = clientExtraInfo.value[cmd.pid]
    const data = await lc.peekClient(cmd)

    if (prev) {
      if (!data) {
        delete clientExtraInfo.value[cmd.pid]
        return
      }

      if (Date.now() - prev.lastUpdate > 2 * 60 * 1000) {
        clientExtraInfo.value[cmd.pid] = { ...data, lastUpdate: Date.now() }
      }
    } else {
      if (data) {
        clientExtraInfo.value[cmd.pid] = { ...data, lastUpdate: Date.now() }
      }
    }
  }

  for (const pid of Object.keys(clientExtraInfo.value)) {
    if (!otherClients.value.find((cmd) => cmd?.pid.toString() === pid)) {
      delete clientExtraInfo.value[pid]
    }
  }

  for (const cmd of otherClients.value) {
    peekFn(cmd)
  }
}

const { resume } = useIntervalFn(updateConnectableClientExtraInfo, 1 * 60 * 1000, {
  immediate: false,
  immediateCallback: true
})

watch(
  () => otherClients.value,
  () => {
    resume()
  },
  { immediate: true }
)

const handleConnect = (cmd: UxCommandLine) => {
  if (lcs.connectingClient?.pid === cmd.pid) {
    lc.disconnect()
    return
  }

  lc.connect(cmd)
}

const handleRestartUx = async () => {
  try {
    await lc.api.riotclient.restartUx()
  } catch (error) {
    console.error(error)
  }
}

const handleKillUx = async () => {
  try {
    await lc.api.riotclient.killUx()
  } catch (error) {
    console.error(error)
  }
}

const handleLaunchUx = async () => {
  try {
    await lc.api.riotclient.launchUx()
  } catch (error) {
    console.error(error)
  }
}

const handleQuitClient = async () => {
  try {
    await lc.api.processControl.quit()
  } catch (error) {
    console.error(error)
  }
}

const handleActionSelect = async (key: string) => {
  switch (key) {
    case 'start-ux':
      await handleLaunchUx()
      break
    case 'close-ux':
      await handleKillUx()
      break
    case 'quit-client':
      await handleQuitClient()
      break
  }
}
</script>

<style lang="less" scoped>
.client-connection {
  display: flex;
  flex-direction: column;
}

.client-group {
  .group-name {
    margin-bottom: 8px;
    color: #fffb;
    font-weight: bold;
  }

  &:not(:last-child) {
    margin-bottom: 16px;
  }
}

.clients {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.client {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid #fff2;
  padding: 8px 12px;
  transition: background-color 0.2s ease-in-out;
  box-shadow: 0 0 2px 2px #0002;
  width: 200px;

  &:not(.connected):hover {
    background-color: #fff1;
    cursor: pointer;
  }

  .connecting-indicator {
    position: absolute;
    bottom: 8px;
    right: 8px;
    display: flex;
    gap: 4px;

    .connecting-indicator-text {
      font-size: 10px;
    }
  }
}

.client .client-wrapper {
  display: flex;

  .client-icon {
    width: 36px;
    height: 36px;
    margin-right: 8px;
    border-radius: 50%;
  }

  .client-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    margin-right: 12px;
    flex: 1;
    width: 0;

    .summoner-name {
      width: 100%;

      .summoner-name-text {
        color: #fff;
        font-size: 14px;
        font-weight: bold;
      }

      .summoner-name-tag {
        margin-left: 4px;
        color: #fffa;
        font-size: 12px;
      }
    }

    .summoner-name-none {
      color: #fffa;
      font-size: 12px;
      font-style: italic;
    }

    .client-region {
      font-size: 10px;
      color: #fffa;
    }
  }
}

.client .client-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}
</style>
