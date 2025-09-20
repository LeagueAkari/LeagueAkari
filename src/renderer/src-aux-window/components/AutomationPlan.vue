<template>
  <NCard size="small" v-if="hasDelayedItems">
    <div v-if="as2.delayedPick" class="delayed-item">
      <NProgress
        class="delayed-item__progress"
        :percentage="
          (1 - as2.delayedPick.delayMs / (as2.delayedPick.finishAt - as2.delayedPick.startAt)) * 100
        "
      />
      <div class="delayed-item__detail">
        <div class="delayed-item__label">
          <span class="delayed-item__action">[将自动选择]</span>
          <div class="delayed-item__champion">
            <ChampionIcon
              class="delayed-item__champion-icon"
              :champion-id="as2.delayedPick.championId"
            />
            <span class="delayed-item__champion-name">{{
              championName(as2.delayedPick.championId)
            }}</span>
          </div>
        </div>
        <div class="delayed-item__delay">{{ pickCountdown }}s</div>
      </div>
    </div>
    <div v-if="as2.delayedBenchSwap" class="delayed-item">
      <NProgress
        class="delayed-item__progress"
        :percentage="
          (1 -
            as2.delayedBenchSwap.delayMs /
              (as2.delayedBenchSwap.finishAt - as2.delayedBenchSwap.startAt)) *
          100
        "
      />
      <div class="delayed-item__detail">
        <div class="delayed-item__label">
          <span class="delayed-item__action">[将自动选择]</span>
          <div class="delayed-item__champion">
            <ChampionIcon
              class="delayed-item__champion-icon"
              :champion-id="as2.delayedBenchSwap.championId"
            />
            <span class="delayed-item__champion-name">{{
              championName(as2.delayedBenchSwap.championId)
            }}</span>
          </div>
        </div>
        <div class="delayed-item__delay">{{ benchSwapCountdown }}s</div>
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useChampionInfo } from '@renderer-shared/compositions/useChampionInfo'
import { useCountdownSeconds } from '@renderer-shared/compositions/useCountdown'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Action } from '@shared/types/league-client/champ-select'
import { useTranslation } from 'i18next-vue'
import { NCard, NProgress, NTimeline, NTimelineItem } from 'naive-ui'
import { computed } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const as2 = useAutoSelectStore()

const { name: championName } = useChampionInfo()

const pickCountdown = useCountdownSeconds(
  () => Boolean(as2.delayedPick),
  () => as2.delayedPick?.finishAt ?? 0
)

const benchSwapCountdown = useCountdownSeconds(
  () => Boolean(as2.delayedBenchSwap),
  () => as2.delayedBenchSwap?.finishAt ?? 0
)

const hasDelayedItems = computed(() =>
  Boolean(as2.delayedPick || as2.delayedBan || as2.delayedBenchSwap || as2.delayedChampionSwap)
)
</script>

<style scoped>
.delayed-item {
  display: flex;
  align-items: center;
  gap: 4px;

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .delayed-item__progress {
    width: 48px;
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
    color: #000a;
  }

  .delayed-item__champion-icon {
    width: 24px;
    height: 24px;
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
    .delayed-item__action {
      color: #fff;
    }

    .delayed-item__champion-name {
      color: #fff;
    }

    .delayed-item__delay {
      color: #fffa;
    }
  }
}
</style>
