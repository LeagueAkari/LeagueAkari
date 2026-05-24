<template>
  <div id="aux-window-frame">
    <SetupInAppScope />
    <AuxWindowTitlebar />
    <div class="content">
      <IndicatorView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/setup-in-app-scope-component'

import AuxWindowTitlebar from './components/AuxWindowTitlebar.vue'
import IndicatorView from './views/Indicator.vue'
</script>

<style>
#aux-window-frame {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: var(--la-app-min-width);
  min-height: var(--la-app-min-height);

  > .content {
    height: 0;
    flex: 1;
    overflow: hidden;
  }
}
</style>
