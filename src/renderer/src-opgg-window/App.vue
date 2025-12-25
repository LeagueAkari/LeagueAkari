<template>
  <div class="flex h-full min-h-(--la-app-min-height) min-w-(--la-app-min-width) flex-col">
    <SetupInAppScope />
    <OpggWindowTitlebar />
    <OpggView class="h-0 flex-1" />
  </div>
</template>

<script setup lang="ts">
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/comp'

import OpggView from './opgg/OpggView.vue'
import OpggWindowTitlebar from './opgg/OpggWindowTitlebar.vue'
import { provideOpgg } from './opgg/context'

provideOpgg()
</script>
