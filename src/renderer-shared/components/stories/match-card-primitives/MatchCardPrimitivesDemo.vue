<template>
  <div class="grid items-start gap-4 lg:grid-cols-2">
    <StoryPanel title="Tab switch">
      <div class="max-w-md">
        <TabSwitch
          v-model:selected-tab="selectedTab"
          :tabs="tabs"
          :win-result="selectedTab === 'summary' ? 'win' : 'loss'"
        />
      </div>
    </StoryPanel>

    <StoryPanel title="Damage bars">
      <div class="flex flex-col gap-4">
        <div
          v-for="sample of damageSamples"
          :key="sample.label"
          class="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3"
        >
          <span class="text-xs text-black/55 dark:text-white/55">{{ sample.label }}</span>
          <DamageBar v-bind="sample" :width="180" :height="10" :border-radius="5" />
        </div>

        <div class="self-start">
          <DamageBarWithPopover
            :physical-damage="18700"
            :magic-damage="9200"
            :true-damage="2100"
            :total-damage="30000"
            :baseline-damage="36000"
            :width="180"
            :height="10"
          />
        </div>
      </div>
    </StoryPanel>

    <StoryPanel title="Map position" class="lg:col-span-2">
      <div class="flex flex-wrap gap-4">
        <MapPosition :points="storyMapPoints" :size="180" :map-id="11" />
        <MapPosition :points="storyMapPoints.slice(0, 3)" :size="180" :map-id="12" />
        <MapPosition :points="storyMapPoints.slice(2)" :size="180" :map-id="21" />
      </div>
    </StoryPanel>
  </div>
</template>

<script setup lang="ts">
import DamageBar from '@renderer-shared/components/match-card/widgets/DamageBar.vue'
import DamageBarWithPopover from '@renderer-shared/components/match-card/widgets/DamageBarWithPopover.vue'
import MapPosition from '@renderer-shared/components/match-card/widgets/MapPosition.vue'
import TabSwitch from '@renderer-shared/components/match-card/widgets/TabSwitch.vue'
import { ref } from 'vue'

import { storyMapPoints } from '../fixtures'
import StoryPanel from '../StoryPanel.vue'

const selectedTab = ref('summary')
const tabs = [
  { label: '概览', value: 'summary' },
  { label: '详情', value: 'details' },
  { label: '时间线', value: 'timeline' }
]

const damageSamples = [
  {
    label: 'AD carry',
    physicalDamage: 23800,
    magicDamage: 2200,
    trueDamage: 760,
    baselineDamage: 30000
  },
  {
    label: 'Mage',
    physicalDamage: 1600,
    magicDamage: 28600,
    trueDamage: 1200,
    baselineDamage: 32000
  },
  {
    label: 'Tank',
    physicalDamage: 8200,
    magicDamage: 6100,
    trueDamage: 4100,
    baselineDamage: 24000
  }
]
</script>
