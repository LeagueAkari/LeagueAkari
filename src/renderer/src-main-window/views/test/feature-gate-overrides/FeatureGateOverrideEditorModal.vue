<template>
  <NModal
    :show="show"
    preset="card"
    :title="modalTitle"
    :mask-closable="!saving"
    :close-on-esc="!saving"
    style="width: min(780px, calc(100vw - 48px))"
    @update:show="handleShowUpdate"
  >
    <NScrollbar style="max-height: calc(100vh - 220px)" trigger="none">
      <div class="flex flex-col gap-5 pr-2">
        <NAlert
          v-if="saveFeedback"
          :type="saveFeedback.type"
          :title="saveFeedback.title"
          closable
          @close="saveFeedback = null"
        >
          {{ saveFeedback.message }}
        </NAlert>

        <NForm label-placement="top" :show-require-mark="false">
          <NFormItem
            label="Feature Gate Key"
            :validation-status="visibleKeyError ? 'error' : undefined"
            :feedback="visibleKeyError || keyHint"
            :show-feedback="Boolean(visibleKeyError || keyHint)"
          >
            <NInput
              v-model:value="draftKey"
              :disabled="saving || keyLocked"
              placeholder="例如 champion-data.opgg"
              @blur="keyTouched = true"
            />
          </NFormItem>
        </NForm>

        <NAlert
          v-if="!target?.key && resolvedDevOverride"
          type="warning"
          title="这个 key 已有 Dev 覆盖"
        >
          当前配置为“{{ featureGateOverrideModeLabel(resolvedDevOverride) }}”。保存会完整替换现有
          Dev 配置，不会新增第二项。可
          <NButton text type="primary" size="tiny" @click="loadExistingDevOverride">
            载入当前配置
          </NButton>
          后再修改。
        </NAlert>
        <NAlert
          v-else-if="!target?.key && resolvedCloudConfig"
          type="info"
          title="这个 key 已存在于云端"
        >
          保存会创建同名 Dev 覆盖。可在下方查看云端基线，或
          <NButton text type="primary" size="tiny" @click="loadCloudBaseline">
            载入云端规则
          </NButton>
          后再修改。
        </NAlert>

        <SettingsSection title="覆盖模式">
          <SettingsRow
            label="求值方式"
            :label-description="selectedModeDescription"
            :label-width="220"
            :gap="24"
          >
            <NRadioGroup v-model:value="draftMode" :disabled="saving" size="small">
              <NRadioButton
                v-for="mode in modeOptions"
                :key="mode.value"
                :value="mode.value"
                :label="mode.label"
              />
            </NRadioGroup>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection
          v-if="draftMode === 'rule'"
          title="运行时规则"
          footer="所有已填写条件同时命中时开启。至少需要一项限制；空规则请改用“强制开启”。"
        >
          <NForm label-placement="top" :show-require-mark="false">
            <SettingsRow
              label="平台"
              label-description="不选择时不限制操作系统。"
              :label-width="220"
              :gap="24"
            >
              <NCheckboxGroup v-model:value="draftPlatforms" :disabled="saving">
                <div class="flex gap-5">
                  <NCheckbox value="win32" label="Windows" />
                  <NCheckbox value="darwin" label="macOS" />
                </div>
              </NCheckboxGroup>
            </SettingsRow>

            <SettingsRow
              label="版本范围"
              label-description="最低版本包含，最高版本不包含；留空的一侧不限制。"
              :label-width="220"
              :gap="24"
              align="start"
            >
              <div class="grid w-105 grid-cols-2 gap-3">
                <NFormItem
                  label="最低版本（包含）"
                  :validation-status="minVersionError ? 'error' : undefined"
                  :feedback="minVersionError"
                  :show-feedback="Boolean(minVersionError)"
                >
                  <NInput
                    v-model:value="draftMinVersion"
                    :disabled="saving"
                    placeholder="例如 1.6.0"
                    clearable
                  />
                </NFormItem>
                <NFormItem
                  label="最高版本（不包含）"
                  :validation-status="maxVersionError ? 'error' : undefined"
                  :feedback="maxVersionError"
                  :show-feedback="Boolean(maxVersionError)"
                >
                  <NInput
                    v-model:value="draftMaxVersion"
                    :disabled="saving"
                    placeholder="例如 2.0.0"
                    clearable
                  />
                </NFormItem>
              </div>
            </SettingsRow>

            <SettingsRow
              label="SGP 区服"
              label-description="不选择时不限制区服；可输入新的区服 ID。"
              :label-width="220"
              :gap="24"
              align="start"
            >
              <NFormItem
                :validation-status="sgpServersError ? 'error' : undefined"
                :feedback="sgpServersError"
                :show-feedback="Boolean(sgpServersError)"
              >
                <NSelect
                  v-model:value="draftSgpServers"
                  :options="sgpServerOptions"
                  :disabled="saving"
                  style="width: 420px"
                  multiple
                  filterable
                  tag
                  clearable
                  placeholder="选择已知区服，或输入新的区服 ID 后回车"
                />
              </NFormItem>
            </SettingsRow>
          </NForm>

          <SettingsRow
            v-if="ruleGeneralError"
            label="规则校验"
            :label-description="ruleGeneralError"
            :label-width="220"
            :gap="24"
          >
            <NTag type="warning" :bordered="false">需要补充条件</NTag>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="当前环境预览">
          <SettingsRow
            label="当前环境"
            :label-description="currentEnvironmentSummary"
            :label-width="220"
            :gap="24"
          >
            <NTag
              size="small"
              :bordered="false"
              :type="
                draftPreviewEnabled === null
                  ? 'warning'
                  : draftPreviewEnabled
                    ? 'success'
                    : 'default'
              "
            >
              {{
                draftPreviewEnabled === null
                  ? '规则无效'
                  : draftPreviewEnabled
                    ? '预览开启'
                    : '预览关闭'
              }}
            </NTag>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection
          v-if="resolvedCloudConfig"
          footer="云端数据保持只读。保存同名 Dev 配置后，该 key 将完整使用本地配置，不再跟随云端更新。"
        >
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm leading-5 font-bold text-black/80 dark:text-white/90">
                云端基线
              </span>
              <NTag v-if="editorKey" size="small" :bordered="false" :type="cloudStatusType">
                {{ cloudStatusLabel }}
              </NTag>
            </div>
          </template>
          <SettingsRow
            label="规则摘要"
            :label-description="formatFeatureGateRule(resolvedCloudConfig)"
            :label-width="220"
            :gap="24"
          >
            <NTag size="small" :bordered="false" type="info">云端只读</NTag>
          </SettingsRow>
          <SettingsRow
            v-if="draftMatchesCloudBaseline"
            label="本地副本"
            label-description="当前草稿与云端基线相同；保存仍会冻结此 key 的云端跟随。"
            :label-width="220"
            :gap="24"
          >
            <NTag size="small" :bordered="false" type="warning"> 将冻结云端跟随 </NTag>
          </SettingsRow>
        </SettingsSection>
      </div>
    </NScrollbar>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <NButton
          v-if="target?.devOverride && !completedWithSyncTimeout"
          type="error"
          secondary
          :disabled="saving"
          @click="handleRemove"
        >
          {{ removeActionLabel }}
        </NButton>
        <div v-else />

        <div v-if="completedWithSyncTimeout">
          <NButton type="primary" @click="forceClose">关闭并检查页面状态</NButton>
        </div>
        <div v-else class="flex gap-2">
          <NButton :disabled="saving" @click="forceClose">取消</NButton>
          <NButton type="primary" :loading="saving" :disabled="!canSave" @click="handleSave">
            {{ saveActionLabel }}
          </NButton>
        </div>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { AkariFeatureGateKeySchema } from '@shared/shards/akari-api'
import type { AkariFeatureGateRuntimeRule } from '@shared/shards/akari-api'
import {
  FeatureGateDevOverrideSchema,
  type FeatureGateDevOverride,
  FeatureGateEvaluator,
  type FeatureGateServerStatus
} from '@shared/shards/feature-gating'
import { useInstance } from '@renderer-shared/shards'
import { useAkariApiStore } from '@renderer-shared/shards/akari-api/store'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { FeatureGatingRenderer } from '@renderer-shared/shards/feature-gating'
import { useFeatureGatingStore } from '@renderer-shared/shards/feature-gating/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import {
  NAlert,
  NButton,
  NCheckbox,
  NCheckboxGroup,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NRadioButton,
  NRadioGroup,
  NScrollbar,
  NSelect,
  NTag
} from 'naive-ui'
import { computed, ref, watch } from 'vue'

import type { FeatureGateOverrideEditorTarget } from './view-model'
import {
  featureGateOverrideModeLabel,
  formatFeatureGateRule,
  hasFeatureGateRuleConstraints
} from './view-model'

type OverrideMode = FeatureGateDevOverride['mode']
type SupportedPlatform = NonNullable<AkariFeatureGateRuntimeRule['platforms']>[number]

const props = defineProps<{
  show: boolean
  target: FeatureGateOverrideEditorTarget | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  saved: []
}>()

const appCommon = useAppCommonStore()
const akariApi = useAkariApiStore()
const featureGatingStore = useFeatureGatingStore()
const sgp = useSgpStore()
const featureGating = useInstance(FeatureGatingRenderer)

const draftKey = ref('')
const draftMode = ref<OverrideMode>('force-on')
const draftPlatforms = ref<SupportedPlatform[]>([])
const draftMinVersion = ref('')
const draftMaxVersion = ref('')
const draftSgpServers = ref<string[]>([])
const keyTouched = ref(false)
const saving = ref(false)
const saveFeedback = ref<{
  type: 'error' | 'warning'
  title: string
  message: string
} | null>(null)
const completedWithSyncTimeout = ref(false)
const previewEvaluator = new FeatureGateEvaluator()
const PREVIEW_KEY = 'development.preview'

const modeOptions: ReadonlyArray<{
  value: OverrideMode
  label: string
  description: string
}> = [
  { value: 'force-on', label: '强制开启', description: '无条件开启这个 key。' },
  { value: 'force-off', label: '强制关闭', description: '无条件关闭这个 key。' },
  { value: 'rule', label: '按规则', description: '按平台、版本和区服求值。' }
]
const selectedModeDescription = computed(
  () => modeOptions.find((mode) => mode.value === draftMode.value)?.description ?? ''
)

const modalTitle = computed(() => {
  if (props.target?.devOverride || resolvedDevOverride.value) {
    return '编辑 Dev 覆盖'
  }

  if (props.target?.key || resolvedCloudConfig.value) {
    return '创建 Dev 覆盖'
  }

  return '新增 Dev 覆盖'
})

const normalizedKey = computed(() => draftKey.value.trim())
const editorKey = computed(() => normalizedKey.value)
const keyLocked = computed(() => Boolean(props.target?.key && props.target.cloudConfig))
const keyHint = computed(() => {
  if (keyLocked.value) {
    return '云端 Key 不可改名；这里仅编辑它的本地 Dev 覆盖。'
  }

  if (props.target?.devOverride) {
    return '修改 Key 后，保存会将当前 Dev 项迁移到新名称。'
  }

  return ''
})

const resolvedCloudConfig = computed<AkariFeatureGateRuntimeRule | null>(() => {
  if (props.target?.key === normalizedKey.value) {
    return props.target.cloudConfig
  }

  const key = normalizedKey.value

  return key && Object.hasOwn(akariApi.featureGates?.gates ?? {}, key)
    ? (akariApi.featureGates?.gates[key] ?? null)
    : null
})

const resolvedDevOverride = computed<FeatureGateDevOverride | null>(() => {
  if (props.target?.key === normalizedKey.value) {
    return props.target.devOverride
  }

  const key = normalizedKey.value

  return key && Object.hasOwn(featureGatingStore.devOverrides, key)
    ? featureGatingStore.devOverrides[key]
    : null
})

const keyError = computed(() => {
  if (!normalizedKey.value) {
    return '请输入 Feature Gate key。'
  }

  if (
    props.target?.devOverride &&
    normalizedKey.value !== props.target.key &&
    Object.hasOwn(featureGatingStore.devOverrides, normalizedKey.value)
  ) {
    return '目标 Key 已有 Dev 覆盖，请使用其他名称。'
  }

  return AkariFeatureGateKeySchema.safeParse(normalizedKey.value).success
    ? ''
    : 'Key 必须是合法的点分名称，例如 champion-data.opgg。'
})

const visibleKeyError = computed(() => {
  if (!normalizedKey.value && !keyTouched.value) {
    return ''
  }

  return keyError.value
})

const draftOverride = computed<FeatureGateDevOverride>(() => {
  if (draftMode.value !== 'rule') {
    return { mode: draftMode.value }
  }

  const config: AkariFeatureGateRuntimeRule = {}

  if (draftPlatforms.value.length) {
    config.platforms = [...draftPlatforms.value]
  }

  const minVersion = draftMinVersion.value.trim()
  const maxVersion = draftMaxVersion.value.trim()
  const sgpServers = uniqueTrimmed(draftSgpServers.value)

  if (minVersion) {
    config.minVersionInclusive = minVersion
  }

  if (maxVersion) {
    config.maxVersionExclusive = maxVersion
  }

  if (sgpServers.length) {
    config.sgpServers = sgpServers
  }

  return { mode: 'rule', config }
})

const overrideValidation = computed(() =>
  FeatureGateDevOverrideSchema.safeParse(draftOverride.value)
)
const minVersionError = computed(() => issueMessage('config.minVersionInclusive'))
const maxVersionError = computed(() => issueMessage('config.maxVersionExclusive'))
const sgpServersError = computed(() => issueMessage('config.sgpServers'))
const ruleGeneralError = computed(() => issueMessage('config'))
const canSave = computed(
  () =>
    !saving.value &&
    !completedWithSyncTimeout.value &&
    !keyError.value &&
    overrideValidation.value.success
)
const saveActionLabel = computed(() => {
  if (props.target?.devOverride || resolvedDevOverride.value) {
    return '更新 Dev 覆盖'
  }

  if (resolvedCloudConfig.value) {
    return '创建 Dev 覆盖'
  }

  return '保存 Dev 覆盖'
})

const draftMatchesCloudBaseline = computed(() => {
  if (!resolvedCloudConfig.value || !overrideValidation.value.success) {
    return false
  }

  return areOverridesEqual(
    overrideValidation.value.data,
    overrideFromCloud(resolvedCloudConfig.value)
  )
})

const draftPreviewEnabled = computed<boolean | null>(() => {
  if (!overrideValidation.value.success) {
    return null
  }

  previewEvaluator.evaluate(
    null,
    {
      platform: appCommon.platform,
      version: appCommon.version,
      sgpServerId: sgp.availability.sgpServerId
    },
    { [PREVIEW_KEY]: overrideValidation.value.data }
  )

  return previewEvaluator.getEvaluation(PREVIEW_KEY, false).enabled
})

const currentEnvironmentSummary = computed(() => {
  const platform =
    appCommon.platform === 'win32'
      ? 'Windows'
      : appCommon.platform === 'darwin'
        ? 'macOS'
        : appCommon.platform

  return `${platform} · ${appCommon.version} · ${sgp.availability.sgpServerId || 'SGP 未连接'}`
})

const sgpServerOptions = computed(() => {
  const localeNames = sgp.leagueServers.serverNames[appCommon.settings.locale] ?? {}

  return Object.keys(sgp.leagueServers.servers)
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map((serverId) => ({
      value: serverId,
      label: localeNames[serverId] ? `${localeNames[serverId]} (${serverId})` : serverId
    }))
})

const cloudStatus = computed<FeatureGateServerStatus>(() => {
  if (!editorKey.value) {
    return 'not-configured'
  }

  return featureGating.getServerStatus(editorKey.value)
})

const cloudStatusLabel = computed(() => {
  switch (cloudStatus.value) {
    case 'enabled':
      return '云端开启'
    case 'rule-not-matched':
      return '云端规则未命中'
    case 'snapshot-unavailable':
      return '快照不可用'
    case 'not-configured':
      return '云端未配置'
  }
})

const cloudStatusType = computed(() => {
  switch (cloudStatus.value) {
    case 'enabled':
      return 'success' as const
    case 'rule-not-matched':
      return 'warning' as const
    case 'snapshot-unavailable':
      return 'error' as const
    case 'not-configured':
      return 'default' as const
  }
})

const removeActionLabel = computed(() =>
  props.target?.cloudConfig === null ? '删除 Dev 项' : '移除覆盖'
)

watch(
  () => [props.show, props.target] as const,
  ([show]) => {
    if (show) {
      resetDraft()
    }
  },
  { immediate: true }
)

function resetDraft() {
  const target = props.target
  draftKey.value = target?.key ?? ''
  keyTouched.value = false
  saveFeedback.value = null
  completedWithSyncTimeout.value = false

  const initialOverride = target?.devOverride ?? overrideFromCloud(target?.cloudConfig ?? null)
  applyOverrideToDraft(initialOverride)
}

function overrideFromCloud(
  cloudConfig: AkariFeatureGateRuntimeRule | null
): FeatureGateDevOverride {
  if (cloudConfig && hasFeatureGateRuleConstraints(cloudConfig)) {
    return {
      mode: 'rule',
      config: {
        platforms: cloudConfig.platforms ? [...cloudConfig.platforms] : undefined,
        minVersionInclusive: cloudConfig.minVersionInclusive,
        maxVersionExclusive: cloudConfig.maxVersionExclusive,
        sgpServers: cloudConfig.sgpServers ? [...cloudConfig.sgpServers] : undefined
      }
    }
  }

  return { mode: 'force-on' }
}

function loadCloudBaseline() {
  if (!resolvedCloudConfig.value) {
    return
  }

  applyOverrideToDraft(overrideFromCloud(resolvedCloudConfig.value))
}

function loadExistingDevOverride() {
  if (resolvedDevOverride.value) {
    applyOverrideToDraft(resolvedDevOverride.value)
  }
}

function applyOverrideToDraft(override: FeatureGateDevOverride) {
  draftMode.value = override.mode

  if (override.mode === 'rule') {
    draftPlatforms.value = [...(override.config.platforms ?? [])]
    draftMinVersion.value = override.config.minVersionInclusive ?? ''
    draftMaxVersion.value = override.config.maxVersionExclusive ?? ''
    draftSgpServers.value = [...(override.config.sgpServers ?? [])]
  } else {
    draftPlatforms.value = []
    draftMinVersion.value = ''
    draftMaxVersion.value = ''
    draftSgpServers.value = []
  }
}

function issueMessage(path: string) {
  const validation = overrideValidation.value

  if (validation.success) {
    return ''
  }

  const issue = validation.error.issues.find((item) => item.path.join('.') === path)

  if (!issue) {
    return ''
  }

  switch (path) {
    case 'config.minVersionInclusive':
      return '最低版本必须是合法的 SemVer。'
    case 'config.maxVersionExclusive':
      return issue.message.includes('greater than')
        ? '最高版本必须大于最低版本。'
        : '最高版本必须是合法的 SemVer。'
    case 'config.sgpServers':
      return '区服 ID 必须非空且不能重复。'
    case 'config':
      return '按规则模式至少需要填写平台、版本边界或 SGP 区服中的一项。'
    default:
      return issue.message
  }
}

function uniqueTrimmed(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function handleShowUpdate(value: boolean) {
  if (saving.value) {
    return
  }

  if (value) {
    emit('update:show', true)
  } else {
    forceClose()
  }
}

function forceClose() {
  emit('update:show', false)
}

async function handleSave() {
  if (!canSave.value || !overrideValidation.value.success) {
    return
  }

  saving.value = true
  saveFeedback.value = null
  const key = normalizedKey.value
  const override = overrideValidation.value.data
  const previousKey =
    props.target?.devOverride && props.target.key !== key
      ? (props.target.key ?? undefined)
      : undefined

  try {
    await featureGating.setDevOverride(key, override, previousKey)
    await waitForSyncedOverride(key, override)

    if (previousKey) {
      await waitForSyncedOverride(previousKey, null)
    }

    emit('saved')
    forceClose()
  } catch (error) {
    handleWriteError(error)
  } finally {
    saving.value = false
  }
}

async function handleRemove() {
  const key = props.target?.key

  if (!key || saving.value) {
    return
  }

  saving.value = true
  saveFeedback.value = null

  try {
    await featureGating.setDevOverride(key, null)
    await waitForSyncedOverride(key, null)
    emit('saved')
    forceClose()
  } catch (error) {
    handleWriteError(error)
  } finally {
    saving.value = false
  }
}

async function waitForSyncedOverride(key: string, expected: FeatureGateDevOverride | null) {
  if (isSyncedOverride(key, expected)) {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      stop()
      reject(new FeatureGateSyncTimeoutError())
    }, 3000)
    const stop = watch(
      () => featureGatingStore.devOverrides,
      () => {
        if (!isSyncedOverride(key, expected)) {
          return
        }

        window.clearTimeout(timeout)
        stop()
        resolve()
      }
    )
  })
}

function isSyncedOverride(key: string, expected: FeatureGateDevOverride | null) {
  const hasOverride = Object.hasOwn(featureGatingStore.devOverrides, key)

  if (expected === null) {
    return !hasOverride
  }

  if (!hasOverride) {
    return false
  }

  return areOverridesEqual(featureGatingStore.devOverrides[key], expected)
}

function areOverridesEqual(actual: FeatureGateDevOverride, expected: FeatureGateDevOverride) {
  if (actual.mode !== expected.mode) {
    return false
  }

  if (actual.mode !== 'rule' || expected.mode !== 'rule') {
    return true
  }

  return (
    areArraysEqual(actual.config.platforms, expected.config.platforms) &&
    actual.config.minVersionInclusive === expected.config.minVersionInclusive &&
    actual.config.maxVersionExclusive === expected.config.maxVersionExclusive &&
    areArraysEqual(actual.config.sgpServers, expected.config.sgpServers)
  )
}

function areArraysEqual<T>(actual: T[] | undefined, expected: T[] | undefined) {
  if (actual === expected) {
    return true
  }

  if (!actual || !expected || actual.length !== expected.length) {
    return false
  }

  return actual.every((value, index) => value === expected[index])
}

function handleWriteError(error: unknown) {
  if (error instanceof FeatureGateSyncTimeoutError) {
    completedWithSyncTimeout.value = true
    saveFeedback.value = {
      type: 'warning',
      title: '已写入，等待同步超时',
      message: '主进程已经接受并持久化配置，请关闭后检查页面状态，不要重复保存。'
    }

    return
  }

  saveFeedback.value = {
    type: 'error',
    title: '保存失败',
    message: errorMessage(error)
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

class FeatureGateSyncTimeoutError extends Error {}
</script>
