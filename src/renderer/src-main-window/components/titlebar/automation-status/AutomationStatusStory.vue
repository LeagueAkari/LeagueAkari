<template>
  <div class="automation-status-story">
    <section class="automation-status-story__custom">
      <div class="automation-status-story__section-heading">
        <span class="automation-status-story__section-title">可调实例</span>
        <span class="automation-status-story__section-detail">使用 Controls 调整启用项</span>
      </div>

      <div class="automation-status-story__titlebar">
        <AutomationStatusView v-model:open="customOpen" :compact="compact" :items="customItems" />
      </div>
    </section>

    <section>
      <div class="automation-status-story__section-heading">
        <span class="automation-status-story__section-title">状态对照</span>
        <span class="automation-status-story__section-detail">点击任意胶囊查看对应启用项</span>
      </div>

      <div class="automation-status-story__grid">
        <article
          v-for="example in examples"
          :key="example.id"
          class="automation-status-story__example"
        >
          <div class="automation-status-story__example-copy">
            <span class="automation-status-story__example-title">{{ example.label }}</span>
            <span class="automation-status-story__example-detail">{{ example.detail }}</span>
          </div>
          <div class="automation-status-story__titlebar is-example">
            <AutomationStatusView :compact="example.compact" :items="example.items" />
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { computed, ref, watch } from 'vue'

import AutomationStatusView from './AutomationStatusView.vue'
import type { AutomationStatusItem } from './types'

const props = withDefaults(
  defineProps<{
    compact?: boolean
    open?: boolean
    itemCount?: number
    showDetails?: boolean
    configuredCount?: number
    longLabels?: boolean
  }>(),
  {
    compact: false,
    open: true,
    itemCount: 3,
    showDetails: true,
    configuredCount: 3,
    longLabels: false
  }
)

const { t } = useTranslation()
const customOpen = ref(props.open)

watch(
  () => props.open,
  (value) => {
    customOpen.value = value
  }
)

const itemDefinitions = [
  ['auto-accept', 'titlebar.automation.items.autoAccept'],
  ['auto-pick-ban', 'titlebar.automation.items.autoPickBan'],
  ['auto-champ-config', 'titlebar.automation.items.autoChampConfig'],
  ['auto-honor', 'titlebar.automation.items.autoHonor'],
  ['auto-matchmaking', 'titlebar.automation.items.autoMatchmaking'],
  ['auto-reconnect', 'titlebar.automation.items.autoReconnect'],
  ['auto-trade', 'titlebar.automation.items.autoTrade'],
  ['auto-reply', 'titlebar.automation.items.autoReply'],
  ['scheduled-invitation', 'titlebar.automation.items.scheduledInvitation'],
  ['lock-offline', 'titlebar.automation.items.lockOffline']
] as const

const createItems = (options?: {
  count?: number
  details?: boolean
  longLabels?: boolean
}): AutomationStatusItem[] => {
  const count = Math.min(Math.max(options?.count ?? 3, 0), itemDefinitions.length)

  return itemDefinitions.slice(0, count).map(([id, labelKey], index) => ({
    id,
    label: options?.longLabels
      ? `${t(labelKey)} · 一个用于验证超长自动化名称截断行为的示例`
      : t(labelKey),
    detail: options?.details
      ? t('titlebar.automation.configuredModes', {
          count: index + 1
        })
      : undefined
  }))
}

const customItems = computed(() =>
  createItems({
    count: Math.round(props.itemCount),
    details: props.showDetails,
    longLabels: props.longLabels
  }).map((item) => ({
    ...item,
    detail: props.showDetails
      ? t('titlebar.automation.configuredModes', { count: props.configuredCount })
      : undefined
  }))
)

const examples = computed<
  Array<{
    id: string
    label: string
    detail: string
    compact: boolean
    items: AutomationStatusItem[]
  }>
>(() => [
  {
    id: 'single',
    label: '单个启用项',
    detail: '最短的常驻胶囊',
    compact: false,
    items: createItems({ count: 1 })
  },
  {
    id: 'multiple',
    label: '多个启用项',
    detail: '常见的多项自动化状态',
    compact: false,
    items: createItems({ count: 4 })
  },
  {
    id: 'details',
    label: '带详情',
    detail: '条目包含额外配置摘要',
    compact: false,
    items: createItems({ count: 3, details: true })
  },
  {
    id: 'long-labels',
    label: '长文本',
    detail: '验证标题和详情截断',
    compact: false,
    items: createItems({ count: 3, details: true, longLabels: true })
  },
  {
    id: 'many-items',
    label: '大量启用项',
    detail: '验证弹层滚动和密度',
    compact: false,
    items: createItems({ count: 10, details: true })
  },
  {
    id: 'compact',
    label: '紧凑模式',
    detail: '仅显示图标的标题栏形态',
    compact: true,
    items: createItems({ count: 4, details: true })
  },
  {
    id: 'hidden',
    label: '无启用项',
    detail: '没有项目时胶囊不占用空间',
    compact: false,
    items: []
  }
])
</script>

<style scoped>
.automation-status-story {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.automation-status-story__custom {
  min-height: 500px;
}

.automation-status-story__section-heading {
  display: flex;
  margin-bottom: 10px;
  align-items: baseline;
  gap: 8px;
}

.automation-status-story__section-title {
  font-size: 13px;
  font-weight: 600;
}

.automation-status-story__section-detail,
.automation-status-story__example-detail {
  color: color-mix(in oklch, var(--la-color-text-primary) 50%, transparent);
  font-size: 11px;
}

.automation-status-story__titlebar {
  display: flex;
  height: 40px;
  padding: 0 12px;
  align-items: center;
  justify-content: flex-end;
  box-sizing: border-box;
  border: 1px solid color-mix(in oklch, var(--la-color-text-primary) 10%, transparent);
  border-radius: 9px;
  background-color: color-mix(in oklch, var(--la-color-bg-primary) 88%, transparent);
}

.automation-status-story__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.automation-status-story__example {
  display: flex;
  min-width: 0;
  padding: 10px;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
  border: 1px solid color-mix(in oklch, var(--la-color-text-primary) 10%, transparent);
  border-radius: 9px;
  background-color: color-mix(in oklch, var(--la-color-text-primary) 3%, transparent);
}

.automation-status-story__example-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.automation-status-story__example-title {
  font-size: 12px;
  font-weight: 600;
}

.automation-status-story__titlebar.is-example {
  height: 36px;
  padding: 0 8px;
  border-radius: 6px;
}
</style>
