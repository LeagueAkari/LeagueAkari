<template>
  <div class="flex h-[600px] w-[800px] flex-col gap-1 space-y-2 p-4">
    <div>此页面用作内部测试。它不会在正式版本中出现。</div>

    <!-- test2 -->
    <FeatureGuide :items="items" v-model:show="show" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import FeatureGuide from '@main-window/components/FeatureGuide.vue'
import moreTags from '@main-window/shards/simple-notifications/imgs/more-tags.png'
import queryInLobby from '@main-window/shards/simple-notifications/imgs/query-in-lobby.png'

const show = ref(true)
const items = [
  {
    title: '房间内查询可用',
    description:
      '除了英雄选择和游戏中阶段，现在也可以展示房间内所有成员的数据。\n\n在 `设置` → `对局分析` → `在房间阶段内生效`，启用此功能。',
    imageUrls: [queryInLobby]
  },
  {
    title: '展示更多标签',
    description: '在 `设置` → `对局分析` → `玩家卡片标签` 中，启用更多标签。',
    imageUrls: [moreTags]
  }
]
</script>
