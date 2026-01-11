<template>
  <div class="automation-page">
    <div class="page-sections">
      <div class="section-icon-container">
        <NIcon class="section-icon" :component="AiStatus" />
        <span class="session-label">{{ t('Automation.title') }}</span>
      </div>
      <NTabs
        v-model:value="currentTab"
        :theme-overrides="{ tabGapMediumBar: '18px' }"
        size="medium"
      >
        <NTab v-for="tab in tabs" :key="tab.key" :name="tab.key" :tab="tab.name">
          <div class="tab-content">
            <NIcon class="tab-icon" :component="tab.icon" />
            <span class="tab-name">{{ tab.name }}</span>
          </div>
        </NTab>
      </NTabs>
    </div>
    <div class="page-contents">
      <Transition :name="transitionType">
        <KeepAlive>
          <AutoGameflow v-if="currentTab === 'auto-gameflow'" />
          <AutoSelect v-else-if="currentTab === 'auto-select'" />
          <AutoChampConfig v-else-if="currentTab === 'auto-champ-config'" />
          <AutoMisc v-else-if="currentTab === 'misc'" />
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { SettingFilled } from '@vicons/antd'
import { AiStatus, Cursor1, UserProfile } from '@vicons/carbon'
import { TextBulletListTree20Filled } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NIcon, NTab, NTabs } from 'naive-ui'
import { Component, FunctionalComponent } from 'vue'
import { computed, onActivated, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AutoChampConfig from './AutoChampConfig.vue'
import AutoGameflow from './AutoGameflow.vue'
import AutoMisc from './AutoMisc.vue'
import AutoSelect from './AutoSelect.vue'

/**
 * 此文件逻辑于 Toolkit.vue 完全相同，甚至属于是一个文件的两份复制
 * TODO: 合并此逻辑
 */

const { t } = useTranslation()

const currentTab = ref('auto-gameflow')

const tabs = computed<{ key: string; name: string; icon: Component | FunctionalComponent }[]>(
  () => [
    {
      key: 'auto-gameflow',
      name: t('Automation.autoGameflow'),
      icon: TextBulletListTree20Filled
    },
    {
      key: 'auto-select',
      name: t('Automation.autoSelect'),
      icon: Cursor1
    },
    {
      key: 'auto-champ-config',
      name: t('Automation.autoChampConfig'),
      icon: UserProfile
    },
    {
      key: 'misc',
      name: t('Automation.autoMisc'),
      icon: SettingFilled
    }
  ]
)

const transitionType = ref<'move-from-right-fade' | 'move-from-left-fade'>('move-from-left-fade')
watch(
  () => currentTab.value,
  (cur, prev) => {
    if (!prev) {
      transitionType.value = 'move-from-right-fade'
      return
    }

    const curIndex = tabs.value.findIndex((tab) => tab.key === cur)
    const prevIndex = tabs.value.findIndex((tab) => tab.key === prev)

    if (curIndex > prevIndex) {
      transitionType.value = 'move-from-right-fade'
    } else {
      transitionType.value = 'move-from-left-fade'
    }
  },
  { immediate: true }
)

const route = useRoute()
const router = useRouter()

onActivated(() => {
  router.replace({ name: 'automation', params: { section: currentTab.value } })
})

watch(
  () => currentTab.value,
  (cur) => {
    router.replace({ name: 'automation', params: { section: cur } })
  },
  { immediate: true }
)

// route to section
watch(
  [() => route.name, () => route.params.section],
  ([name, section]) => {
    if (name !== 'automation' || !section) {
      return
    }

    currentTab.value = section as string
  },
  { immediate: true }
)
</script>

<style scoped>
@import './automation-styles.css';

.automation-page {
  display: flex;
  flex-direction: column;
  height: 100%;

  .page-sections {
    display: flex;
    padding: 0 24px;
    align-items: flex-end;
  }

  .page-contents {
    position: relative;
    flex: 1;
    height: 0;
  }
}

.tab-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tab-icon {
  font-size: 16px;
}

.tab-name {
  font-weight: bold;
}

.section-icon-container {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: 24px;
  margin-bottom: 4px;
  gap: 8px;

  .section-icon {
    font-size: 24px;
  }

  .session-label {
    font-size: 16px;
    font-weight: bold;
  }
}

[data-theme='dark'] {
  .automation-page {
    .page-sections {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .section-icon-container {
    color: rgba(255, 255, 255, 0.8);
  }
}

[data-theme='light'] {
  .automation-page {
    .page-sections {
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
  }

  .section-icon-container {
    color: rgba(0, 0, 0, 0.8);
  }
}

.transition-single-root {
  height: 100%;
}
</style>
