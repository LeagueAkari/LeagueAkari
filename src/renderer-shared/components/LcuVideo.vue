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
  if (lcs.connectionState === 'connected') {
    url.value = `akari://league-client${addLeadingSlash(props.src)}`
  } else {
    url.value = null
  }
})
</script>

<style lang="less" scoped>
[data-theme='dark'] {
.lcu-video {
  display: block;
}

.lcu-video-placeholder {
  color: rgb(103, 103, 103);
  background-color: rgb(56, 56, 56);
  border-radius: 4px;
}

}

[data-theme='light'] {
.lcu-video {
  display: block;
}

.lcu-video-placeholder {
  color: rgb(51, 51, 51);
  background-color: rgb(199, 199, 199);
  border-radius: 4px;
}

}
</style>
