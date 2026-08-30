<template>
  <div class="h-full">
    <NScrollbar class="h-full">
      <div class="box-border min-h-full p-4">
        <SettingsSection footer="Dev 覆盖仅在开发环境加载；云端快照与本地配置始终保持独立。">
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex min-w-0 flex-wrap items-center gap-2">
                <div class="flex items-center gap-1.5">
                  <NIcon size="18"><Flag20Regular /></NIcon>
                  <span class="text-sm leading-5 font-bold text-black/80 dark:text-white/90">
                    Feature Gate 覆盖
                  </span>
                </div>
                <NTag size="tiny" :bordered="false" type="info"> 云端 {{ cloudGateCount }} </NTag>
                <NTag size="tiny" :bordered="false" type="warning">
                  Dev {{ devOverrideCount }}
                </NTag>
                <span class="truncate text-xs text-black/50 dark:text-white/50">
                  更新于 {{ snapshotUpdatedAt }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <NInput
                  v-model:value="searchQuery"
                  class="w-64!"
                  size="small"
                  clearable
                  placeholder="搜索 FG key"
                >
                  <template #prefix>
                    <NIcon><Search20Regular /></NIcon>
                  </template>
                </NInput>
                <NButton type="primary" size="small" @click="openCreateEditor">
                  <template #icon>
                    <NIcon><Add20Regular /></NIcon>
                  </template>
                  新增 Dev 覆盖
                </NButton>
              </div>
            </div>
          </template>

          <div class="p-3">
            <div class="overflow-hidden rounded">
              <NDataTable
                :columns="columns"
                :data="tableData"
                :row-key="rowKey"
                :pagination="false"
                :scroll-x="1040"
                size="small"
                :bordered="false"
                :single-line="false"
              >
                <template #empty>
                  <NEmpty
                    class="py-12"
                    :description="
                      searchQuery ? '没有匹配的 Feature Gate' : '暂无云端或本地 Feature Gate 配置'
                    "
                  >
                    <template v-if="!searchQuery" #extra>
                      <NButton size="small" type="primary" @click="openCreateEditor">
                        <template #icon>
                          <NIcon><Add20Regular /></NIcon>
                        </template>
                        新增 Dev 覆盖
                      </NButton>
                    </template>
                  </NEmpty>
                </template>
              </NDataTable>
            </div>
          </div>
        </SettingsSection>
      </div>
    </NScrollbar>

    <FeatureGateOverrideEditorModal
      v-model:show="editorShow"
      :target="editorTarget"
      @saved="message.success('Dev FG 配置已更新')"
    />
  </div>
</template>

<script setup lang="tsx">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAkariApiStore } from '@renderer-shared/shards/akari-api/store'
import { FeatureGatingRenderer } from '@renderer-shared/shards/feature-gating'
import { useFeatureGatingStore } from '@renderer-shared/shards/feature-gating/store'
import type { FeatureGateDevOverride } from '@shared/shards/feature-gating'
import {
  Add20Regular,
  AddCircle20Regular,
  ArrowSync20Regular,
  CheckmarkCircle20Regular,
  Cloud20Regular,
  DismissCircle20Regular,
  Edit20Regular,
  Flag20Regular,
  Search20Regular,
  Settings20Regular
} from '@vicons/fluent'
import {
  type DataTableColumns,
  NButton,
  NDataTable,
  NEllipsis,
  NEmpty,
  NIcon,
  NInput,
  NScrollbar,
  NTag,
  NText,
  useMessage
} from 'naive-ui'
import { computed, h, ref, type Component } from 'vue'

import FeatureGateOverrideEditorModal from './FeatureGateOverrideEditorModal.vue'
import FeatureGateRuleSummary from './FeatureGateRuleSummary.vue'
import {
  buildFeatureGateGroups,
  featureGateOverrideModeLabel,
  type FeatureGateListGroup,
  type FeatureGateListRow,
  type FeatureGateOverrideEditorTarget
} from './view-model'

interface FeatureGateGroupTableRow {
  kind: 'group'
  key: string
  group: FeatureGateListGroup
}

interface FeatureGateItemTableRow extends FeatureGateListRow {
  kind: 'gate'
}

type FeatureGateTableRow = FeatureGateGroupTableRow | FeatureGateItemTableRow

const akariApi = useAkariApiStore()
const featureGatingStore = useFeatureGatingStore()
const featureGating = useInstance(FeatureGatingRenderer)
const message = useMessage()

const searchQuery = ref('')
const editorShow = ref(false)
const editorTarget = ref<FeatureGateOverrideEditorTarget | null>(null)

const cloudGateCount = computed(() => Object.keys(akariApi.featureGates?.gates ?? {}).length)
const devOverrideCount = computed(() => Object.keys(featureGatingStore.devOverrides).length)
const snapshotUpdatedAt = computed(() => {
  const value = akariApi.featureGates?.updatedAt
  if (!value) return '快照不可用'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
})

const groups = computed(() =>
  buildFeatureGateGroups({
    cloudSnapshot: akariApi.featureGates,
    devOverrides: featureGatingStore.devOverrides,
    query: searchQuery.value,
    isEnabled: (key) => featureGating.isEnabled(key, false)
  })
)

const tableData = computed<FeatureGateTableRow[]>(() =>
  groups.value.flatMap((group) => [
    { kind: 'group' as const, key: `group:${group.id}`, group },
    ...group.rows.map((row) => ({ ...row, kind: 'gate' as const }))
  ])
)

const columns = computed<DataTableColumns<FeatureGateTableRow>>(() => [
  {
    title: '最终状态',
    key: 'status',
    width: 112,
    colSpan: (row) => (row.kind === 'group' ? 5 : 1),
    render: (row) => (row.kind === 'group' ? renderGroup(row.group) : renderStatus(row))
  },
  {
    title: 'Key',
    key: 'key',
    minWidth: 280,
    colSpan: (row) => (row.kind === 'group' ? 0 : 1),
    render: (row) =>
      row.kind === 'gate' ? (
        <NEllipsis class="max-w-100 font-mono text-sm">{row.key}</NEllipsis>
      ) : null
  },
  {
    title: '来源 / 模式',
    key: 'source',
    width: 144,
    colSpan: (row) => (row.kind === 'group' ? 0 : 1),
    render: (row) => (row.kind === 'gate' ? renderSource(row) : null)
  },
  {
    title: '生效规则',
    key: 'rule',
    minWidth: 360,
    colSpan: (row) => (row.kind === 'group' ? 0 : 1),
    render: (row) =>
      row.kind === 'gate' ? (
        <FeatureGateRuleSummary devOverride={row.devOverride} cloudConfig={row.cloudConfig} />
      ) : null
  },
  {
    title: '操作',
    key: 'actions',
    width: 124,
    colSpan: (row) => (row.kind === 'group' ? 0 : 1),
    render: (row) =>
      row.kind === 'gate' ? (
        <div class="flex justify-end">
          <NButton size="small" tertiary onClick={() => openRowEditor(row)}>
            {{
              icon: () => <NIcon>{row.devOverride ? <Edit20Regular /> : <Add20Regular />}</NIcon>,
              default: () => (row.devOverride ? '编辑' : '创建覆盖')
            }}
          </NButton>
        </div>
      ) : null
  }
])

const groupIcons: Record<FeatureGateListGroup['id'], Component> = {
  'local-only': AddCircle20Regular,
  'overridden-cloud': ArrowSync20Regular,
  'cloud-only': Cloud20Regular
}

function renderGroup(group: FeatureGateListGroup) {
  return (
    <div class="flex min-w-0 items-center gap-2 py-1">
      <NIcon size={18}>{h(groupIcons[group.id])}</NIcon>
      <span class="shrink-0 font-medium">{group.title}</span>
      <NTag size="tiny" bordered={false}>
        {group.rows.length}
      </NTag>
      <NText depth={3} class="truncate text-xs">
        {group.description}
      </NText>
    </div>
  )
}

function renderStatus(row: FeatureGateItemTableRow) {
  return (
    <NTag
      size="small"
      bordered={false}
      type={row.effective ? 'success' : 'default'}
      class="whitespace-nowrap"
    >
      <span class="inline-flex items-center gap-1">
        <NIcon size={14}>
          {row.effective ? <CheckmarkCircle20Regular /> : <DismissCircle20Regular />}
        </NIcon>
        {row.effective ? '已开启' : '已关闭'}
      </span>
    </NTag>
  )
}

function renderSource(row: FeatureGateItemTableRow) {
  const override = row.devOverride
  return (
    <NTag
      size="small"
      bordered={false}
      type={override ? overrideTagType(override) : 'info'}
      class="whitespace-nowrap"
    >
      <span class="inline-flex items-center gap-1">
        <NIcon size={14}>{override ? <Settings20Regular /> : <Cloud20Regular />}</NIcon>
        {override ? featureGateOverrideModeLabel(override) : '云端规则'}
      </span>
    </NTag>
  )
}

function rowKey(row: FeatureGateTableRow) {
  return row.key
}

function openCreateEditor() {
  editorTarget.value = {
    key: null,
    cloudConfig: null,
    devOverride: null
  }
  editorShow.value = true
}

function openRowEditor(row: FeatureGateListRow) {
  editorTarget.value = {
    key: row.key,
    cloudConfig: row.cloudConfig,
    devOverride: row.devOverride
  }
  editorShow.value = true
}

function overrideTagType(override: FeatureGateDevOverride) {
  if (override.mode === 'force-on') return 'success' as const
  if (override.mode === 'force-off') return 'error' as const
  return 'warning' as const
}
</script>
