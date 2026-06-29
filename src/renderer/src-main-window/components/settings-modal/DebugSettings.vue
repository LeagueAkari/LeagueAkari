<template>
  <NScrollbar class="h-full">
    <NModal preset="card" size="small" v-model:show="editRuleModalShow" class="max-w-[500px]">
      <template #header>{{ t('settings.debug.lcuEvent.modal.title') }}</template>
      <template #footer>
        <div class="flex w-full justify-end">
          <NButton
            size="small"
            type="primary"
            secondary
            :disabled="!editRuleValid"
            @click="handleAddRule"
            class="ml-auto"
          >
            {{ t('settings.debug.lcuEvent.modal.button') }}
          </NButton>
        </div>
      </template>
      <NAutoComplete
        ref="edit-rule-input"
        :placeholder="t('settings.debug.lcuEvent.modal.placeholder')"
        v-model:value="editRuleText"
        :options="options"
        size="small"
        :status="editRuleValid ? 'success' : 'error'"
      />
    </NModal>
    <div class="flex flex-col gap-6">
      <SettingsSection :title="t('settings.debug.files.title')">
        <SettingsRow
          :label="t('settings.debug.files.logs.label')"
          :label-description="t('settings.debug.files.logs.description')"
          :label-width="400"
        >
          <NButton size="small" secondary type="primary" @click="() => handleShowLogsDir()"
            >{{ t('settings.debug.files.logs.button') }}
          </NButton>
        </SettingsRow>
        <SettingsRow :label="t('settings.debug.files.appData.label')" :label-width="400">
          <template #labelDescription>
            <TranslationComponent :translation="t('settings.debug.files.appData.description.full')">
              <template #details>
                <NPopover :delay="50">
                  <template #trigger>
                    <span class="cursor-pointer font-bold text-black/80 dark:text-white">
                      {{ t('settings.debug.files.appData.popoverTrigger') }}
                    </span>
                  </template>
                  <table>
                    <colgroup>
                      <col class="w-25" />
                    </colgroup>
                    <tbody class="text-xs">
                      <tr>
                        <td>LeagueAkari.db</td>
                        <td>{{ t('settings.debug.files.appData.description.part2') }}</td>
                      </tr>
                      <tr>
                        <td>NewUpdates/</td>
                        <td>{{ t('settings.debug.files.appData.description.part3') }}</td>
                      </tr>
                      <tr>
                        <td>AkariConfig/</td>
                        <td>{{ t('settings.debug.files.appData.description.part4') }}</td>
                      </tr>
                      <tr>
                        <td>base-config.json</td>
                        <td>{{ t('settings.debug.files.appData.description.part5') }}</td>
                      </tr>
                    </tbody>
                  </table>
                </NPopover>
              </template>
            </TranslationComponent>
          </template>
          <NButton size="small" secondary type="primary" @click="() => handleShowUserDataDir()">{{
            t('settings.debug.files.appData.button')
          }}</NButton>
        </SettingsRow>
      </SettingsSection>
      <SettingsSection :title="t('settings.debug.lcuEvent.label')">
        <div class="max-w-full overflow-x-auto p-3">
          <div class="mb-2 flex items-center gap-1">
            <NCheckbox
              size="small"
              class="text-[13px]"
              :checked="rds.logAllLcuEvents"
              @update:checked="(val) => rd.setLogAllLcuEvents(val)"
              >{{ t('settings.debug.lcuEvent.logAll') }}</NCheckbox
            >
            <NButton size="tiny" @click="handleShowAddModal" secondary type="primary">{{
              t('settings.debug.lcuEvent.addRule')
            }}</NButton>
          </div>
          <NCollapseTransition>
            <NDataTable
              :class="$style.table"
              :columns="columns"
              :data="printRulesArr"
              size="small"
              bordered
            >
              <template #empty>{{ t('settings.debug.lcuEvent.empty') }}</template>
            </NDataTable>
          </NCollapseTransition>
        </div>
      </SettingsSection>
      <SettingsSection
        :title="
          lc.isConnected
            ? t('settings.debug.lcuConnection.titleConnected')
            : t('settings.debug.lcuConnection.titleDisconnected')
        "
      >
        <div class="max-w-full overflow-x-auto p-3">
          <NTable size="small" bordered>
            <colgroup>
              <col class="w-30" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <td>{{ t('settings.debug.lcuConnection.port') }}</td>
                <td><CopyableText :text="lc.auth?.port ?? '-'" /></td>
              </tr>
              <tr>
                <td>{{ t('settings.debug.lcuConnection.pid') }}</td>
                <td><CopyableText :text="lc.auth?.pid ?? '-'" /></td>
              </tr>
              <tr>
                <td>{{ t('settings.debug.lcuConnection.auth') }}</td>
                <td><CopyableText :text="lc.auth?.authToken ?? '-'" /></td>
              </tr>
              <tr>
                <td>{{ t('settings.debug.lcuConnection.rsoPlatform') }}</td>
                <td>
                  <CopyableText :text="lc.auth?.rsoPlatformId ?? '-'">{{
                    (lc.auth?.rsoPlatformId
                      ? TENCENT_RSO_PLATFORM_NAME[lc.auth.rsoPlatformId] || lc.auth.rsoPlatformId
                      : lc.auth?.rsoPlatformId) || '-'
                  }}</CopyableText>
                </td>
              </tr>
              <tr>
                <td>{{ t('settings.debug.lcuConnection.region') }}</td>
                <td>
                  <CopyableText :text="lc.auth?.region ?? '-'">{{
                    lc.auth?.region
                      ? REGION_NAME[lc.auth.region] || lc.auth.region
                      : lc.auth?.region || '-'
                  }}</CopyableText>
                </td>
              </tr>
            </tbody>
          </NTable>
        </div>
      </SettingsSection>
      <SettingsSection :title="t('settings.debug.gameflow.title')">
        <div class="p-3 text-[13px]">
          <span v-if="lc.isConnected"
            >{{ gameflowText[lc.gameflow.phase || 'None'] }} ({{ lc.gameflow.phase }})</span
          >
          <span v-else>{{ t('settings.debug.gameflow.unavailable') }}</span>
        </div>
      </SettingsSection>
      <SettingsSection v-if="as.isElevated">
        <template #header>
          <LeagueAkariSpan
            class="text-sm leading-5 font-bold text-black/80 dark:text-white/90"
            text="League Akari X"
          />
        </template>
        <div class="p-3 text-[13px]">{{ t('settings.debug.inAdministrator.description') }}</div>
      </SettingsSection>
      <SettingsSection title="Runtime Info">
        <div class="max-w-full overflow-x-auto p-3">
          <NDescriptions
            v-if="runtimeInfo"
            bordered
            size="small"
            :columns="6"
            label-placement="top"
            class="select-text"
          >
            <NDescriptionsItem label="League Akari Version">{{
              runtimeInfo.version
            }}</NDescriptionsItem>
            <NDescriptionsItem label="PID">{{ runtimeInfo.pid }}</NDescriptionsItem>
            <NDescriptionsItem label="Platform">{{ runtimeInfo.platform }}</NDescriptionsItem>
            <NDescriptionsItem label="Arch">{{ runtimeInfo.arch }}</NDescriptionsItem>
            <NDescriptionsItem label="Uptime"
              >{{ runtimeInfo.uptime.toFixed(2) }} s</NDescriptionsItem
            >
            <NDescriptionsItem label="CPUs">
              {{ runtimeInfo.os.cpus.length }}
            </NDescriptionsItem>
            <NDescriptionsItem label="OS Type">
              {{ runtimeInfo.os.type }}
            </NDescriptionsItem>
            <NDescriptionsItem label="OS Release">
              {{ runtimeInfo.os.release }}
            </NDescriptionsItem>
            <NDescriptionsItem label="Memory">
              {{ runtimeInfo.os.totalmem }} ({{ (runtimeInfo.os.totalmem / 1073741824).toFixed(2) }}
              GB)
            </NDescriptionsItem>
            <NDescriptionsItem label="NODE_ENV" :span="3">
              {{ runtimeInfo.env.NODE_ENV }}
            </NDescriptionsItem>
            <NDescriptionsItem label="Argv" :span="6">
              <span class="font-mono">{{
              runtimeInfo.argv.map((a: string) => (a.includes(' ') ? `"${a}"` : a)).join(' ')
              }}</span>
            </NDescriptionsItem>
            <NDescriptionsItem label="Electron">
              {{ runtimeInfo.versions.electron }}
            </NDescriptionsItem>
            <NDescriptionsItem label="Node">
              {{ runtimeInfo.versions.node }}
            </NDescriptionsItem>
            <NDescriptionsItem label="Chrome">
              {{ runtimeInfo.versions.chrome }}
            </NDescriptionsItem>
            <NDescriptionsItem label="V8">
              {{ runtimeInfo.versions.v8 }}
            </NDescriptionsItem>
          </NDescriptions>
        </div>
      </SettingsSection>
      <SettingsSection title="Akari Zone">
        <SettingsRow
          :label="t('settings.debug.testPage.label')"
          :label-description="t('settings.debug.testPage.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="mui.frontendSettings.showTestPage"
            @update:value="(val: boolean) => (mui.frontendSettings.showTestPage = val)"
          />
        </SettingsRow>
      </SettingsSection>
    </div>
  </NScrollbar>
</template>

<script setup lang="tsx">
import CopyableText from '@renderer-shared/components/CopyableText.vue'
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { RendererDebugRenderer } from '@renderer-shared/shards/renderer-debug'
import { useRendererDebugStore } from '@renderer-shared/shards/renderer-debug/store'
import { REGION_NAME, TENCENT_RSO_PLATFORM_NAME } from '@shared/utils/platform-names'
import { RadixMatcher } from '@shared/utils/radix-matcher'
import { useIntervalFn } from '@vueuse/core'
import { TranslationComponent, useTranslation } from 'i18next-vue'
import {
  DataTableColumn,
  NAutoComplete,
  NButton,
  NCheckbox,
  NCollapseTransition,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NFlex,
  NModal,
  NPopover,
  NScrollbar,
  NSwitch,
  NTable
} from 'naive-ui'
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue'

import { useMainWindowUiStore } from '@main-window/shards/main-window-ui/store'

import { LCU_ENDPOINTS } from './lcu-endpoints'

const { t } = useTranslation()

const lc = useLeagueClientStore()
const rds = useRendererDebugStore()
const as = useAppCommonStore()
const mui = useMainWindowUiStore()

const log = useInstance(LoggerRenderer)
const app = useInstance(AppCommonRenderer)
const rd = useInstance(RendererDebugRenderer)

const gameflowText = computed(() => {
  return {
    Matchmaking: t('settings.debug.gameflow.Matchmaking'),
    ChampSelect: t('settings.debug.gameflow.ChampSelect'),
    ReadyCheck: t('settings.debug.gameflow.ReadyCheck'),
    InProgress: t('settings.debug.gameflow.InProgress'),
    EndOfGame: t('settings.debug.gameflow.EndOfGame'),
    Lobby: t('settings.debug.gameflow.Lobby'),
    GameStart: t('settings.debug.gameflow.GameStart'),
    None: t('settings.debug.gameflow.None'),
    Reconnect: t('settings.debug.gameflow.Reconnect'),
    WaitingForStats: t('settings.debug.gameflow.WaitingForStats'),
    PreEndOfGame: t('settings.debug.gameflow.PreEndOfGame'),
    WatchInProgress: t('settings.debug.gameflow.WatchInProgress')
  }
})

const columns: DataTableColumn<any>[] = [
  {
    title: t('settings.debug.lcuEvent.enable'),
    key: 'enable',
    width: 84,
    fixed: 'left',
    render: (row) => {
      return (
        <NCheckbox
          {...{
            'onUpdate:checked': (val: boolean) => {
              if (val) {
                rd.enableRule(row.data.rule)
              } else {
                rd.disableRule(row.data.rule)
              }
            },
            checked: row.data.enabled,
            size: 'small'
          }}
        />
      )
    }
  },
  {
    title: t('settings.debug.lcuEvent.rule'),
    key: 'rule',
    render: (row) => {
      return <code class="select-text">{row.data.rule}</code>
    }
  },
  {
    key: 'operations',
    fixed: 'right',
    width: 50,
    render: (row) => {
      return (
        <NFlex size={4}>
          <NButton
            size="tiny"
            type="error"
            secondary
            onClick={() => handleRemoveEditRule(row.data.rule)}
          >
            {t('settings.debug.lcuEvent.delete')}
          </NButton>
        </NFlex>
      )
    }
  }
]

const printRulesArr = computed(() => {
  return rds.rules.map((rule) => ({
    rule,
    data: rule
  }))
})

const editRuleModalShow = ref(false)
const editRuleText = ref('')
const editRuleInputEl = useTemplateRef('edit-rule-input')

watch(
  () => editRuleModalShow.value,
  (show) => {
    if (show) {
      nextTick(() => {
        editRuleInputEl.value?.focus()
      })
    }
  }
)

function isSubsequence(s: string, t: string) {
  let index = 0
  for (let i = 0; i < t.length && index < s.length; i++) {
    if (s[index] === t[i]) {
      index++
    }
  }
  return index === s.length
}

const options = computed(() => {
  return LCU_ENDPOINTS.filter((v) => isSubsequence(editRuleText.value, v)).toSorted(
    (a, b) => a.length - b.length
  )
})

const editRuleValid = computed(() => {
  if (!editRuleText.value) {
    return false
  }

  try {
    RadixMatcher.validateRoute(editRuleText.value)
  } catch (error) {
    return false
  }
  return true
})

const handleShowAddModal = async () => {
  editRuleText.value = ''
  editRuleModalShow.value = true
}

const handleAddRule = async () => {
  if (!editRuleValid.value) {
    return
  }

  rd.addRule(editRuleText.value)

  editRuleModalShow.value = false
}

const handleRemoveEditRule = async (rule: string) => {
  rd.removeRule(rule)
}

const handleShowLogsDir = async () => {
  await log.openLogsDir()
}

const handleShowUserDataDir = async () => {
  await app.openUserDataDir()
}

const runtimeInfo = shallowRef<any>(null)

useIntervalFn(
  async () => {
    runtimeInfo.value = await app.getRuntimeInfo()
  },
  2000,
  { immediateCallback: true }
)
</script>

<style module>
.table :global(.n-data-table-empty) {
  --n-empty-padding: 12px;
}
</style>
