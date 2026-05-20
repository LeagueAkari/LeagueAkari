<template>
  <div class="grid items-start gap-4 lg:grid-cols-[minmax(392px,420px)_minmax(0,1fr)]">
    <StoryPanel title="Startup panel">
      <div class="overflow-x-auto pb-1">
        <JMComicStartup class="mx-auto" @click="clicks += 1" />
      </div>
      <div class="mt-3 text-xs text-black/55 dark:text-white/55">Clicks: {{ clicks }}</div>
    </StoryPanel>

    <StoryPanel title="Pricing modal">
      <div class="flex flex-col items-start gap-3 text-sm">
        <NButton type="primary" @click="showPricing = true">打开订阅弹窗</NButton>
        <div class="text-xs text-black/55 dark:text-white/55">
          Balance: {{ balance.toFixed(4) }} / Purchase events: {{ purchaseCount }} / Not enough:
          {{ notEnoughCount }}
        </div>
      </div>
      <FunnyPricing
        v-model:show="showPricing"
        v-model:balance="balance"
        current="basic"
        @purchase="purchaseCount += 1"
        @not-enough="notEnoughCount += 1"
      />
    </StoryPanel>
  </div>
</template>

<script setup lang="ts">
import FunnyPricing from '@renderer-shared/components/easter-eggs/FunnyPricing.vue'
import JMComicStartup from '@renderer-shared/components/easter-eggs/JMComicStartup.vue'
import { NButton } from 'naive-ui'
import { ref } from 'vue'

import StoryPanel from '../StoryPanel.vue'

const clicks = ref(0)
const showPricing = ref(false)
const balance = ref(0)
const purchaseCount = ref(0)
const notEnoughCount = ref(0)
</script>
