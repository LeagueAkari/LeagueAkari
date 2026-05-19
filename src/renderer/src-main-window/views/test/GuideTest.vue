<template>
  <NScrollbar>
    <div class="box-border space-y-4 p-4">
      <div class="text-lg font-bold">Guide 测试页</div>

      <Guide
        group-id="test-guide"
        guide-id="test-guide-1"
        :order="1"
        title="神奇的按钮"
        description="你可以点击这个神奇的东西"
      >
        <div class="bg-akari-600 h-8 w-24 rounded"></div>
      </Guide>
    </div>
  </NScrollbar>
</template>

<script setup lang="ts">
import { NScrollbar } from 'naive-ui'

import Guide from '@renderer-shared/shards/guide/Guide.vue'
</script>
