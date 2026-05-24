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
      :hide-privacy="as.settings.streamerMode"
      can-dry-run-ongoing-game
      @navigate-to-summoner-by-puuid="navigateToTabByPuuid"
      @dry-run-ongoing-game="handleDryRunOngoingGame"
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
import MatchPreviewer from '@renderer-shared/components/match-preview/MatchPreviewer.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { DraftOptions } from '@shared/types/shards/ongoing-game'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NInputNumber } from 'naive-ui'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'

const { t } = useTranslation()

const as = useAppCommonStore()

const gameId = ref<number>()
const previewingGameId = ref<number>()
const showPreviewModal = ref(false)

const handleInspect = () => {
  showPreviewModal.value = true
  previewingGameId.value = gameId.value
}

const pt = useInstance(PlayerTabsRenderer)
const og = useInstance(OngoingGameRenderer)
const router = useRouter()

const { navigateToTabByPuuid } = pt.useNavigateToTab()

const handleDryRunOngoingGame = async (draft: DraftOptions) => {
  await og.setDraft(draft)
  await router.replace({ name: 'ongoing-game' })
}
</script>

<style scoped></style>
