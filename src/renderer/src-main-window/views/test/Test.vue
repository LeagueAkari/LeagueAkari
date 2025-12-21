<template>
  <div class="h-[600px] w-[800px] space-y-4 p-4">
    <h2 class="text-lg font-semibold text-black dark:text-white">PREMADE_TEAM_COLORS_LIGHT 预览</h2>
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

    <!-- test2 -->
    <div
      class="flex h-[400px] w-[550px] overflow-hidden rounded bg-neutral-100 shadow-lg dark:bg-neutral-900"
    >
      <!-- left image  -->
      <NCarousel autoplay show-arrow class="w-[240px]!">
        <img v-for="url in exampleImageUrls" class="size-full object-cover" :src="url" />
      </NCarousel>

      <!-- right text -->
      <div class="flex min-h-0 min-w-0 flex-1 flex-col px-4 py-3">
        <div class="mb-4 truncate text-base font-bold text-black dark:text-white">亮色主题可用</div>

        <NScrollbar class="flex-1">
          <!-- description -->
          <div class="markdown-body" v-html="markdownHtmlText" />
        </NScrollbar>

        <!-- button -->
        <div class="flex justify-end">
          <NButton size="small">已知晓</NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PREMADE_TEAM_COLORS_LIGHT } from '@renderer-shared/components/ongoing-game-panel/ongoing-game-utils'
import { markdownIt } from '@renderer-shared/utils/markdown'
import { NButton, NCarousel, NScrollbar } from 'naive-ui'
import { computed } from 'vue'

const lightColors = PREMADE_TEAM_COLORS_LIGHT

const markdownHtmlText = computed(() => {
  return markdownIt.render('当前 League Akari 已经支持 **亮色模式**。测试测试测试。')
})

const exampleImageUrls = [
  'https://sm.ign.com/ign_in/screenshot/default/lucky-star_85ab.jpg',
  'https://wallpapers.com/images/hd/lucky-star-6u9od1ao7yrb98tx.jpg',
  'https://th.bing.com/th/id/R.2df31e3ed2b2d0b8084b49566ca6cc6b?rik=1R5n3Ie6NFQ9tQ&riu=http%3a%2f%2fstatic.zerochan.net%2fYuru.Yuri.full.1277564.jpg&ehk=%2be7Ws8fA4UgOdXORAOvBFSOClCCAMnoaC0qKw6LPQvE%3d&risl=&pid=ImgRaw&r=0',
  'https://preview.redd.it/j2xa2oonxiy41.jpg?auto=webp&s=86814e4f940e748c7c481ac9ee062f6a349f3f27'
]
</script>
