<template>
  <img @dragstart.prevent v-if="url" :src="url" class="lcu-image" @error="handleError" />
  <div v-else class="lcu-image-placeholder"></div>
</template>

<script lang="ts" setup>
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { ref, watchEffect } from 'vue'

const props = defineProps<{
  src?: string
}>()

const url = ref<string | null>(null)
const lcs = useLeagueClientStore()

watchEffect(() => {
  if (typeof props.src !== 'undefined' && props.src) {
    const resolvedUrl = new URL(props.src, 'akari://league-client').href

    if (resolvedUrl.startsWith('akari://')) {
      if (lcs.connectionState === 'connected') {
        url.value = resolvedUrl
      } else {
        url.value = null
      }
    } else {
      url.value = props.src
    }
  } else {
    url.value = null
  }
})

const handleError = () => {
  url.value = null
}
</script>

<style lang="less" scoped>
.lcu-image {
  display: block;
}

.lcu-image-placeholder {
  border: 1px solid #fff2;
  background-color: #0006;
  border-radius: 4px;
  box-sizing: border-box;
}
</style>
