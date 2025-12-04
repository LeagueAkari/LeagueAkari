<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('GameView.title') }}</span>
    </template>

    <!-- 年久失修，暂时用这个凑合着用 -->
    <MatchPreviewer
      v-model:show="showPreviewModal"
      :game-id="previewingGameId || 0"
      :source="as.settings.preferredLolSource"
      @navigate-to-summoner-by-puuid="navigateToTabByPuuid"
    />
    <ControlItem
      class="control-item-margin"
      :label="t('GameView.game.label')"
      :label-description="t('GameView.game.description')"
      :label-width="260"
    >
      <div style="display: flex; align-items: center; gap: 8px">
        <NInputNumber :show-button="false" v-model:value="gameId" size="small" />
        <NButton :disabled="!gameId" @click="handleInspect" size="small" type="primary">{{
          t('GameView.game.button')
        }}</NButton>
      </div>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import MatchPreviewer from '@renderer-shared/components/MatchPreviewer.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NInputNumber } from 'naive-ui'
import { ref } from 'vue'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

const { t } = useTranslation()

const as = useAppCommonStore()

const gameId = ref<number>()
const previewingGameId = ref<number>()
const showPreviewModal = ref(false)

const handleInspect = () => {
  showPreviewModal.value = true
  previewingGameId.value = gameId.value
}

const mh = useInstance(MatchHistoryTabsRenderer)

const { navigateToTabByPuuid } = mh.useNavigateToTab()
</script>

<style scoped></style>
