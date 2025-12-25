<template>
  <div class="toolkit-page">
    <div class="page-sections">
      <div class="section-icon-container">
        <NIcon class="section-icon"><ToolFilledIcon /></NIcon>
        <span class="session-label">{{ t('Toolkit.title') }}</span>
      </div>
      <NTabs
        v-model:value="currentTab"
        :theme-overrides="{ tabGapMediumBar: '18px' }"
        size="medium"
      >
        <NTab v-for="tab in tabs" :key="tab.key" :name="tab.key" :tab="tab.name">
          <span class="tab-name">{{ tab.name }}</span>
        </NTab>
      </NTabs>
    </div>
    <div class="page-contents">
      <Transition :name="transitionType">
        <KeepAlive>
          <Client v-if="currentTab === 'client'" />
          <InGameSend v-else-if="currentTab === 'in-game-send'" />
          <InProcess v-else-if="currentTab === 'in-process'" />
          <Lobby v-else-if="currentTab === 'lobby'" />
          <Misc v-else-if="currentTab === 'misc'" />
          <ClaimTools v-else-if="currentTab === 'claim-tools'" />
          <LootTools v-else-if="currentTab === 'loot-tools'" />
          <FriendTools v-else-if="currentTab === 'friend-tools'" />
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ToolFilled as ToolFilledIcon } from '@vicons/antd'
import { useTranslation } from 'i18next-vue'
import { NIcon, NTab, NTabs } from 'naive-ui'
import { computed, onActivated, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ClaimTools from './claim-tools/ClaimTools.vue'
import Client from './client/Client.vue'
import FriendTools from './friend-tools/FriendTools.vue'
import InGameSend from './in-game-send/InGameSend.vue'
import InProcess from './in-process/InProcess.vue'
import Lobby from './lobby/Lobby.vue'
import LootTools from './loot-tools/LootTools.vue'
import Misc from './misc/Misc.vue'

const { t } = useTranslation()

const currentTab = ref('client')

const tabs = computed(() => [
  {
    key: 'client',
    name: t('Toolkit.client')
  },
  {
    key: 'in-game-send',
    name: t('Toolkit.in-game-send')
  },
  {
    key: 'in-process',
    name: t('Toolkit.in-process')
  },
  {
    key: 'lobby',
    name: t('Toolkit.lobby')
  },
  {
    key: 'misc',
    name: t('Toolkit.misc')
  },
  {
    key: 'claim-tools',
    name: t('Toolkit.claim-tools')
  },
  ...(import.meta.env.DEV
    ? [
        {
          key: 'loot-tools',
          name: t('Toolkit.loot-tools')
        }
      ]
    : []),
  {
    key: 'friend-tools',
    name: t('Toolkit.friend-tools')
  }
])

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
  router.replace({ name: 'toolkit', params: { section: currentTab.value } })
})

watch(
  () => currentTab.value,
  (cur) => {
    router.replace({ name: 'toolkit', params: { section: cur } })
  },
  { immediate: true }
)

// route to section
watch(
  () => route.params.section,
  (section) => {
    if (route.name !== 'toolkit' || !section) {
      return
    }

    currentTab.value = section as string
  },
  { immediate: true }
)
</script>

<style scoped>
@import './toolkit-styles.css';

.toolkit-page {
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
  .toolkit-page {
    .page-sections {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .section-icon-container {
    color: rgba(255, 255, 255, 0.8);
  }
}

[data-theme='light'] {
  .toolkit-page {
    .page-sections {
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
  }

  .section-icon-container {
    color: rgba(0, 0, 0, 0.8);
  }
}
</style>
