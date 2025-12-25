<template>
  <!-- right -->
  <div class="flex min-w-0 flex-1 flex-col">
    <!-- header -->
    <div class="border-b border-black/10 p-3 dark:border-white/10">
      <!-- big title -->

      <div class="mb-4 flex items-center gap-2">
        <div class="mr-auto text-base font-bold">{{ t('SearchPane.title') }}</div>
        <NPopover v-if="isTencentRegion">
          <template #trigger>
            <div
              class="flex cursor-pointer items-center gap-1 rounded bg-amber-500 px-1 py-0.5 text-[10px] text-white dark:bg-amber-700"
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
          class="w-34!"
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
              class="flex h-[18px] items-center rounded bg-sky-500 px-1 font-sans text-[10px] text-white not-last:mr-1 dark:bg-sky-700"
            >
              {{ t('SearchPane.searchTypePuuid') }}
            </div>
            <div
              v-else-if="searchType === 'exact'"
              class="flex h-[18px] items-center rounded bg-sky-500 px-1 font-sans text-[10px] text-white not-last:mr-1"
            >
              {{ t('SearchPane.searchTypeExact') }}
            </div>
            <div
              v-else-if="searchType === 'fuzzy'"
              class="flex h-[18px] items-center rounded bg-sky-500 px-1 font-sans text-[10px] text-white not-last:mr-1 dark:bg-sky-700"
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
    <div class="@container relative flex min-h-0 flex-1 flex-col">
      <template v-if="searchResult.length > 0">
        <div class="mx-3 mt-3 mb-1 font-bold text-black/80 dark:text-white/80">
          {{ t('SearchPane.resultCount', { count: searchResult.length }) }}
        </div>

        <NScrollbar ref="scrollbarEl" class="flex-1">
          <div class="grid grid-cols-1 gap-2 px-3 py-2 @[500px]:grid-cols-2">
            <TransitionGroup name="fade" appear>
              <div
                v-for="result of searchResult"
                :key="result.puuid"
                class="flex cursor-pointer items-center gap-2 rounded border border-solid border-black/10 p-2 transition-colors hover:bg-black/10 dark:border-white/10 dark:hover:bg-white/10"
                @click="emits('navigateToSummoner', result.puuid, result.sgpServerId, true)"
                @mousedown="handleMouseDown"
                @mouseup.prevent="(event) => handleMouseUp(event, result.puuid, result.sgpServerId)"
              >
                <LcuImage :src="profileIconUri(result.profileIconId)" class="size-7 rounded-full" />

                <div>
                  <!-- name first line -->
                  <div class="mb-0.5 flex items-center gap-1">
                    <div
                      class="rounded-xs bg-sky-500 px-1 text-[10px] whitespace-nowrap text-white dark:bg-cyan-800"
                      v-if="sgps.availability.sgpServerId !== result.sgpServerId"
                    >
                      {{
                        t(`sgpServers.${result.sgpServerId}`, {
                          defaultValue: result.sgpServerId,
                          ns: 'common'
                        })
                      }}
                    </div>
                    <div class="truncate text-xs font-bold">{{ result.gameName }}</div>
                    <div class="text-[11px] text-neutral-500 dark:text-neutral-400">
                      #{{ result.tagLine }}
                    </div>
                  </div>

                  <!-- tags line -->
                  <div class="flex items-center gap-1">
                    <div
                      class="rounded-xs bg-red-800 px-1 text-[10px] text-white"
                      v-if="result.privacy === 'PRIVATE'"
                    >
                      {{ t('SearchPane.privacy') }}
                    </div>
                    <span class="text-[11px] text-black/60 dark:text-white/60"
                      >Lv. {{ result.summonerLevel }}</span
                    >
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </NScrollbar>
      </template>

      <div
        class="flex h-full items-center justify-center text-black/50 dark:text-white/50"
        v-else-if="searchProgress.isProcessing && searchResult.length === 0"
      >
        <div class="flex items-center gap-2">
          <NSpin :size="12" />
          <span>{{ t('SearchPane.searching') }}</span>
        </div>
      </div>

      <div class="flex h-full items-center justify-center" v-else>
        <div class="flex flex-col items-center gap-2">
          <span class="mb-6 text-black/60 dark:text-white/60">{{ t('SearchPane.noResult') }}</span>
          <span class="text-xs text-black/50 dark:text-white/50"
            >{{ t('SearchPane.noResultHintFuzzy') }}
            <span
              class="rounded bg-neutral-200 px-1 py-0.5 font-mono text-black dark:bg-white/10 dark:text-white"
              >{{ t('SearchPane.noResultHintFuzzyExample') }}</span
            ></span
          >
          <span class="text-xs text-black/50 dark:text-white/50"
            >{{ t('SearchPane.noResultHintExact') }}
            <span
              class="rounded bg-neutral-200 px-1 py-0.5 font-mono text-black dark:bg-white/10 dark:text-white"
              >{{ t('SearchPane.noResultHintExactExample') }}</span
            ></span
          >
          <span class="text-xs text-black/50 dark:text-white/50"
            >{{ t('SearchPane.noResultHintPuuid') }}
            <span
              class="rounded bg-neutral-200 px-1 py-0.5 font-mono text-black dark:bg-white/10 dark:text-white"
              >{{ t('SearchPane.noResultHintPuuidExample') }}</span
            ></span
          >
        </div>
      </div>

      <div
        v-if="searchProgress.isProcessing"
        class="absolute top-0 right-0 left-0 h-[2px] before:block before:h-full before:w-(--progress-width) before:bg-green-600 before:transition-[width] before:content-[''] dark:before:bg-green-300"
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
