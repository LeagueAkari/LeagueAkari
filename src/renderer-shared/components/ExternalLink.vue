<template>
  <a :href="href" :target="blank ? '_blank' : '_self'">
    <span><slot></slot></span>
    <NIcon class="icon">
      <ExternalLinkIcon />
    </NIcon>
  </a>
</template>

<script lang="ts" setup>
import { ExternalLink as ExternalLinkIcon } from '@vicons/tabler'
import { NIcon } from 'naive-ui'

const { blank = true } = defineProps<{
  href?: string
  blank?: boolean
}>()
</script>

<style lang="less" scoped>
.icon {
  font-size: 1em;
  margin-left: 4px;
}

a {
  display: inline-flex;
  align-items: center;
}
</style>
