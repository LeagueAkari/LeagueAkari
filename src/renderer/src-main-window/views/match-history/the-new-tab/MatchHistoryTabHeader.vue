<template>
  <div class="flex items-center">
    <!-- name & something -->
    <div class="flex flex-1 min-w-0 h-16">
      <!-- profile icon / summoner level -->
      <div class="relative size-16">
        <LcuImage class="size-full" />
        <div
          class="absolute dark:text-white -bottom-1 -right-1 dark:bg-black/40 py-0.5 px-1 rounded text-10px"
        >
          999
        </div>
      </div>

      <!-- name & tag -->
      <div class="flex flex-col gap-1 self-center ml-3">
        <div class="font-bold dark:text-white text-black" :class="16 <= 16 ? 'text-xl' : 'text-sm'">
          赤座灯里
        </div>
        <div class="text-sm text-gray-400">#阿卡林</div>
      </div>
    </div>

    <!-- ranked -->
    <RankedPane />

    <!-- buttons -->
    <div class="flex gap-2 ml-8 justify-end">
      <NButton secondary class="!size-42px">
        <template #icon>
          <NIcon><Edit20Filled /></NIcon>
        </template>
      </NButton>
      <NButton secondary class="!size-42px">
        <template #icon>
          <NIcon><RefreshSharp /></NIcon>
        </template>
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { Edit20Filled } from '@vicons/fluent'
import { RefreshSharp } from '@vicons/ionicons5'
import { NButton, NIcon } from 'naive-ui'

import RankedPane from './widgets/RankedPane.vue'
</script>
