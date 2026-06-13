<template>
  <video v-bind="$attrs" :loop :autoplay v-if="url" :src="url" class="lcu-video" />
  <div v-else class="lcu-video-placeholder"></div>
</template>

<script lang="ts" setup>
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { addLeadingSlash } from '@shared/utils/uri'
import { ref, watchEffect } from 'vue'

const props = defineProps<{
  src?: string
  loop?: boolean
  autoplay?: boolean
}>()

const url = ref<string | null>(null)
const lcs = useLeagueClientStore()

watchEffect(() => {
  if (lcs.isConnected) {
    url.value = `akari://league-client${addLeadingSlash(props.src)}`
  } else {
    url.value = null
  }
})
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

@layer components {
  .lcu-video {
    display: block;
  }

  .lcu-video-placeholder {
    @apply box-border rounded bg-gray-500/40 dark:bg-black/20;
  }
}
</style>
