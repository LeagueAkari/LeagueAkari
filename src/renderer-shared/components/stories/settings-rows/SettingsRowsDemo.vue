<template>
  <div class="flex flex-col gap-4">
    <StoryPanel
      title="Settings section + row"
      description="SettingsSection 提供分组标题和默认浅色卡片背景，SettingsRow 在其中渲染 label / description / 控件。"
    >
      <SettingsSection title="自动行为" footer="设置项标准布局，行内控件靠右对齐。">
        <SettingsRow
          :label="t('label.autoEnable')"
          :label-description="t('description.autoEnable')"
        >
          <NSwitch v-model:value="autoEnabled" size="small" />
        </SettingsRow>
        <SettingsRow
          :label="t('label.refreshDelay')"
          :label-description="t('description.refreshDelay')"
        >
          <NInputNumber v-model:value="refreshDelay" size="small" :min="0" :max="60" class="w-28" />
        </SettingsRow>
        <SettingsRow :label="t('label.disabled')" disabled>
          <NSwitch :value="false" disabled size="small" />
        </SettingsRow>
      </SettingsSection>
    </StoryPanel>

    <StoryPanel
      title="Align variants"
      description="顶部对齐适合控件高度大于标签的情况，比如多行 radio 组或文本域。"
    >
      <SettingsSection>
        <SettingsRow
          :label="t('label.position')"
          :label-description="t('description.position')"
          align="start"
        >
          <NRadioGroup v-model:value="position" size="small">
            <div class="flex flex-col gap-1">
              <NRadio value="d">D</NRadio>
              <NRadio value="f">F</NRadio>
              <NRadio value="auto">{{ t('label.positionAuto') }}</NRadio>
            </div>
          </NRadioGroup>
        </SettingsRow>
        <SettingsRow :label="t('label.note')" align="start">
          <NInput
            v-model:value="note"
            type="textarea"
            size="small"
            :autosize="{ minRows: 2, maxRows: 4 }"
            class="w-72"
          />
        </SettingsRow>
      </SettingsSection>
    </StoryPanel>

    <StoryPanel
      title="Custom label widths"
      description="label-width 控制左侧标签轨道宽度，gap 控制标签和控件之间的间距。"
    >
      <SettingsSection>
        <SettingsRow
          :label="t('label.shortLabel')"
          :label-description="t('description.shortLabel')"
          :label-width="120"
          :gap="24"
        >
          <NSwitch v-model:value="quickToggle" size="small" />
        </SettingsRow>
        <SettingsRow
          :label="t('label.longLabel')"
          :label-description="t('description.longLabel')"
          :label-width="320"
          :gap="64"
        >
          <NSelect v-model:value="region" :options="regionOptions" size="small" class="w-40" />
        </SettingsRow>
      </SettingsSection>
    </StoryPanel>

    <StoryPanel
      title="Control on its own line"
      description="control-full-line 把控件挪到下一行，适合宽控件，如长输入框、表格、多列开关等。"
    >
      <SettingsSection>
        <SettingsRow
          :label="t('label.scriptedRule')"
          :label-description="t('description.scriptedRule')"
          control-full-line
        >
          <NInput
            v-model:value="rule"
            size="small"
            placeholder="role == 'jungle' && winRate > 0.55"
            class="w-full"
          />
        </SettingsRow>
        <SettingsRow :label="t('label.options')" control-full-line>
          <div class="flex flex-wrap gap-3">
            <NCheckbox v-model:checked="optShowKda">{{ t('label.optShowKda') }}</NCheckbox>
            <NCheckbox v-model:checked="optShowWinRate">{{ t('label.optShowWinRate') }}</NCheckbox>
            <NCheckbox v-model:checked="optShowRecent">{{ t('label.optShowRecent') }}</NCheckbox>
          </div>
        </SettingsRow>
      </SettingsSection>
    </StoryPanel>

    <StoryPanel
      title="No background (popover or embedded)"
      description="no-bg 去掉浅色卡片背景，用于已有自定义容器，比如标题栏的 popover 设置面板。"
    >
      <div
        class="rounded-lg border border-black/10 bg-white/95 p-3 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-neutral-900/95 dark:shadow-black/30"
      >
        <SettingsSection no-bg>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-black/80 dark:text-white/90">
                {{ t('label.popoverTitle') }}
              </span>
              <NButton size="tiny" tertiary>{{ t('label.close') }}</NButton>
            </div>
          </template>
          <SettingsRow :label="t('label.orderPlayerBy')" :label-width="200">
            <NSelect v-model:value="orderBy" :options="orderOptions" size="small" class="w-32" />
          </SettingsRow>
          <SettingsRow
            :label="t('label.showJunglePathing')"
            :label-description="t('description.showJunglePathing')"
            :label-width="200"
          >
            <NSwitch v-model:value="showJunglePathing" size="small" />
          </SettingsRow>
        </SettingsSection>
      </div>
    </StoryPanel>

    <StoryPanel title="Header slot">
      <SettingsSection>
        <template #header>
          <div class="flex items-center gap-2">
            <NIcon class="text-base text-black/70 dark:text-white/70">
              <SettingsIcon />
            </NIcon>
            <span class="text-sm font-bold text-black/80 dark:text-white/90">
              {{ t('label.customHeader') }}
            </span>
            <NTag size="small" type="warning" :bordered="false">{{ t('label.beta') }}</NTag>
          </div>
        </template>
        <SettingsRow
          :label="t('label.experiment')"
          :label-description="t('description.experiment')"
        >
          <NSwitch v-model:value="experimentEnabled" size="small" />
        </SettingsRow>
      </SettingsSection>
    </StoryPanel>
  </div>
</template>

<script setup lang="ts">
import { SettingsRound as SettingsIcon } from '@vicons/material'
import {
  NButton,
  NCheckbox,
  NIcon,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSelect,
  NSwitch,
  NTag
} from 'naive-ui'
import { ref } from 'vue'

import SettingsRow from '../../SettingsRow.vue'
import SettingsSection from '../../SettingsSection.vue'
import StoryPanel from '../StoryPanel.vue'

// Storybook 没有真实的 i18n 上下文，提供一个最小化字典模拟翻译键，让示例更贴近真实页面写法。
const dict: Record<string, string> = {
  'label.autoEnable': '启用自动功能',
  'description.autoEnable': '应用启动后自动激活该功能。',
  'label.refreshDelay': '刷新延迟（秒）',
  'description.refreshDelay': '低于 1 秒会显著增加客户端压力。',
  'label.disabled': '维护中的设置',
  'label.position': '闪现位置',
  'description.position': '此条目使用顶部对齐 (align=\"start\")，避免标签和多行控件不齐。',
  'label.positionAuto': '自动 (跟随客户端)',
  'label.note': '备注',
  'label.shortLabel': '紧凑标签',
  'description.shortLabel': 'label-width 120，间距 24。',
  'label.longLabel': '较长标签：用于解释复杂行为',
  'description.longLabel': 'label-width 320，间距 64。',
  'label.scriptedRule': '脚本化筛选规则',
  'description.scriptedRule': '控件较宽，使用 control-full-line 让控件单独占一行。',
  'label.options': '展示项',
  'label.optShowKda': '显示 KDA',
  'label.optShowWinRate': '显示胜率',
  'label.optShowRecent': '显示最近对局',
  'label.popoverTitle': '当前对局快捷设置',
  'label.close': '关闭',
  'label.orderPlayerBy': '玩家排序方式',
  'label.showJunglePathing': '展示打野路径',
  'description.showJunglePathing': '为所有玩家展示打野路径推断。',
  'label.customHeader': '自定义 Header',
  'label.beta': 'Beta',
  'label.experiment': '加入实验',
  'description.experiment': '启用后将上报匿名诊断信息。'
}
const t = (key: string) => dict[key] ?? key

const autoEnabled = ref(true)
const refreshDelay = ref(5)

const position = ref<'d' | 'f' | 'auto'>('auto')
const note = ref('支持多行的备注内容，行内控件可以根据高度自动伸展。')

const quickToggle = ref(false)
const region = ref('NA1')
const regionOptions = [
  { label: 'NA1', value: 'NA1' },
  { label: 'EUW1', value: 'EUW1' },
  { label: 'KR', value: 'KR' },
  { label: 'TENCENT_HN1', value: 'TENCENT_HN1' }
]

const rule = ref("role == 'jungle' && winRate > 0.55")
const optShowKda = ref(true)
const optShowWinRate = ref(true)
const optShowRecent = ref(false)

const orderBy = ref('default')
const orderOptions = [
  { label: '默认', value: 'default' },
  { label: '位置', value: 'position' },
  { label: '胜率', value: 'win-rate' },
  { label: 'KDA', value: 'kda' }
]
const showJunglePathing = ref(true)

const experimentEnabled = ref(false)
</script>
