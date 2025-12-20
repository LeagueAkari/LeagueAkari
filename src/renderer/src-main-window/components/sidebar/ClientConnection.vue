<template>
  <div class="flex flex-col">
    <div v-if="lcs.auth" class="mb-4 last:mb-0">
      <div class="mb-2 text-sm font-semibold text-black/70 dark:text-white/80">
        {{ $t('ClientConnection.connectedGroup') }}
      </div>

      <div class="flex flex-col gap-1">
        <div
          class="relative flex w-[222px] flex-col rounded-lg border border-black/10 bg-black/5 px-3 py-2 dark:bg-white/5"
        >
          <div class="flex">
            <LcuImage
              class="mr-2 h-9 w-9 rounded-full"
              :src="lcs.summoner.me ? profileIconUri(lcs.summoner.me.profileIconId) : undefined"
            />

            <div class="mr-3 flex w-0 flex-1 flex-col justify-center gap-1">
              <NEllipsis v-if="lcs.summoner.me" class="w-full">
                <StreamerModeMaskedText>
                  <template #masked>
                    <span class="text-sm font-bold text-black dark:text-white">
                      {{ t('summoner', { ns: 'common' }) }}
                    </span>
                  </template>

                  <span class="text-sm font-bold text-black dark:text-white">
                    {{ lcs.summoner.me.gameName }}
                  </span>
                  <span class="ml-1 text-xs text-black/70 dark:text-white/90">
                    #{{ lcs.summoner.me.tagLine }}
                  </span>
                </StreamerModeMaskedText>
              </NEllipsis>

              <div v-else class="text-xs text-black/60 italic dark:text-white/85">
                {{ $t('ClientConnection.noData') }}
              </div>

              <StreamerModeMaskedText>
                <template #masked>
                  <div class="text-[10px] text-black/60 dark:text-white/85">
                    {{ t('region', { ns: 'common' }) }}
                  </div>
                </template>

                <div class="text-[10px] text-black/60 dark:text-white/85">
                  {{
                    sgps.leagueServers.serverNames[as.settings.locale]?.[
                      sgps.availability.sgpServerId
                    ] || sgps.availability.sgpServerId
                  }}
                </div>
              </StreamerModeMaskedText>
            </div>
          </div>

          <div class="mt-2 flex flex-wrap items-center gap-1">
            <NButton size="tiny" secondary @click="handleRestartUx">
              <template #icon>
                <NIcon>
                  <RefreshIcon />
                </NIcon>
              </template>
              {{ $t('ClientConnection.restartUx') }}
            </NButton>

            <NButton v-if="isInEndgamePhase" size="tiny" secondary @click="handlePlayAgain">
              <template #icon>
                <NIcon>
                  <RefreshIcon />
                </NIcon>
              </template>
              {{ $t('ClientConnection.playAgain') }}
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
                fontSizeSmall: '13px',
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

    <div v-if="otherClients.length > 0" class="mb-4 last:mb-0">
      <div v-if="lcs.auth" class="mb-2 text-sm font-semibold text-black/70 dark:text-white/80">
        {{ $t('ClientConnection.launchedOtherClientsGroup') }}
      </div>
      <div v-else class="mb-2 text-sm font-semibold text-black/70 dark:text-white/80">
        {{ $t('ClientConnection.launchedClientsGroup') }}
      </div>

      <NScrollbar style="max-height: 240px">
        <div class="flex flex-col gap-1">
          <div
            v-for="cmd of otherClients"
            :key="cmd.pid"
            class="relative flex w-[222px] flex-col rounded-lg border border-black/10 bg-black/5 px-3 py-2 transition-colors hover:cursor-pointer hover:bg-white/5 dark:bg-white/5 dark:hover:bg-white/10"
            @click="handleConnect(cmd)"
          >
            <div class="flex">
              <LcuImage
                class="mr-2 h-9 w-9 rounded-full"
                :src="clientExtraInfo[cmd.pid] ? clientExtraInfo[cmd.pid].profileIcon : undefined"
              />

              <div class="mr-3 flex w-0 flex-1 flex-col justify-center gap-1">
                <NEllipsis v-if="clientExtraInfo[cmd.pid]" class="w-full">
                  <StreamerModeMaskedText>
                    <template #masked>
                      <span class="text-sm font-bold text-black dark:text-white">
                        {{ t('summoner', { ns: 'common' }) }}
                      </span>
                    </template>

                    <span class="text-sm font-bold text-black dark:text-white">
                      {{ clientExtraInfo[cmd.pid].summoner.gameName }}
                    </span>
                    <span class="ml-1 text-xs text-black/70 dark:text-white/90">
                      #{{ clientExtraInfo[cmd.pid].summoner.tagLine }}
                    </span>
                  </StreamerModeMaskedText>
                </NEllipsis>

                <div v-else class="text-xs text-black/60 italic dark:text-white/85">
                  {{ $t('ClientConnection.noData') }}
                </div>

                <div class="text-[10px] text-black/60 dark:text-white/85">
                  {{
                    sgps.leagueServers.serverNames[as.settings.locale]?.[
                      getSgpServerId(cmd.region, cmd.rsoPlatformId)
                    ] || getSgpServerId(cmd.region, cmd.rsoPlatformId)
                  }}
                  (PID: {{ cmd.pid }})
                </div>
              </div>

              <div
                v-if="lcs.connectingClient?.pid === cmd.pid"
                class="absolute right-2 bottom-2 flex gap-1"
              >
                <NSpin :size="10" />
                <span class="text-[10px]">
                  {{ $t('ClientConnection.connecting') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </NScrollbar>
    </div>

    <div v-if="!lcs.auth && otherClients.length === 0" class="mb-4 last:mb-0">
      <div class="mb-2 text-sm font-semibold text-black/70 dark:text-white/80">
        {{ $t('ClientConnection.noClientGroup') }}
      </div>

      <div class="text-xs text-black/70 italic dark:text-white/80">
        {{ $t('ClientConnection.noClient') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { UxCommandLine, useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { getSgpServerId } from '@shared/utils/sgp'
import { PlugDisconnected24Filled as PlugDisconnected24FilledIcon } from '@vicons/fluent'
import { RefreshSharp as RefreshIcon } from '@vicons/ionicons5'
import {
  CloseFilled as CloseFilledIcon,
  MoreHorizFilled as MoreHorizFilledIcon,
  RocketLaunchRound as RocketLaunchRoundIcon
} from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NEllipsis, NIcon, NScrollbar, NSpin } from 'naive-ui'
import { computed, h } from 'vue'

import { useLeagueClientPeekStore } from '../../shards/league-client-peek/store'

const { t } = useTranslation()

const lc = useInstance(LeagueClientRenderer)

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const lcuxs = useLeagueClientUxStore()
const lcps = useLeagueClientPeekStore()

const sgps = useSgpStore()

const otherClients = computed(() => {
  return lcuxs.launchedClients.filter((c) => c.pid !== lcs.auth?.pid)
})

const clientExtraInfo = lcps.connectableClientExtraInfo

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

const isInEndgamePhase = computed(() => {
  return (
    lcs.gameflow.phase === 'WaitingForStats' ||
    lcs.gameflow.phase === 'PreEndOfGame' ||
    lcs.gameflow.phase === 'EndOfGame'
  )
})

const handlePlayAgain = async () => {
  try {
    await lc.api.lobby.playAgain()
  } catch (error) {
    console.error(error)
  }
}
</script>

<style scoped></style>
