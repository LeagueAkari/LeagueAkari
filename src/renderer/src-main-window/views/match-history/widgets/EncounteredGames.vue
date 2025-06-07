<template>
  <div class="encountered-games">
    <div class="header">
      <span class="title">{{ t('EncounteredGames.title') }}</span>
      <div class="pagination">
        <NButton
          secondary
          circle
          size="tiny"
          :disabled="page === 1 || loading"
          @click="emits('pageChange', page - 1)"
        >
          <template #icon>
            <NIcon><ArrowLeftIcon /></NIcon>
          </template>
        </NButton>
        <span class="page-info"> {{ page }} / {{ Math.ceil(total / pageSize) }} </span>
        <NButton
          secondary
          circle
          size="tiny"
          :disabled="page === Math.ceil(total / pageSize) || loading"
          @click="emits('pageChange', page + 1)"
        >
          <template #icon>
            <NIcon><ArrowRightIcon /></NIcon>
          </template>
        </NButton>
      </div>
    </div>

    <div class="game-list">
      <div class="game-item">
        <div class="game-item-title">TEST</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon } from '@vicons/carbon'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon } from 'naive-ui'

import { EncounteredGame } from '@main-window/shards/match-history-tabs/store'

const { t } = useTranslation()

const {
  data = [],
  page = 1,
  pageSize = 20,
  total = 0,
  loading = false
} = defineProps<{
  data?: EncounteredGame[]
  page?: number
  pageSize?: number
  total?: number
  loading?: boolean
}>()

const emits = defineEmits<{
  pageChange: [page: number]
}>()
</script>

<style lang="less" scoped>
.encountered-games {
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    .title {
      font-size: 16px;
      font-weight: bold;
    }

    .pagination {
      display: flex;
      align-items: center;
      gap: 4px;

      .page-info {
        font-size: 11px;
        color: #fffd;
      }
    }
  }
}
</style>
