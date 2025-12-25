<template>
  <div
    class="flex h-[600px] w-[360px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-stone-700 p-2"
  >
    <img class="mb-4 block h-[180px] w-[220px] bg-red-500/5" :src="santaHat" />

    <div class="mb-6 text-sm text-black dark:text-white">請選擇聖誕節姿勢</div>

    <div class="mb-4 text-xs text-black dark:text-white">
      * 如果不能鏈接或不能加載戰績，請嘗試切換姿勢
    </div>

    <div class="space-y-2">
      <div
        @click="emits('click')"
        v-for="i in 4"
        :class="{
          'bg-amber-600': i === 3
        }"
        class="group flex h-9 w-36 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-amber-600 transition-colors hover:bg-amber-600"
      >
        <span
          :class="{
            'text-white': i === 3
          }"
          class="text-amber-600 transition-colors group-hover:text-white"
          >姿勢{{ i }}</span
        >

        <div class="flex items-center gap-1">
          <div class="size-2.5 rounded-full bg-green-500/50" v-if="i !== 4" />
          <div class="size-2.5 rounded-full bg-red-500/50" v-else />

          <span class="text-[10px]" v-if="i !== 4">舒服</span>
          <span class="text-[10px]" v-else>較難</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import santaHat from '@renderer-shared/assets/santa-hat.png'

const emits = defineEmits<{
  click: []
}>()
</script>
