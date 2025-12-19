<template>
  <div class="h-[600px] w-[800px] space-y-4 p-4">
    <h2 class="text-lg font-semibold text-white">PREMADE_TEAM_COLORS_LIGHT 预览</h2>
    <div class="grid grid-cols-4 gap-3">
      <div
        v-for="(cfg, key) in lightColors"
        :key="key"
        class="flex flex-col items-center justify-center rounded-lg text-sm font-medium"
        :style="{
          backgroundColor: cfg.foregroundColor,
          color: cfg.color,
          borderColor: cfg.borderColor
        }"
      >
        <div class="mb-1 text-base font-bold">{{ key }}</div>
        <div class="text-[10px] opacity-80">
          {{ cfg.foregroundColor }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PREMADE_TEAM_COLORS_LIGHT } from '@renderer-shared/components/ongoing-game-panel/ongoing-game-utils'

const lightColors = PREMADE_TEAM_COLORS_LIGHT
</script>
