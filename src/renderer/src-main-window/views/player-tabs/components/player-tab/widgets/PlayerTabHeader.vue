<template>
  <div class="flex items-center">
    <!-- name & something -->
    <div class="flex h-16 min-w-0 flex-1">
      <!-- profile icon / summoner level -->
      <div class="relative size-16">
        <LcuImage
          class="size-full rounded"
          :src="summoner ? profileIconUri(summoner.profileIconId) : undefined"
        />
        <div
          v-if="summoner"
          class="absolute -right-1 -bottom-1 rounded px-1 py-0.5 text-[10px] dark:bg-black/40 dark:text-white"
        >
          {{ summoner.level }}
        </div>
      </div>

      <!-- name & tag -->
      <StreamerModeMaskedText>
        <template #masked>
          <div class="ml-3 flex flex-col gap-1 self-center">
            <div class="flex items-center gap-1">
              <span class="text-xl font-bold text-black dark:text-white">{{ maskedName }}</span>
              <NPopover
                v-if="showSpectatorIndicator"
                trigger="hover"
                placement="bottom-start"
                :style="{ width: '300px' }"
              >
                <template #trigger>
                  <IndicatorPulse class="text-green-500" />
                </template>
                <SpectatorPane />
              </NPopover>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ maskedTagLine }}
            </div>
          </div>
        </template>
        <div class="ml-3 flex flex-col gap-1 self-center">
          <div class="flex items-center gap-1">
            <CopyableText
              class="font-bold text-black dark:text-white"
              :class="summoner && summoner.gameName.length >= 16 ? 'text-sm' : 'text-xl'"
              :text="summoner ? `${summoner.gameName}#${summoner.tagLine}` : '—'"
            >
              {{ summoner?.gameName || '—' }}
            </CopyableText>
            <NPopover
              v-if="showSpectatorIndicator"
              trigger="hover"
              placement="bottom-start"
              :style="{ width: '300px' }"
            >
              <template #trigger>
                <IndicatorPulse class="ml-1 text-green-500" />
              </template>
              <SpectatorPane />
            </NPopover>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ summoner ? `#${summoner.tagLine}` : '—' }}
          </div>
        </div>
      </StreamerModeMaskedText>
    </div>

    <!-- ranked -->
    <RankedPane />

    <!-- buttons -->
    <div class="ml-8 flex justify-end gap-2">
      <!-- tag edit -->
      <NButton
        secondary
        class="size-[42px]!"
        @click="isTagEditModalShowing = true"
        v-if="!isSelfTab && !isCrossRegion"
      >
        <template #icon>
          <NIcon><Edit20Filled /></NIcon>
        </template>
      </NButton>

      <!-- refresh -->
      <NButton secondary class="size-[42px]!" :loading="isSomethingLoading" @click="refresh">
        <template #icon>
          <NIcon><RefreshSharp /></NIcon>
        </template>
      </NButton>
    </div>

    <PlayerTagEditModal v-model:show="isTagEditModalShowing" />
  </div>
</template>

<script setup lang="ts">
import CopyableText from '@renderer-shared/components/CopyableText.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { Edit20Filled } from '@vicons/fluent'
import { RefreshSharp } from '@vicons/ionicons5'
import { NButton, NIcon, NPopover } from 'naive-ui'
import { computed, ref } from 'vue'

import { usePlayerTab } from '../context'
import { useSpectator } from '../data/spectator'
import { useSummoner } from '../data/summoner'
import { useRefresh } from '../utils/refresh'
import IndicatorPulse from './IndicatorPulse.vue'
import PlayerTagEditModal from './PlayerTagEditModal.vue'
import RankedPane from './RankedPane.vue'
import SpectatorPane from './SpectatorPane.vue'

const { puuid, isSmallSize, isSelfTab, isCrossRegion } = usePlayerTab()
const { summoner } = useSummoner()
const { spectatorData } = useSpectator()

const { masked, summonerName: streamerSummonerName } = useStreamerModeMaskedText()

const { refresh, isSomethingLoading } = useRefresh()

const isTagEditModalShowing = ref(false)

const maskedName = computed(() => {
  const seed = summoner.value?.gameName || summoner.value?.puuid || puuid.value
  return streamerSummonerName(seed, 0)
})

const maskedTagLine = computed(() => masked(summoner.value?.tagLine || '—', '#####'))

const showSpectatorIndicator = computed(() => isSmallSize.value && !!spectatorData.value)
</script>
