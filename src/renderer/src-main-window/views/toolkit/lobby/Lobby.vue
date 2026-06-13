<template>
  <div class="h-full w-full">
    <NScrollbar class="relative h-full max-w-full">
      <div class="mx-auto flex max-w-[800px] flex-col gap-6 p-6">
        <LobbyTool />
        <StrawberryTool />
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { NScrollbar } from 'naive-ui'

import LobbyTool from './LobbyTool.vue'
import StrawberryTool from './StrawberryTool.vue'
</script>
