<template>
  <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
    <StoryPanel title="Control item rows">
      <div class="flex w-full flex-col gap-2">
        <ControlItem
          label="启用自动功能"
          label-description="低依赖设置行，预览标签、描述和开关布局。"
        >
          <NSwitch v-model:value="enabled" />
        </ControlItem>
        <ControlItem label="召唤师名称" align="start">
          <div class="flex min-w-0 flex-wrap gap-2">
            <NInput v-model:value="nickname" class="min-w-44 flex-1" size="small" />
            <NButton size="small" secondary>保存</NButton>
          </div>
        </ControlItem>
        <ControlItem label="禁用状态" label-description="用于检查 disabled text opacity。" disabled>
          <NButton size="small" disabled>不可用</NButton>
        </ControlItem>
      </div>
    </StoryPanel>

    <StoryPanel title="Mask">
      <div class="mb-3 flex items-center gap-3 text-sm">
        <NSwitch v-model:value="showMask" />
        <span>遮罩</span>
      </div>
      <div class="h-32">
        <MaskedComponent
          v-model:show-mask="showMask"
          class="rounded border border-black/10 dark:border-white/10"
        >
          <div class="flex h-full items-center justify-center bg-black/5 dark:bg-white/5">
            这里是被遮罩的原始内容
          </div>
          <template #mask>
            <div
              class="flex h-full items-center justify-center bg-black/20 font-bold dark:bg-black/30"
            >
              Streamer mode mask
            </div>
          </template>
        </MaskedComponent>
      </div>
    </StoryPanel>

    <StoryPanel title="Transitions">
      <div class="flex flex-col gap-4 text-sm">
        <div class="flex items-center gap-3">
          <NSwitch v-model:value="showExpanded" />
          <span>展开内容</span>
          <HorizontalExpand :show="showExpanded">
            <NButton size="small" secondary>横向展开</NButton>
          </HorizontalExpand>
        </div>
        <VerticalExpand :show="showExpanded">
          <div
            class="rounded border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
          >
            纵向展开内容区域
          </div>
        </VerticalExpand>
      </div>
    </StoryPanel>

    <StoryPanel title="Streamer text">
      <div class="rounded bg-black/5 p-3 text-sm dark:bg-white/5">
        <StreamerModeMaskedText>
          Akari#2026
          <template #masked>***#****</template>
        </StreamerModeMaskedText>
      </div>
      <div class="mt-2 text-xs text-black/50 dark:text-white/50">
        默认 Storybook store 中 streamer mode 关闭，因此展示原文。
      </div>
    </StoryPanel>
  </div>
</template>

<script setup lang="ts">
import { NButton, NInput, NSwitch } from 'naive-ui'
import { ref } from 'vue'

import ControlItem from '../../ControlItem.vue'
import HorizontalExpand from '../../HorizontalExpand.vue'
import MaskedComponent from '../../MaskedComponent.vue'
import StreamerModeMaskedText from '../../StreamerModeMaskedText.vue'
import VerticalExpand from '../../VerticalExpand.vue'
import StoryPanel from '../StoryPanel.vue'

const enabled = ref(true)
const nickname = ref('Akari')
const showExpanded = ref(true)
const showMask = ref(true)
</script>
