<template>
  <div class="grid items-start gap-4 lg:grid-cols-2">
    <StoryPanel title="Product icons">
      <div class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <IconTile label="LeagueAkariOutline">
          <LeagueAkariOutline />
        </IconTile>
        <IconTile label="Gitee">
          <GiteeSvg />
        </IconTile>
      </div>
    </StoryPanel>

    <StoryPanel title="Position icons">
      <div class="grid grid-cols-3 gap-3 text-sm sm:grid-cols-6">
        <IconTile v-for="position of positions" :key="position" :label="position">
          <PositionIcon :position="position" />
        </IconTile>
      </div>
    </StoryPanel>

    <StoryPanel title="Objective icons">
      <div class="grid grid-cols-3 gap-3 text-sm sm:grid-cols-6">
        <IconTile label="Dragon">
          <Dragon />
        </IconTile>
        <IconTile label="Baron">
          <Baron />
        </IconTile>
        <IconTile label="Atakhan">
          <Atakhan />
        </IconTile>
        <IconTile label="Void Grub">
          <VoidGrub />
        </IconTile>
        <IconTile label="Herald">
          <RiftHerald />
        </IconTile>
        <IconTile label="Tower">
          <Tower />
        </IconTile>
        <IconTile label="Inhibitor">
          <Inhibitor />
        </IconTile>
      </div>
    </StoryPanel>
  </div>
</template>

<script setup lang="ts">
import GiteeSvg from '@renderer-shared/components/icons/GiteeSvg.vue'
import LeagueAkariOutline from '@renderer-shared/components/icons/LeagueAkariOutline.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import Atakhan from '@renderer-shared/components/match-card/icons/Atakhan.vue'
import Baron from '@renderer-shared/components/match-card/icons/Baron.vue'
import Dragon from '@renderer-shared/components/match-card/icons/Dragon.vue'
import Inhibitor from '@renderer-shared/components/match-card/icons/Inhibitor.vue'
import RiftHerald from '@renderer-shared/components/match-card/icons/RiftHerald.vue'
import Tower from '@renderer-shared/components/match-card/icons/Tower.vue'
import VoidGrub from '@renderer-shared/components/match-card/icons/VoidGrub.vue'
import { defineComponent } from 'vue'

import StoryPanel from '../StoryPanel.vue'

const positions = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY', 'ALL']

const IconTile = defineComponent({
  props: {
    label: {
      type: String,
      required: true
    }
  },
  template: `
    <div class="flex min-h-24 min-w-0 flex-col items-center justify-center gap-2 rounded border border-black/10 bg-black/4 p-3 text-center dark:border-white/10 dark:bg-white/5">
      <div class="story-icon-visual flex size-10 items-center justify-center text-black/80 dark:text-white/85">
        <slot />
      </div>
      <div
        class="max-w-full break-words text-[11px] leading-tight text-black/50 dark:text-white/50"
        :title="label"
      >
        {{ label }}
      </div>
    </div>
  `
})
</script>

<style>
.story-icon-visual > svg {
  width: 2rem;
  height: 2rem;
  max-width: 100%;
  max-height: 100%;
  flex: 0 0 auto;
}
</style>
