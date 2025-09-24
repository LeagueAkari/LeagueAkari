<template>
  <NCard size="small" v-if="hasDelayedItems">
    <div v-if="as2.delayedPick" class="delayed-item">
      <div class="delayed-item__title">{{ t('AutomationPlan.autoPick.title') }}</div>
      <div class="delayed-item__detail">
        <div class="delayed-item__label">
          <span class="delayed-item__action">{{ t('AutomationPlan.autoPick.willPick') }}</span>
          <div class="delayed-item__champion">
            <ChampionIcon
              class="delayed-item__champion-icon"
              :champion-id="as2.delayedPick.championId"
            />
            <div class="delayed-item__champion-name">
              {{ championName(as2.delayedPick.championId) }}
            </div>
            <div class="delayed-item__delay">{{ formatMsToSeconds(pickCountdown) }}s</div>
          </div>
        </div>
      </div>
      <NProgress
        class="delayed-item__progress"
        :height="2"
        :show-indicator="false"
        :percentage="pickProgress * 100"
      />
    </div>
    <div v-if="as2.delayedBan" class="delayed-item">
      <div class="delayed-item__title">{{ t('AutomationPlan.autoBan.title') }}</div>
      <div class="delayed-item__detail">
        <div class="delayed-item__label">
          <span class="delayed-item__action">{{ t('AutomationPlan.autoBan.willBan') }}</span>
          <div class="delayed-item__champion">
            <ChampionIcon
              class="delayed-item__champion-icon"
              :champion-id="as2.delayedBan.championId"
            />
            <div class="delayed-item__champion-name">
              {{ championName(as2.delayedBan.championId) }}
            </div>
            <div class="delayed-item__delay">{{ formatMsToSeconds(banCountdown) }}s</div>
          </div>
        </div>
      </div>
      <NProgress
        class="delayed-item__progress"
        :height="2"
        :show-indicator="false"
        :percentage="banProgress * 100"
      />
    </div>
    <div v-if="as2.delayedBenchSwap" class="delayed-item">
      <div class="delayed-item__title">{{ t('AutomationPlan.autoBenchSwap.title') }}</div>
      <div class="delayed-item__detail">
        <div class="delayed-item__label">
          <span class="delayed-item__action">{{ t('AutomationPlan.autoBenchSwap.willSwap') }}</span>
          <div class="delayed-item__champion">
            <ChampionIcon
              class="delayed-item__champion-icon"
              :champion-id="as2.delayedBenchSwap.championId"
            />
            <div class="delayed-item__champion-name">
              {{ championName(as2.delayedBenchSwap.championId) }}
            </div>
            <div class="delayed-item__delay">{{ formatMsToSeconds(benchSwapCountdown) }}s</div>
          </div>
        </div>
      </div>
      <NProgress
        :height="2"
        :border-radius="0"
        class="delayed-item__progress"
        :show-indicator="false"
        :percentage="benchSwapProgress * 100"
      />
    </div>
    <div v-if="as2.delayedChampionSwap" class="delayed-item">
      <div class="delayed-item__title">{{ t('AutomationPlan.autoChampionSwap.title') }}</div>
      <div class="delayed-item__detail">
        <div class="delayed-item__label">
          <span class="delayed-item__action">{{
            t('AutomationPlan.autoChampionSwap.willAccept')
          }}</span>
          <div class="delayed-item__champion">
            <ChampionIcon
              class="delayed-item__champion-icon"
              :champion-id="as2.delayedChampionSwap.requesterChampionId"
            />
            <div class="delayed-item__champion-name">
              {{ championName(as2.delayedChampionSwap.requesterChampionId) }}
            </div>
            <div class="delayed-item__delay">{{ formatMsToSeconds(championSwapCountdown) }}s</div>
          </div>
        </div>
      </div>
      <NProgress
        :height="2"
        :border-radius="0"
        class="delayed-item__progress"
        :show-indicator="false"
        :percentage="championSwapProgress * 100"
      />
    </div>
  </NCard>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useChampionInfo } from '@renderer-shared/compositions/useChampionInfo'
import { useTimeLeft } from '@renderer-shared/compositions/useTimeLeft'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { useTranslation } from 'i18next-vue'
import { NCard, NProgress } from 'naive-ui'
import { computed } from 'vue'

const { t } = useTranslation()

const as2 = useAutoSelectStore()

const { name: championName } = useChampionInfo()

const { timeLeft: pickCountdown, progress: pickProgress } = useTimeLeft(
  () => as2.delayedPick?.finishAt ?? 0,
  () => as2.delayedPick?.startAt ?? 0
)

const { timeLeft: banCountdown, progress: banProgress } = useTimeLeft(
  () => as2.delayedBan?.finishAt ?? 0,
  () => as2.delayedBan?.startAt ?? 0
)

const { timeLeft: benchSwapCountdown, progress: benchSwapProgress } = useTimeLeft(
  () => as2.delayedBenchSwap?.finishAt ?? 0,
  () => as2.delayedBenchSwap?.startAt ?? 0
)

const { timeLeft: championSwapCountdown, progress: championSwapProgress } = useTimeLeft(
  () => as2.delayedChampionSwap?.finishAt ?? 0,
  () => as2.delayedChampionSwap?.startAt ?? 0
)

const hasDelayedItems = computed(() =>
  Boolean(as2.delayedPick || as2.delayedBan || as2.delayedBenchSwap || as2.delayedChampionSwap)
)

const formatMsToSeconds = (ms: number) => {
  const seconds = (ms / 1000).toFixed(1)
  return seconds
}
</script>

<style scoped>
.delayed-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .delayed-item__title {
    font-size: 14px;
    font-weight: bold;
    color: #000a;
  }

  .delayed-item__detail {
    flex: 1;
  }

  .delayed-item__label,
  .delayed-item__champion {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .delayed-item__action {
    font-size: 12px;
    color: #000a;
  }

  .delayed-item__champion-icon {
    width: 16px;
    height: 16px;
  }

  .delayed-item__champion-name {
    font-size: 12px;
    font-weight: bold;
    color: #000;
  }

  .delayed-item__delay {
    font-size: 12px;
    color: #000a;
  }

  [data-theme='dark'] & {
    .delayed-item__title {
      color: #fff;
    }

    .delayed-item__action {
      color: #fff;
    }

    .delayed-item__champion-name {
      color: #fff;
    }

    .delayed-item__delay {
      color: #fff;
    }
  }
}
</style>
