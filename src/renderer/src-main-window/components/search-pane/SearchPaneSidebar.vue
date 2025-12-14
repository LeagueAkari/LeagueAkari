<template>
  <!-- left sidebar -->
  <div class="flex flex-col w-240px b-solid b-0 b-r-1 b-r-white/10 dark:bg-zinc-900 bg-neutral-200">
    <!-- group: recent searches -->
    <div
      class="flex items-center gap-2 p-2 text-xs dark:text-white/50 text-black/50 b-b-solid b-b-1 dark:b-b-white/10 b-b-black/10"
    >
      <NIcon><RecentlyViewed /></NIcon>
      <span class="whitespace-nowrap">{{ t('SearchPane.recentVisits') }}</span>
      <NInput
        class="mla !max-w-130px"
        size="tiny"
        v-model:value="filterRecentVisits"
        :placeholder="t('SearchPane.search')"
      />
    </div>

    <div class="grow-3 basis-0 overflow-hidden b-b-solid b-b-1 dark:b-b-white/10 b-b-black/10">
      <NScrollbar
        v-if="filteredPinnedSearchHistory.length > 0 || filteredUnpinnedSearchHistory.length > 0"
      >
        <!-- 置顶项目列表 -->
        <div v-if="filteredPinnedSearchHistory.length > 0">
          <div
            class="p-2 text-xs dark:text-white/60 text-black/60 dark:bg-zinc-900 bg-neutral-200 font-bold sticky top-0"
          >
            {{ t('SearchPane.pinned', { count: filteredPinnedSearchHistory.length }) }}
          </div>

          <div class="space-y-1 pb-1">
            <div
              class="group flex items-center gap-2 mx-1 px-2 py-1 dark:hover:bg-white/10 hover:bg-black/10 rounded-md transition-colors cursor-pointer"
              v-for="player of filteredPinnedSearchHistory"
              @click="emits('navigateToSummoner', player.puuid, player.sgpServerId, true)"
              @mousedown="handleMouseDown"
              @mouseup.prevent="(event) => handleMouseUp(event, player.puuid, player.sgpServerId)"
            >
              <LcuImage
                class="size-7 rounded-full"
                :src="profileIconUri(player.summoner.profileIconId || 29)"
              />

              <!-- name & tag -->
              <div class="flex-1 min-w-0">
                <div class="flex gap-1 items-center mb-0.5">
                  <div
                    v-if="sgps.availability.sgpServerId !== player.sgpServerId"
                    class="text-10px text-white rounded-xs px-1 dark:bg-cyan-800 bg-sky-500 whitespace-nowrap"
                  >
                    {{
                      t(`sgpServers.${player.sgpServerId}`, {
                        defaultValue: player.sgpServerId,
                        ns: 'common'
                      })
                    }}
                  </div>
                  <div class="text-xs font-bold truncate">
                    {{ player.summoner.gameName }}
                  </div>
                </div>
                <div class="text-11px text-neutral-500 dark:text-neutral-400">
                  #{{ player.summoner.tagLine }}
                </div>
              </div>

              <!-- buttons -->
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <NButton
                  size="tiny"
                  quaternary
                  circle
                  :focusable="false"
                  @click.stop="handlePinSearchHistory(player.puuid)"
                >
                  <template #icon>
                    <NIcon><Pin16Filled /></NIcon>
                  </template>
                </NButton>
                <NButton
                  size="tiny"
                  quaternary
                  circle
                  :focusable="false"
                  @click.stop="handleDeleteSearchHistory(player.puuid)"
                >
                  <template #icon>
                    <NIcon><Close /></NIcon>
                  </template>
                </NButton>
              </div>
            </div>
          </div>
        </div>

        <!-- 非置顶项目列表（样式完全同上） -->
        <div v-if="filteredUnpinnedSearchHistory.length > 0">
          <div
            class="group p-2 text-xs dark:text-white/60 text-black/60 dark:bg-zinc-900 bg-neutral-200 font-bold sticky top-0"
          >
            {{ t('SearchPane.recent', { count: filteredUnpinnedSearchHistory.length }) }}
          </div>

          <div class="space-y-1 pb-1">
            <div
              class="group flex items-center gap-2 mx-1 px-2 py-1 dark:hover:bg-white/10 hover:bg-black/10 rounded-md transition-colors cursor-pointer"
              v-for="player of filteredUnpinnedSearchHistory"
              @click="emits('navigateToSummoner', player.puuid, player.sgpServerId, true)"
              @mousedown="handleMouseDown"
              @mouseup.prevent="(event) => handleMouseUp(event, player.puuid, player.sgpServerId)"
            >
              <LcuImage
                class="size-7 rounded-full"
                :src="profileIconUri(player.summoner.profileIconId || 29)"
              />

              <!-- name & tag -->
              <div class="flex-1 min-w-0">
                <div class="flex gap-1 items-center mb-0.5">
                  <div
                    v-if="sgps.availability.sgpServerId !== player.sgpServerId"
                    class="text-10px text-white rounded-xs px-1 dark:bg-cyan-800 bg-sky-500 whitespace-nowrap"
                  >
                    {{
                      t(`sgpServers.${player.sgpServerId}`, {
                        defaultValue: player.sgpServerId,
                        ns: 'common'
                      })
                    }}
                  </div>
                  <div class="text-xs font-bold truncate">
                    {{ player.summoner.gameName }}
                  </div>
                </div>
                <div class="text-11px text-neutral-500 dark:text-neutral-400">
                  #{{ player.summoner.tagLine }}
                </div>
              </div>

              <!-- buttons -->
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <NButton
                  size="tiny"
                  quaternary
                  circle
                  :focusable="false"
                  @click.stop="handlePinSearchHistory(player.puuid)"
                >
                  <template #icon>
                    <NIcon><Pin16Filled /></NIcon>
                  </template>
                </NButton>
                <NButton
                  size="tiny"
                  quaternary
                  circle
                  :focusable="false"
                  @click.stop="handleDeleteSearchHistory(player.puuid)"
                >
                  <template #icon>
                    <NIcon><Close /></NIcon>
                  </template>
                </NButton>
              </div>
            </div>
          </div>
        </div>
      </NScrollbar>

      <div class="h-full flex items-center justify-center dark:text-white/50 text-black/50" v-else>
        {{ t('SearchPane.noRecentVisits') }}
      </div>
    </div>

    <!-- group: friends -->
    <div
      class="flex items-center gap-2 p-2 text-xs dark:text-white/50 text-black/50 b-b-solid b-b-1 dark:b-b-white/10 b-b-black/10"
    >
      <NIcon><GroupFilled /></NIcon>
      <span class="whitespace-nowrap">{{
        t('SearchPane.friends', { count: filteredSortedFriends.length })
      }}</span>
      <NInput
        class="mla !max-w-130px"
        size="tiny"
        v-model:value="filterFriends"
        :placeholder="t('SearchPane.search')"
      />
    </div>

    <!-- scrollable -->
    <div class="grow-2 basis-0 overflow-hidden">
      <NScrollbar v-if="filteredSortedFriends.length > 0">
        <div class="space-y-1 py-1">
          <div
            class="flex items-center gap-2 mx-1 px-2 py-1 dark:hover:bg-white/10 hover:bg-black/10 rounded-md transition-colors cursor-pointer"
            v-for="friend of filteredSortedFriends"
            :key="friend.puuid"
            @click="emits('navigateToSummoner', friend.puuid, null, true)"
            @mousedown="handleMouseDown"
            @mouseup.prevent="(event) => handleMouseUp(event, friend.puuid, null)"
          >
            <div class="relative size-7">
              <LcuImage class="size-full rounded-full" :src="profileIconUri(friend.icon || 29)" />
              <div
                class="absolute bottom-0 right-0 size-2 rounded-full"
                :class="{
                  'dark:bg-green-500 bg-green-600': friend.availability === 'chat',
                  'dark:bg-cyan-400 bg-cyan-600': friend.availability === 'dnd',
                  'dark:bg-red-500 bg-red-700': friend.availability === 'away'
                }"
              ></div>
            </div>
            <div>
              <div class="text-xs font-bold mb-0.5">{{ friend.gameName }}</div>
              <div class="text-11px text-neutral-500 dark:text-neutral-400">
                #{{ friend.gameTag }}
              </div>
            </div>
          </div>
        </div>
      </NScrollbar>

      <div class="h-full flex items-center justify-center dark:text-white/50 text-black/50" v-else>
        {{ t('SearchPane.noFriends') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Close, RecentlyViewed } from '@vicons/carbon'
import { Pin16Filled } from '@vicons/fluent'
import { GroupFilled } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NInput, NScrollbar } from 'naive-ui'
import { computed, ref } from 'vue'

import { useSearchPaneSearchHistory } from './search-history'
import { useSearchPaneFriends } from './sidebar-friends'

const { t } = useTranslation()

const {
  pinnedSearchHistory,
  unpinnedSearchHistory,
  handleDeleteSearchHistory,
  handlePinSearchHistory,
  updateSearchHistory
} = useSearchPaneSearchHistory()

const emits = defineEmits<{
  navigateToSummoner: [puuid: string, sgpServerId: string | null, setCurrent?: boolean]
}>()

const sgps = useSgpStore()

const filterRecentVisits = ref('')
const filterFriends = ref('')

const filteredPinnedSearchHistory = computed(() => {
  return pinnedSearchHistory.value.filter((item) => {
    return `${item.summoner.gameName} #${item.summoner.tagLine}`
      .toLowerCase()
      .includes(filterRecentVisits.value.toLowerCase())
  })
})

const filteredUnpinnedSearchHistory = computed(() => {
  return unpinnedSearchHistory.value.filter((item) => {
    return `${item.summoner.gameName} #${item.summoner.tagLine}`
      .toLowerCase()
      .includes(filterRecentVisits.value.toLowerCase())
  })
})

const filteredSortedFriends = computed(() => {
  return sortedFriends.value.filter((friend) => {
    return `${friend.gameName} #${friend.gameTag}`
      .toLowerCase()
      .includes(filterFriends.value.toLowerCase())
  })
})

const handleMouseDown = (event: MouseEvent) => {
  if (event.button === 1) {
    event.preventDefault()
  }
}

const handleMouseUp = (event: MouseEvent, puuid: string, sgpServerId: string | null) => {
  if (event.button === 1) {
    emits('navigateToSummoner', puuid, sgpServerId, false)
  }
}

const { updateFriends, sortedFriends } = useSearchPaneFriends()

const reset = () => {
  filterRecentVisits.value = ''
  filterFriends.value = ''
  updateSearchHistory()
  updateFriends()
}

reset()

defineExpose({
  reset
})
</script>
