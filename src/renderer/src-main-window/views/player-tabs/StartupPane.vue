<template>
  <div class="flex flex-col items-center justify-center">
    <!-- logo placeholder -->
    <NIcon class="startup-logo text-96px mb-4 relative -left-8px">
      <AkariLogo />
    </NIcon>

    <!-- app name -->
    <div class="text-2xl dark:text-gray-100 text-gray-800 font-['Comfortaa',sans-serif] mb-1">
      {{ t('appName', { ns: 'common' }) }}
    </div>

    <!-- version -->
    <div class="text-xs dark:text-white/40 text-black/40">v{{ as.version }}</div>

    <!-- spacer -->
    <div class="h-12"></div>

    <!-- summoner -->
    <div
      v-if="lcs.summoner.me"
      @click="handleOpenSelfTab"
      class="group not-last:mb-2 flex gap-4 items-center dark:hover:bg-white/10 hover:bg-black/10 rounded p-2 w-56 cursor-pointer transition-colors"
    >
      <LcuImage :src="profileIconUri(lcs.summoner.me.profileIconId)" class="size-5" />

      <div class="min-w-0">
        <div class="truncate">
          <span class="text-11px dark:text-white/60 text-black/60 font-normal mr-1">
            {{ t(`sgpServers.${sgps.availability.sgpServerId}`, { ns: 'common' }) }}
          </span>
          <span class="text-xs dark:text-white/80 text-black/80 font-bold">{{
            lcs.summoner.me.gameName
          }}</span>
        </div>
        <span class="text-xs dark:text-white/40 text-black/40">#{{ lcs.summoner.me.tagLine }}</span>
      </div>

      <NIcon
        class="mla text-xs dark:text-white/40 text-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight20Filled />
      </NIcon>
    </div>

    <!-- shortcuts -->
    <div
      v-for="item of launchItems"
      class="group not-last:mb-2 flex gap-4 items-center dark:hover:bg-white/10 hover:bg-black/10 rounded p-2 w-56 cursor-pointer transition-colors"
      @click="item.launch"
    >
      <img :src="item.imgUrl" class="size-5" />

      <div class="min-w-0">
        <div class="text-xs dark:text-white/80 text-black/80 font-bold">{{ item.name }}</div>
        <NEllipsis
          :tooltip="{ placement: 'right' }"
          class="text-11px dark:text-white/40 text-black/40"
        >
          <template #tooltip>
            <span class="text-sm font-mono">{{ item.path }}</span>
          </template>
          <span class="font-mono">{{ item.path }}</span>
        </NEllipsis>
      </div>

      <NIcon
        class="mla text-xs dark:text-white/40 text-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight20Filled />
      </NIcon>
    </div>
  </div>
</template>

<script setup lang="ts">
import leagueIco from '@renderer-shared/assets/ico/league.ico'
import riotClient from '@renderer-shared/assets/ico/riotclient.ico'
import weGameIco from '@renderer-shared/assets/ico/wegame.ico'
import AkariLogo from '@renderer-shared/assets/icon/AkariLogo.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { ClientInstallationRenderer } from '@renderer-shared/shards/client-installation'
import { useClientInstallationStore } from '@renderer-shared/shards/client-installation/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { ChevronRight20Filled } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NEllipsis, NIcon, useMessage } from 'naive-ui'
import { computed } from 'vue'

import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'

const { t } = useTranslation()

const as = useAppCommonStore()
const cis = useClientInstallationStore()
const lcs = useLeagueClientStore()
const sgps = useSgpStore()

const ci = useInstance(ClientInstallationRenderer)
const pt = useInstance(PlayerTabsRenderer)

const message = useMessage()

const { navigateToTabByPuuid } = pt.useNavigateToTab()

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
