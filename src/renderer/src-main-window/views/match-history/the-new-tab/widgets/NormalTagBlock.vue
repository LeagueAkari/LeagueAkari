<template>
  <!-- Privacy warning block -->
  <div
    v-if="summoner?.privacy === 'PRIVATE'"
    class="px-4 py-2 dark:bg-red-800/20 bg-red-800 text-white rounded"
  >
    <div class="text-base font-bold mb-2">{{ t('MatchHistoryTab.private.title') }}</div>
    <div class="text-13px">
      {{ t('MatchHistoryTab.private.content') }}
    </div>
  </div>

  <!-- Tagged player blocks -->
  <div
    v-for="tagInfo of tags"
    :key="tagInfo.selfPuuid"
    class="px-4 py-2 dark:bg-blue-800/30 bg-blue-800/90 rounded"
  >
    <div class="flex items-center text-base mb-2">
      <span class="font-bold dark:text-white text-white">{{
        t('MatchHistoryTab.tagged.title')
      }}</span>
      <div
        v-if="!tagInfo.markedBySelf"
        class="ml-2 cursor-pointer"
        @click="handleToSummoner(tagInfo.selfPuuid)"
      >
        <div class="flex gap-1 items-center" v-if="cachedSummoners[tagInfo.selfPuuid]">
          <LcuImage
            class="rounded"
            :src="profileIconUri(cachedSummoners[tagInfo.selfPuuid].profileIconId)"
            :width="16"
            :height="16"
          />
          <div
            class="text-13px text-white/80 dark:text-gray-300 hover:text-gray-200 transition-colors max-w-160px truncate"
          >
            {{ cachedSummoners[tagInfo.selfPuuid].gameName }} #{{
              cachedSummoners[tagInfo.selfPuuid].tagLine
            }}
          </div>
        </div>
      </div>
      <NPopconfirm
        type="warning"
        :positive-button-props="{ type: 'warning', size: 'tiny' }"
        :negative-button-props="{ size: 'tiny' }"
        @positive-click="handleRemoveTag(tagInfo.puuid, tagInfo.selfPuuid)"
      >
        <template #trigger>
          <NIcon class="ml-auto cursor-pointer text-gray-400 hover:text-red-400 transition-colors">
            <DeleteIcon />
          </NIcon>
        </template>
        {{ t('MatchHistoryTab.tagged.deletePopconfirm') }}
      </NPopconfirm>
    </div>
    <NScrollbar class="max-h-100px">
      <div class="text-13px dark:text-gray-200 text-white whitespace-pre-wrap">
        {{ tagInfo.tag }}
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useComponentName } from '@renderer-shared/composables/useComponentName'
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
import { useSummonerFetch } from '../utils/summoner-fetch'

const { t } = useTranslation()

const lcs = useLeagueClientStore()

const message = useMessage()

const componentName = useComponentName()
const log = useInstance(LoggerRenderer)

const { preferredSource } = usePlayerTab()
const { summoner } = useSummoner()
const { tags, removeTag, loadTags } = useTags()
const { navigateToSummonerByPuuid } = usePlayerTab()

const handleToSummoner = (puuid: string) => {
  navigateToSummonerByPuuid(puuid, true)
}

const handleRemoveTag = async (puuid: string, selfPuuid: string) => {
  const success = await removeTag(puuid, selfPuuid)

  if (success) {
    message.success(() => t('MatchHistoryTab.operationSuccessTitle'))
    await loadTags()
  } else {
    message.warning(() => t('MatchHistoryTab.failedToLoadTitle'))
  }
}

const { getSummoners } = useSummonerFetch()

const cachedSummoners = ref<Record<string, Summoner>>({})

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
