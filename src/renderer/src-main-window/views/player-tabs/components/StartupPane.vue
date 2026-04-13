<template>
  <div class="flex flex-col items-center justify-center">
    <!-- logo placeholder -->
    <NIcon class="startup-logo relative -left-2 mb-4 text-[96px]">
      <AkariLogo />
    </NIcon>

    <!-- app name -->
    <div
      class="relative mb-1 font-['Comfortaa',sans-serif] text-2xl text-gray-800 dark:text-gray-100"
    >
      {{ t('appName', { ns: 'common' }) }}

      <span
        v-if="showNewVersionBadge"
        class="bg-akari-500 absolute top-0 right-0 translate-x-[120%] -translate-y-1/6 cursor-pointer rounded px-1 py-px text-xs text-white transition-opacity hover:opacity-80"
        @click.stop="handleShowUpdateModal"
        >{{ t('StartupPane.newVersionAvailable') }}</span
      >
    </div>

    <!-- version -->
    <div class="text-xs text-black/40 dark:text-white/40">v{{ as.version }}</div>

    <!-- spacer -->
    <div class="h-12"></div>

    <NScrollbar class="h-fit! max-h-58 w-58!">
      <!-- summoner -->
      <div
        v-if="lcs.summoner.me"
        @click="handleOpenSelfTab"
        class="group flex cursor-pointer items-center gap-4 rounded p-2 transition-colors not-last:mb-2 hover:bg-black/10 dark:hover:bg-white/10"
      >
        <LcuImage :src="profileIconUri(lcs.summoner.me.profileIconId)" class="size-5" />

        <div class="min-w-0">
          <div class="truncate">
            <span class="mr-1 text-[11px] font-normal text-black/60 dark:text-white/60">
              {{ t(`sgpServers.${sgps.availability.sgpServerId}`, { ns: 'common' }) }}
            </span>
            <span class="text-xs font-bold text-black/80 dark:text-white/80">{{
              lcs.summoner.me.gameName
            }}</span>
          </div>
          <span class="text-xs text-black/40 dark:text-white/40"
            >#{{ lcs.summoner.me.tagLine }}</span
          >
        </div>

        <NIcon
          class="ml-auto text-xs text-black/40 opacity-0 transition-opacity group-hover:opacity-100 dark:text-white/40"
        >
          <ChevronRight20Filled />
        </NIcon>
      </div>

      <template v-if="!lcs.isConnected">
        <!-- other clients -->
        <div
          v-for="(client, index) of otherClients"
          :key="client.pid"
          class="flex cursor-pointer items-center gap-4 rounded p-2 transition-colors not-last:mb-2 hover:bg-black/10 dark:hover:bg-white/10"
          @click="handleConnect(client)"
        >
          <LcuImage
            :src="lcps.connectableClientExtraInfo[client.pid]?.profileIcon"
            class="size-5"
          />

          <div class="min-w-0">
            <div class="truncate">
              <span class="mr-1 text-[11px] font-normal text-black/60 dark:text-white/60">
                ({{ client.pid }})
                {{
                  t(`sgpServers.${getSgpServerId(client.region, client.rsoPlatformId)}`, {
                    ns: 'common'
                  })
                }}
              </span>
              <span class="text-xs font-bold text-black/80 dark:text-white/80">{{
                otherClientName(client, index)
              }}</span>
            </div>
            <span class="text-xs text-black/40 dark:text-white/40">{{
              otherClientTagLine(client)
            }}</span>
          </div>

          <NSpin class="ml-auto" :size="12" v-if="lcs.connectingClient?.pid === client.pid" />
          <NIcon v-else class="ml-auto text-sm text-black/60 dark:text-white/60">
            <PlugConnected24Filled />
          </NIcon>
        </div>
      </template>

      <!-- shortcuts -->
      <div
        v-for="item of launchItems"
        class="group flex cursor-pointer items-center gap-4 rounded p-2 transition-colors not-last:mb-2 hover:bg-black/10 dark:hover:bg-white/10"
        @click="item.launch"
      >
        <img :src="item.imgUrl" class="size-5" />

        <div class="min-w-0">
          <div class="text-xs font-bold text-black/80 dark:text-white/80">{{ item.name }}</div>
          <NEllipsis
            :tooltip="{ placement: 'right' }"
            class="text-[11px] text-black/40 dark:text-white/40"
          >
            <template #tooltip>
              <span class="font-mono text-sm">{{ item.path }}</span>
            </template>
            <span class="font-mono">{{ item.path }}</span>
          </NEllipsis>
        </div>

        <NIcon
          class="ml-auto text-xs text-black/40 opacity-0 transition-opacity group-hover:opacity-100 dark:text-white/40"
        >
          <ChevronRight20Filled />
        </NIcon>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import leagueIco from '@renderer-shared/assets/ico/league.ico'
import riotClient from '@renderer-shared/assets/ico/riotclient.ico'
import weGameIco from '@renderer-shared/assets/ico/wegame.ico'
import AkariLogo from '@renderer-shared/assets/icon/AkariLogo.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { ClientInstallationRenderer } from '@renderer-shared/shards/client-installation'
import { useClientInstallationStore } from '@renderer-shared/shards/client-installation/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useRemoteConfigStore } from '@renderer-shared/shards/remote-config/store'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { UxCommandLine } from '@shared/types/shards/league-client-ux'
import { getSgpServerId } from '@shared/utils/sgp'
import { ChevronRight20Filled, PlugConnected24Filled } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NEllipsis, NIcon, NScrollbar, NSpin, useMessage } from 'naive-ui'
import { computed } from 'vue'

import { useLeagueClientPeekStore } from '@main-window/shards/league-client-peek/store'
import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'
import { SimpleNotificationsRenderer } from '@main-window/shards/simple-notifications'

const { t } = useTranslation()

const as = useAppCommonStore()
const cis = useClientInstallationStore()
const lcs = useLeagueClientStore()
const lcuxs = useLeagueClientUxStore()
const lcps = useLeagueClientPeekStore()
const sgps = useSgpStore()

const rcs = useRemoteConfigStore()
const sus = useSelfUpdateStore()

const lc = useInstance(LeagueClientRenderer)
const ci = useInstance(ClientInstallationRenderer)
const pt = useInstance(PlayerTabsRenderer)
const sn = useInstance(SimpleNotificationsRenderer)

const message = useMessage()
const { masked, summonerName: streamerSummonerName } = useStreamerModeMaskedText()

const { navigateToTabByPuuid } = pt.useNavigateToTab()

const showNewVersionBadge = computed(() => {
  const release = rcs.latestRelease
  if (!release || !release.isNew) {
    return false
  }

  if (sus.settings.ignoreVersion === release.version) {
    return false
  }

  return true
})

const handleShowUpdateModal = () => {
  sn.showNewReleaseModal()
}

const handleOpenSelfTab = () => {
  if (lcs.summoner.me) {
    navigateToTabByPuuid(lcs.summoner.me.puuid)
  }
}

const launch = async (fn: () => Promise<any>, name: string) => {
  try {
    await fn()
    message.success(t('StartupPane.successMessage', { name }))
  } catch (error) {
    message.error(t('StartupPane.failedMessage', { name, reason: (error as any).message }))
  }
}

const launchItems = computed(() => {
  const arr: {
    name: string
    imgUrl: string
    path: string
    launch: () => any | Promise<any>
  }[] = []

  if (cis.tclsExecutablePath) {
    arr.push({
      name: t('StartupPane.tcls'),
      imgUrl: leagueIco,
      path: cis.tclsExecutablePath,
      launch: () => launch(ci.launchTencentTcls.bind(ci), t('StartupPane.tcls'))
    })
  }

  if (cis.weGameLauncherExecutablePath) {
    arr.push({
      name: t('StartupPane.weGame'),
      imgUrl: weGameIco,
      path: cis.weGameLauncherExecutablePath,
      launch: () => launch(ci.launchWeGameLeagueOfLegends.bind(ci), t('StartupPane.weGame'))
    })
  }

  if (cis.officialRiotClientExecutablePath) {
    arr.push({
      name: t('StartupPane.riotClient'),
      imgUrl: riotClient,
      path: cis.officialRiotClientExecutablePath,
      launch: () => launch(ci.launchDefaultRiotClient.bind(ci), t('StartupPane.riotClient'))
    })
  }

  return arr
})

const otherClients = computed(() => {
  return lcuxs.launchedClients.filter((c) => c.pid !== lcs.auth?.pid)
})

const otherClientName = (client: UxCommandLine, index: number) => {
  const summoner = lcps.connectableClientExtraInfo[client.pid]?.summoner
  const name = summoner?.gameName || summoner?.displayName || '—'
  const seed = summoner?.gameName || summoner?.puuid || String(client.pid)
  return masked(name, () => streamerSummonerName(seed, index))
}

const otherClientTagLine = (client: UxCommandLine) => {
  const summoner = lcps.connectableClientExtraInfo[client.pid]?.summoner
  return masked(summoner ? `#${summoner.tagLine}` : '—', '#####')
}

const handleConnect = (cmd: UxCommandLine) => {
  if (lcs.connectingClient?.pid === cmd.pid) {
    lc.disconnect()
    return
  }

  lc.connect(cmd)
}
</script>

<style scoped>
.startup-logo {
  color: rgba(220, 50, 100, 1);
  filter: drop-shadow(0 4px 12px rgba(220, 50, 100, 0.12));

  [data-theme='dark'] & {
    color: rgba(248, 63, 111, 1);
    filter: drop-shadow(0 4px 12px rgba(248, 63, 111, 0.15));
  }
}
</style>
