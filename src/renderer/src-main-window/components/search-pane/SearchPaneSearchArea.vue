<template>
  <!-- right -->
  <div class="flex flex-col flex-1 min-w-0">
    <!-- header -->
    <div class="p-3 b-b-solid b-b-1 dark:b-b-white/10 b-b-black/10">
      <!-- big title -->

      <div class="flex items-center gap-2 mb-4">
        <div class="text-base font-bold mra">{{ t('SearchPane.title') }}</div>
        <NPopover v-if="isTencentRegion">
          <template #trigger>
            <div
              class="flex items-center gap-1 text-10px py-0.5 px-1 rounded dark:bg-amber-700 bg-amber-500 text-white cursor-pointer"
            >
              <NIcon><Info24Regular /></NIcon>
              <span>{{ t('SearchPane.combinedServersReference') }}</span>
            </div>
          </template>
          <CombinedTencentServers />
        </NPopover>
      </div>

      <!-- inputs -->
      <div class="flex gap-2">
        <NSelect
          class="!w-34"
          :consistent-menu-width="false"
          :options="tencentServers"
          v-if="isTencentRegion && as.settings.preferredLolSource === 'sgp'"
          v-model:value="currentSgpServerId"
        />
        <NInput
          ref="inputEl"
          clearable
          class="flex-1 font-mono"
          v-model:value="searchInput"
          :status="isValidSearchInput || isEmptyInput ? 'success' : 'warning'"
          @keyup.enter="handelSearch"
        >
          <template #prefix>
            <div
              v-if="searchType === 'puuid'"
              class="font-sans text-10px rounded dark:bg-sky-700 bg-sky-500 text-white px-1 flex items-center h-18px not-last:mr-1"
            >
              {{ t('SearchPane.searchTypePuuid') }}
            </div>
            <div
              v-else-if="searchType === 'exact'"
              class="font-sans text-10px rounded bg-sky-700 bg-sky-500 text-white px-1 flex items-center h-18px not-last:mr-1"
            >
              {{ t('SearchPane.searchTypeExact') }}
            </div>
            <div
              v-else-if="searchType === 'fuzzy'"
              class="font-sans text-10px rounded dark:bg-sky-700 bg-sky-500 text-white px-1 flex items-center h-18px not-last:mr-1"
            >
              {{ t('SearchPane.searchTypeFuzzy') }}
            </div>
          </template>
        </NInput>

        <NButton type="warning" v-if="searchProgress.isProcessing" @click="handleCancel">
          <template #icon>
            <Close />
          </template>
          {{ t('SearchPane.cancel') }}
        </NButton>

        <NButton
          type="primary"
          @click="handelSearch"
          :loading="searchProgress.isProcessing"
          :disabled="!isValidSearchInput"
        >
          <template #icon>
            <Search />
          </template>
          {{ t('SearchPane.search') }}
        </NButton>
      </div>
    </div>

    <!-- search results -->
    <div class="@container relative flex-1 min-h-0 flex flex-col">
      <template v-if="searchResult.length > 0">
        <div class="mt-3 mb-1 mx-3 font-bold dark:text-white/80 text-black/80">
          {{ t('SearchPane.resultCount', { count: searchResult.length }) }}
        </div>

        <NScrollbar ref="scrollbarEl" class="flex-1">
          <div class="grid @[500px]:grid-cols-2 grid-cols-1 py-2 px-3 gap-2">
            <TransitionGroup name="fade" appear>
              <div
                v-for="result of searchResult"
                :key="result.puuid"
                class="flex items-center gap-2 rounded p-2 b-solid b-1 b-white/10 cursor-pointer dark:hover:bg-white/10 hover:bg-black/10 transition-colors"
                @click="emits('navigateToSummoner', result.puuid, result.sgpServerId, true)"
                @mousedown="handleMouseDown"
                @mouseup.prevent="(event) => handleMouseUp(event, result.puuid, result.sgpServerId)"
              >
                <LcuImage :src="profileIconUri(result.profileIconId)" class="size-7 rounded-full" />

                <div>
                  <!-- name first line -->
                  <div class="flex gap-1 items-center mb-0.5">
                    <div
                      class="text-10px text-white rounded-xs px-1 dark:bg-cyan-800 bg-sky-500 whitespace-nowrap"
                      v-if="sgps.availability.sgpServerId !== result.sgpServerId"
                    >
                      {{
                        t(`sgpServers.${result.sgpServerId}`, {
                          defaultValue: result.sgpServerId,
                          ns: 'common'
                        })
                      }}
                    </div>
                    <div class="text-xs font-bold truncate">{{ result.gameName }}</div>
                    <div class="text-11px text-neutral-500 dark:text-neutral-400">
                      #{{ result.tagLine }}
                    </div>
                  </div>

                  <!-- tags line -->
                  <div class="flex gap-1 items-center">
                    <div
                      class="text-10px dark:text-white text-black rounded-xs px-1 bg-red-800"
                      v-if="result.privacy === 'PRIVATE'"
                    >
                      {{ t('SearchPane.privacy') }}
                    </div>
                    <span class="text-11px text-white/60">Lv. {{ result.summonerLevel }}</span>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </NScrollbar>
      </template>

      <div
        class="h-full flex items-center justify-center dark:text-white/50 text-black/50"
        v-else-if="searchProgress.isProcessing && searchResult.length === 0"
      >
        <div class="flex items-center gap-2">
          <NSpin :size="12" />
          <span>{{ t('SearchPane.searching') }}</span>
        </div>
      </div>

      <div class="h-full flex items-center justify-center" v-else>
        <div class="flex flex-col items-center gap-2">
          <span class="mb-6 dark:text-white/60 text-black/60">{{ t('SearchPane.noResult') }}</span>
          <span class="text-xs dark:text-white/50 text-black/50"
            >{{ t('SearchPane.noResultHintFuzzy') }}
            <span
              class="font-mono dark:bg-white/10 bg-neutral-200 rounded px-1 py-0.5 dark:text-white text-black"
              >{{ t('SearchPane.noResultHintFuzzyExample') }}</span
            ></span
          >
          <span class="text-xs dark:text-white/50 text-black/50"
            >{{ t('SearchPane.noResultHintExact') }}
            <span
              class="font-mono dark:bg-white/10 bg-neutral-200 rounded px-1 py-0.5 dark:text-white text-black"
              >{{ t('SearchPane.noResultHintExactExample') }}</span
            ></span
          >
          <span class="text-xs dark:text-white/50 text-black/50"
            >{{ t('SearchPane.noResultHintPuuid') }}
            <span
              class="font-mono dark:bg-white/10 bg-neutral-200 rounded px-1 py-0.5 dark:text-white text-black"
              >{{ t('SearchPane.noResultHintPuuidExample') }}</span
            ></span
          >
        </div>
      </div>

      <div
        v-if="searchProgress.isProcessing"
        class="absolute top-0 left-0 right-0 h-2px before:content-[''] before:block before:h-full before:transition-width before:w-[var(--progress-width)] before:bg-green-300"
        :style="{
          '--progress-width': `${(searchProgress.finish / (searchProgress.total || 1)) * 100}%`
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useScrollFollow } from '@renderer-shared/composables/useScrollFollow'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Close, Search } from '@vicons/carbon'
import { Info24Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NInput, NPopover, NScrollbar, NSelect, NSpin } from 'naive-ui'
import { nextTick, useTemplateRef } from 'vue'

import CombinedTencentServers from './CombinedTencentServers.vue'
import { useSearchPaneSearchArea } from './search-area'

const { t } = useTranslation()

const {
  currentSgpServerId,
  tencentServers,
  isTencentRegion,
  searchInput,
  isEmptyInput,
  isValidSearchInput,
  searchType,
  searchProgress,
  searchResult,
  search: handelSearch,
  cancel: handleCancel,
  reset: resetState
} = useSearchPaneSearchArea()

const emits = defineEmits<{
  navigateToSummoner: [puuid: string, sgpServerId: string | null, setCurrent?: boolean]
}>()

const sgps = useSgpStore()

const as = useAppCommonStore()

const inputEl = useTemplateRef('inputEl')
const scrollbarEl = useTemplateRef('scrollbarEl')

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

useScrollFollow(() => scrollbarEl.value?.scrollbarInstRef?.containerRef, {
  threshold: 4,
  behavior: 'smooth'
})

const reset = () => {
  resetState()
  nextTick(() => inputEl.value?.focus())
}

reset()

defineExpose({
  reset,
  cancel: handleCancel
})
</script>
