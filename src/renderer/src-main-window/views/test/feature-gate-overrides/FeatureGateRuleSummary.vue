<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <NTag
      v-if="effectiveOverride?.mode === 'force-on'"
      size="small"
      :bordered="false"
      type="success"
    >
      <span class="inline-flex items-center gap-1">
        <NIcon size="14"><CheckmarkCircle20Regular /></NIcon>
        忽略运行环境，始终开启
      </span>
    </NTag>
    <NTag
      v-else-if="effectiveOverride?.mode === 'force-off'"
      size="small"
      :bordered="false"
      type="error"
    >
      <span class="inline-flex items-center gap-1">
        <NIcon size="14"><DismissCircle20Regular /></NIcon>
        忽略运行环境，始终关闭
      </span>
    </NTag>
    <template v-else-if="effectiveRule">
      <NTag v-if="effectiveRule.platforms" size="small" :bordered="false" type="info">
        <span class="inline-flex items-center gap-1">
          <NIcon size="14"><Desktop20Regular /></NIcon>
          {{ platformText }}
        </span>
      </NTag>
      <NTag v-if="versionText" size="small" :bordered="false" type="warning">
        <span class="inline-flex items-center gap-1">
          <NIcon size="14"><Tag20Regular /></NIcon>
          {{ versionText }}
        </span>
      </NTag>
      <NTag v-if="effectiveRule.sgpServers" size="small" :bordered="false">
        <span class="inline-flex items-center gap-1">
          <NIcon size="14"><Server20Regular /></NIcon>
          {{ effectiveRule.sgpServers.join('、') }}
        </span>
      </NTag>
      <NTag v-if="isUnrestricted" size="small" :bordered="false" type="success">
        <span class="inline-flex items-center gap-1">
          <NIcon size="14"><Globe20Regular /></NIcon>
          全部运行环境
        </span>
      </NTag>
    </template>
    <NText v-else depth="3" class="text-xs">未配置规则</NText>
  </div>
</template>

<script setup lang="ts">
import type { AkariFeatureGateRuntimeRule } from '@shared/shards/akari-api'
import type { FeatureGateDevOverride } from '@shared/shards/feature-gating'
import {
  CheckmarkCircle20Regular,
  Desktop20Regular,
  DismissCircle20Regular,
  Globe20Regular,
  Server20Regular,
  Tag20Regular
} from '@vicons/fluent'
import { NIcon, NTag, NText } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps<{
  devOverride: FeatureGateDevOverride | null
  cloudConfig: AkariFeatureGateRuntimeRule | null
}>()

const effectiveOverride = computed<FeatureGateDevOverride | null>(() => {
  if (props.devOverride) return props.devOverride
  return props.cloudConfig ? { mode: 'rule', config: props.cloudConfig } : null
})

const effectiveRule = computed(() =>
  effectiveOverride.value?.mode === 'rule' ? effectiveOverride.value.config : null
)
const platformText = computed(() =>
  effectiveRule.value?.platforms
    ?.map((platform) => (platform === 'win32' ? 'Windows' : 'macOS'))
    .join('、')
)
const versionText = computed(() => {
  const config = effectiveRule.value
  if (!config) return ''
  const parts: string[] = []
  if (config.minVersionInclusive) parts.push(`≥ ${config.minVersionInclusive}`)
  if (config.maxVersionExclusive) parts.push(`< ${config.maxVersionExclusive}`)
  return parts.join(' 且 ')
})
const isUnrestricted = computed(() => {
  const config = effectiveRule.value
  return Boolean(
    config &&
    !config.platforms &&
    !config.minVersionInclusive &&
    !config.maxVersionExclusive &&
    !config.sgpServers
  )
})
</script>
