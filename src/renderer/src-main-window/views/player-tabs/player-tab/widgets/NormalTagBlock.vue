<template>
  <!-- Privacy warning block -->
  <div
    v-if="summoner?.privacy === 'PRIVATE'"
    class="rounded bg-red-800 px-4 py-2 text-white dark:bg-red-800/20"
  >
    <div class="mb-2 text-base font-bold">{{ t('PlayerTab.private.title') }}</div>
    <div class="text-[13px]">
      {{ t('PlayerTab.private.content') }}
    </div>
  </div>

  <!-- Tagged player blocks -->
  <div
    v-for="(tagInfo, index) of tags"
    :key="tagInfo.selfPuuid"
    class="rounded bg-blue-800/90 px-4 py-2 dark:bg-blue-800/30"
  >
    <div class="mb-2 flex items-center text-base">
      <span class="font-bold text-white dark:text-white">{{ t('PlayerTab.tagged.title') }}</span>
      <div
        v-if="!tagInfo.markedBySelf"
        class="ml-2 cursor-pointer"
        @click="handleToSummoner(tagInfo.selfPuuid)"
      >
        <div class="flex items-center gap-1" v-if="cachedSummoners[tagInfo.selfPuuid]">
          <LcuImage
            class="rounded"
            :src="profileIconUri(cachedSummoners[tagInfo.selfPuuid].profileIconId)"
            :width="16"
            :height="16"
          />
          <StreamerModeMaskedText>
            <template #masked>
              <div
                class="max-w-[160px] truncate text-[13px] text-white/80 transition-colors hover:text-gray-200 dark:text-gray-300"
              >
                {{ maskedMarkerName(tagInfo.selfPuuid, index) }}
              </div>
            </template>
            <div
              class="max-w-[160px] truncate text-[13px] text-white/80 transition-colors hover:text-gray-200 dark:text-gray-300"
            >
              {{ cachedSummoners[tagInfo.selfPuuid].gameName }} #{{
                cachedSummoners[tagInfo.selfPuuid].tagLine
              }}
            </div>
          </StreamerModeMaskedText>
        </div>
      </div>
      <NPopconfirm
        type="warning"
        :positive-button-props="{ type: 'warning', size: 'tiny' }"
        :negative-button-props="{ size: 'tiny' }"
        @positive-click="handleRemoveTag(tagInfo.puuid, tagInfo.selfPuuid)"
      >
        <template #trigger>
          <NIcon class="ml-auto cursor-pointer text-gray-400 transition-colors hover:text-red-400">
            <DeleteIcon />
          </NIcon>
        </template>
        {{ t('PlayerTab.tagged.deletePopconfirm') }}
      </NPopconfirm>
    </div>
    <NScrollbar class="max-h-[100px]">
      <div class="text-[13px] whitespace-pre-wrap text-white dark:text-gray-200">
        {{ masked(tagInfo.tag || '') }}
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useSummonerFetch } from '@renderer-shared/composables/useSummonerFetch'
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { Summoner } from '@shared/data-adapter/summoner'
import { DismissCircle16Regular as DeleteIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NIcon, NPopconfirm, NScrollbar, useMessage } from 'naive-ui'
import { markRaw, ref, watch } from 'vue'

import { usePlayerTab } from '../context'
import { useSummoner } from '../data/summoner'
import { useTags } from '../data/tags'

const { t } = useTranslation()

const lcs = useLeagueClientStore()

const message = useMessage()

const componentName = useComponentName()
const log = useInstance(LoggerRenderer)

const { preferredSource } = usePlayerTab()
const { summoner } = useSummoner()
const { tags, removeTag, loadTags } = useTags()
const { navigateToSummonerByPuuid } = usePlayerTab()
const { masked, summonerName: streamerSummonerName } = useStreamerModeMaskedText()

const handleToSummoner = (puuid: string) => {
  navigateToSummonerByPuuid(puuid, true)
}

const handleRemoveTag = async (puuid: string, selfPuuid: string) => {
  const success = await removeTag(puuid, selfPuuid)

  if (success) {
    message.success(() => t('PlayerTab.operationSuccessTitle'))
    await loadTags()
  } else {
    message.warning(() => t('PlayerTab.failedToLoadTitle'))
  }
}

const { getSummoners } = useSummonerFetch()

const cachedSummoners = ref<Record<string, Summoner>>({})

const maskedMarkerName = (puuid: string, index: number) => streamerSummonerName(puuid, index)

watch(
  tags,
  async () => {
    const markerPuuids = tags.value
      .map((tag) => tag.selfPuuid)
      .filter((puuid) => puuid !== lcs.summoner.me?.puuid)

    cachedSummoners.value = {}

    if (markerPuuids.length === 0) {
      return
    }

    try {
      const summoners = await getSummoners(markerPuuids, preferredSource.value)

      for (const summoner of summoners) {
        cachedSummoners.value[summoner.puuid] = markRaw(summoner)
      }
    } catch (error) {
      log.error(componentName, error)
    }
  },
  { immediate: true }
)
</script>
