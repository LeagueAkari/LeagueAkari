<template>
  <TabbedPage
    :icon="ToolFilled"
    title="开发调试"
    :tabs="tabs"
    route-name="test"
    default-tab="markdown"
    disable-transition
  />
</template>

<script setup lang="ts">
import { ToolFilled } from '@vicons/antd'
import {
  ArrowSync24Filled,
  ChatMultiple24Filled,
  DataUsage24Filled,
  DocumentText24Filled,
  Filter20Regular,
  Keyboard24Regular
} from '@vicons/fluent'
import { computed } from 'vue'

import TabbedPage, { TabConfig } from '@main-window/components/TabbedPage.vue'

import GameDataTest from './GameDataTest.vue'
import InGameSendPresetsTest from './in-game-send-presets-test'
import KeyboardShortcutsTest from './KeyboardShortcutsTest.vue'
import MarkdownTest from './MarkdownTest.vue'
import MatchHistoryFiltersTest from './MatchHistoryFiltersTest.vue'
import SelfUpdateTest from './SelfUpdateTest.vue'

const tabs = computed<TabConfig[]>(() => [
  {
    key: 'markdown',
    name: 'Markdown 测试',
    icon: DocumentText24Filled,
    component: MarkdownTest
  },
  {
    key: 'self-update',
    name: '自动更新测试',
    icon: ArrowSync24Filled,
    component: SelfUpdateTest
  },
  {
    key: 'game-data',
    name: 'GameData',
    icon: DataUsage24Filled,
    component: GameDataTest
  },
  {
    key: 'match-history-filters',
    name: '新过滤器',
    icon: Filter20Regular,
    component: MatchHistoryFiltersTest
  },
  {
    key: 'keyboard-shortcuts',
    name: '快捷键系统',
    icon: Keyboard24Regular,
    component: KeyboardShortcutsTest
  },
  {
    key: 'in-game-send-presets',
    name: '预设发送',
    icon: ChatMultiple24Filled,
    component: InGameSendPresetsTest
  }
])
</script>
