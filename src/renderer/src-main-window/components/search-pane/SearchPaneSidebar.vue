<template>
  <!-- left sidebar -->
  <div
    class="flex w-60 flex-col border-0 border-r border-solid border-white/10 bg-neutral-200 dark:bg-zinc-900"
  >
    <!-- group: recent searches -->
    <div
      class="flex items-center gap-2 border-b border-black/10 px-2 py-1 text-xs text-black/50 dark:border-white/10 dark:text-white/50"
    >
      <NIcon><RecentlyViewed /></NIcon>
      <span class="whitespace-nowrap">{{ t('SearchPane.recentVisits') }}</span>
      <NInput
        class="ml-auto max-w-32.5!"
        size="tiny"
        v-model:value="filterRecentVisits"
        :placeholder="t('SearchPane.search')"
      />
    </div>

    <div class="grow-3 basis-0 overflow-hidden border-b border-black/10 dark:border-white/10">
      <NScrollbar
        v-if="filteredPinnedSearchHistory.length > 0 || filteredUnpinnedSearchHistory.length > 0"
      >
        <!-- 置顶项目列表 -->
        <div v-if="filteredPinnedSearchHistory.length > 0">
          <div
            class="sticky top-0 bg-neutral-200 p-2 text-xs font-bold text-black/60 dark:bg-zinc-900 dark:text-white/60"
          >
            {{ t('SearchPane.pinned', { count: filteredPinnedSearchHistory.length }) }}
          </div>

          <div class="space-y-1 pb-1">
            <div
              class="group mx-1 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
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
              <div class="min-w-0 flex-1">
                <div class="mb-0.5 flex items-center gap-1">
                  <div
                    v-if="sgps.availability.sgpServerId !== player.sgpServerId"
                    class="rounded-xs bg-sky-500 px-1 text-[10px] whitespace-nowrap text-white dark:bg-cyan-800"
                  >
                    {{
                      t(`sgpServers.${player.sgpServerId}`, {
                        defaultValue: player.sgpServerId,
                        ns: 'common'
                      })
                    }}
                  </div>
                  <div class="truncate text-xs font-bold">
                    {{ player.summoner.gameName }}
                  </div>
                </div>
                <div class="text-[11px] text-neutral-500 dark:text-neutral-400">
                  #{{ player.summoner.tagLine }}
                </div>
              </div>

              <!-- buttons -->
              <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
            class="group sticky top-0 border-black/10 bg-neutral-200 p-2 text-xs font-bold text-black/60 dark:border-b dark:bg-zinc-900 dark:text-white/60"
          >
            {{ t('SearchPane.recent', { count: filteredUnpinnedSearchHistory.length }) }}
          </div>

          <div class="space-y-1 pb-1">
            <div
              class="group mx-1 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
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
              <div class="min-w-0 flex-1">
                <div class="mb-0.5 flex items-center gap-1">
                  <div
                    v-if="sgps.availability.sgpServerId !== player.sgpServerId"
                    class="rounded-xs bg-sky-500 px-1 text-[10px] whitespace-nowrap text-white dark:bg-cyan-800"
                  >
                    {{
                      t(`sgpServers.${player.sgpServerId}`, {
                        defaultValue: player.sgpServerId,
                        ns: 'common'
                      })
                    }}
                  </div>
                  <div class="truncate text-xs font-bold">
                    {{ player.summoner.gameName }}
                  </div>
                </div>
                <div class="text-[11px] text-neutral-500 dark:text-neutral-400">
                  #{{ player.summoner.tagLine }}
                </div>
              </div>

              <!-- buttons -->
              <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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

      <div class="flex h-full items-center justify-center text-black/50 dark:text-white/50" v-else>
        {{ t('SearchPane.noRecentVisits') }}
      </div>
    </div>

    <!-- group: friends -->
    <div
      class="flex items-center gap-2 border-b border-black/10 px-2 py-1 text-xs text-black/50 dark:border-white/10 dark:text-white/50"
    >
      <NIcon><GroupFilled /></NIcon>
      <span class="whitespace-nowrap">{{
        t('SearchPane.friends', { count: filteredSortedFriends.length })
      }}</span>
      <NInput
        class="ml-auto max-w-32.5!"
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
            class="mx-1 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            v-for="friend of filteredSortedFriends"
            :key="friend.puuid"
            @click="emits('navigateToSummoner', friend.puuid, null, true)"
            @mousedown="handleMouseDown"
            @mouseup.prevent="(event) => handleMouseUp(event, friend.puuid, null)"
          >
            <div class="relative size-7">
              <LcuImage class="size-full rounded-full" :src="profileIconUri(friend.icon || 29)" />
              <div
                class="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border-neutral-200 dark:border-neutral-800"
                :class="{
                  'border bg-green-600 dark:bg-green-500': friend.availability === 'chat',
                  'border bg-cyan-500 dark:bg-cyan-400': friend.availability === 'dnd',
                  'border bg-red-600 dark:bg-red-500': friend.availability === 'away'
                }"
              ></div>
            </div>
            <div>
              <div class="mb-0.5 text-xs font-bold">{{ friend.gameName }}</div>
              <div class="text-[11px] text-neutral-500 dark:text-neutral-400">
                #{{ friend.gameTag }}
              </div>
            </div>
          </div>
        </div>
      </NScrollbar>

      <div class="flex h-full items-center justify-center text-black/50 dark:text-white/50" v-else>
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
