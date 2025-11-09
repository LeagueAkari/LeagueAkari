<template>
  <NCard size="small" v-if="combinedChampions && gameMode">
    <div class="outer">
      <div class="operations">
        <NTooltip
          raw
          :show-arrow="false"
          :duration="100"
          :delay="300"
          :keep-alive-on-hover="false"
          :disabled="!hasChampionAdjustment(lcs.champSelect.currentChampion || -1)"
        >
          <template #trigger>
            <LcuImage
              class="champion-image"
              style="border-radius: 50%; cursor: default"
              :class="championAdjustment(lcs.champSelect.currentChampion || -1)?.overallEffect"
              :src="championIconUri(lcs.champSelect.currentChampion || -1)"
            />
          </template>
          <div class="raw-popover">
            <div
              class="balance-item"
              v-for="b of championAdjustment(lcs.champSelect.currentChampion || -1)
                ?.sortedAdjustments"
              :key="b.type"
            >
              <span class="balance-item-name">{{ balanceTypes[b.type]?.name || b.type }}</span>
              <span class="balance-item-value" :class="b.effect">{{ b.formattedValue }}</span>
            </div>
            <div class="balance-data-source-name">{{ SOURCE_NAME[source] }}</div>
          </div>
        </NTooltip>

        <!-- 新版大乱斗将不再有 Reroll 机制 -->
        <div class="btns">
          <NButton
            v-if="shouldShowRerollButton"
            @click="() => handleReroll()"
            :disabled="rerollsRemaining === 0 || isRerolling"
            size="tiny"
            :title="
              t('BenchChampionsMini.reroll', {
                countV: rerollsRemaining
              })
            "
            secondary
            type="primary"
          >
            <template #icon>
              <NIcon><RefreshOutlineIcon /></NIcon>
            </template>
          </NButton>
          <NButton
            v-if="shouldShowRerollButton"
            :disabled="rerollsRemaining === 0 || isRerolling"
            @click="() => handleReroll(true)"
            :title="
              t('BenchChampionsMini.charity', {
                countV: rerollsRemaining
              })
            "
            secondary
            size="tiny"
          >
            <template #icon>
              <NIcon><ShareIcon /></NIcon>
            </template>
          </NButton>
        </div>
      </div>
      <NDivider vertical />
      <div class="champions">
        <NTooltip
          raw
          :show-arrow="false"
          :duration="100"
          :delay="300"
          v-for="c of combinedChampions"
          :key="c.championId"
          :keep-alive-on-hover="false"
          :disabled="!hasChampionAdjustment(c.championId)"
        >
          <template #trigger>
            <LcuImage
              class="champion-image"
              :class="{
                'champion-image-invalid': !isChampionSwappable(c.championId) || !canUseBench,
                [championAdjustment(c.championId)?.overallEffect || 'neutral']: true
              }"
              :src="championIconUri(c.championId)"
              @click="() => handleBenchSwapOrPick(c.championId)"
              @click.right="handleBenchSwapOrPick(c.championId, false)"
            />
          </template>
          <div class="raw-popover">
            <div
              class="balance-item"
              v-for="b of championAdjustment(c.championId)?.sortedAdjustments"
              :key="b.type"
            >
              <span class="balance-item-name">{{ b.name }}</span>
              <span class="balance-item-value" :class="b.effect">{{ b.formattedValue }}</span>
            </div>
            <div class="balance-data-source-name">{{ SOURCE_NAME[source] }}</div>
          </div>
        </NTooltip>
        <div
          v-for="_i of Math.max(10 - combinedChampions.length, 0)"
          class="champion-image-placeholder"
        />
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { BalanceAdjustment, useChampionBalanceData } from '@aux-window/compositions/useBalanceData'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { RefreshOutline as RefreshOutlineIcon, Share as ShareIcon } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NDivider, NIcon, NTooltip, useMessage } from 'naive-ui'
import { computed, ref } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)

// currently only support fandom
const source = ref('fandom')
const { data } = useChampionBalanceData(source)

const gameMode = computed(() => {
  if (!lcs.gameflow.session) {
    return null
  }

  return lcs.gameflow.session.gameData.queue.gameMode
})

const balanceTypes = computed(() => {
  return {
    'damage-dealt': {
      name: t('BenchChampionsMini.balanceTypes.damage-dealt'),
      order: 0
    },
    'damage-taken': {
      name: t('BenchChampionsMini.balanceTypes.damage-taken'),
      order: 1
    },
    healing: {
      name: t('BenchChampionsMini.balanceTypes.healing'),
      order: 2
    },
    shielding: {
      name: t('BenchChampionsMini.balanceTypes.shielding'),
      order: 3
    },
    'ability-haste': {
      name: t('BenchChampionsMini.balanceTypes.ability-haste'),
      order: 4
    },
    'mana-regen': {
      name: t('BenchChampionsMini.balanceTypes.mana-regen'),
      order: 5
    },
    'energy-regen': {
      name: t('BenchChampionsMini.balanceTypes.energy-regen'),
      order: 6
    },
    'attack-speed': {
      name: t('BenchChampionsMini.balanceTypes.attack-speed'),
      order: 7
    },
    'movement-speed': {
      name: t('BenchChampionsMini.balanceTypes.movement-speed'),
      order: 8
    },
    tenacity: {
      name: t('BenchChampionsMini.balanceTypes.tenacity'),
      order: 9
    }
  }
})

const SOURCE_NAME = {
  fandom: 'Fandom Wiki',
  opgg: 'OP.GG'
}

const STATUS_SORT_ORDER = {
  nerfed: 1,
  buffed: 0
}

const formatValue = (item: BalanceAdjustment) => {
  if (item.display === 'percentage') {
    return `${(100 * item.value).toFixed()} %`
  } else {
    return item.value > 0 ? `+${item.value}` : item.value
  }
}

const championAdjustment = (championId: number) => {
  if (!gameMode.value) {
    return null
  }

  const champion = data.value[championId]

  if (!champion) {
    return null
  }

  const modeAdjustment = champion.modes[gameMode.value]

  if (!modeAdjustment) {
    return null
  }

  return {
    ...modeAdjustment,
    sortedAdjustments: modeAdjustment.adjustments
      .toSorted((a, b) => {
        const aBalanceOrder = balanceTypes.value[a.type]?.order ?? 0
        const bBalanceOrder = balanceTypes.value[b.type]?.order ?? 0

        if (aBalanceOrder !== bBalanceOrder) {
          return aBalanceOrder - bBalanceOrder
        }

        const aStatusOrder = STATUS_SORT_ORDER[a.effect] ?? 0
        const bStatusOrder = STATUS_SORT_ORDER[b.effect] ?? 0

        return aStatusOrder - bStatusOrder
      })

      .map((item) => ({
        ...item,
        name: balanceTypes.value[item.type]?.name || item.type,
        formattedValue: formatValue(item)
      }))
  }
}

const hasChampionAdjustment = (championId: number) => {
  if (!gameMode.value) {
    return false
  }

  const champion = data.value[championId]

  if (!champion) {
    return false
  }

  const modeAdjustment = champion.modes[gameMode.value]

  if (!modeAdjustment) {
    return false
  }

  return modeAdjustment.adjustments.length > 0
}

// lcux 中按照如下逻辑隐藏 bench. 在隐藏 bench 的时候, 通常也不能继续进行选择
const canUseBench = computed(() => {
  if (!lcs.champSelect.session) {
    return false
  }

  if (!lcs.champSelect.session.benchEnabled) {
    return false
  }

  const isInFinalizationPhase = lcs.champSelect.session.timer.phase === 'FINALIZATION'
  const isInBanPickPhase = lcs.champSelect.session.timer.phase === 'BAN_PICK'

  if (lcs.champSelect.session.allowSubsetChampionPicks) {
    return isInFinalizationPhase || isInBanPickPhase
  }

  return isInFinalizationPhase
})

// when in ban pick phase, the bench champions are the subset champions
const combinedChampions = computed(() => {
  if (!lcs.champSelect.session?.benchEnabled) {
    return null
  }

  const originalBenchChampions = lcs.champSelect.session.benchChampions || []

  if (lcs.champSelect.session.timer.phase === 'BAN_PICK') {
    const subsetChampionList = lcs.lobbyTeamBuilder.champSelect.subsetChampionList

    const newChampions = subsetChampionList
      .filter((championId) => !originalBenchChampions.some((c) => c.championId === championId))
      .filter((championId) => lcs.champSelect.currentChampion !== championId)
      .map((championId) => ({
        championId,
        isPriority: false
      }))

    return [...newChampions, ...originalBenchChampions]
  }

  return originalBenchChampions
})

const rerollsRemaining = computed(() => {
  if (!canUseBench.value) {
    return 0
  }

  return lcs.champSelect.session!.rerollsRemaining
})

// logic copied from lcux
const isChampionSwappable = (championId: number) => {
  if (!championId || !lcs.champSelect.session) {
    return false
  }

  const canPlay = lcs.champSelect.currentPickableChampionIds.has(championId)
  const waitingOnFinalizationPhase =
    lcs.champSelect.session.timer.phase === 'BAN_PICK' &&
    !lcs.lobbyTeamBuilder.champSelect.subsetChampionList.includes(championId)

  return canPlay && !waitingOnFinalizationPhase
}

// logic copied from lcux
const shouldShowRerollButton = computed(() => {
  if (!lcs.champSelect.session) {
    return false
  }

  return (
    lcs.champSelect.session.allowRerolling &&
    lcs.champSelect.session.timer.phase === 'FINALIZATION' &&
    !lcs.champSelect.session.allowSubsetChampionPicks
  )
})

const message = useMessage()

const isRerolling = ref(false)
const isSwappingOrPicking = ref(false)

// complete takes effect only when in ban-pick phase
const handleBenchSwapOrPick = async (championId: number, complete = true) => {
  if (isSwappingOrPicking.value) {
    return
  }

  // isChampionSwappable makes sure lcs.champSelect.session is not null
  if (!isChampionSwappable(championId)) {
    return
  }

  isSwappingOrPicking.value = true
  try {
    if (lcs.champSelect.session!.timer.phase === 'BAN_PICK') {
      const firstPickAction = lcs.champSelect
        .session!.actions.flat()
        .find(
          (a) =>
            a.type === 'pick' &&
            !a.completed &&
            a.actorCellId === lcs.champSelect.session!.localPlayerCellId
        )

      if (firstPickAction) {
        await lc.api.champSelect.pickOrBan(championId, complete, 'pick', firstPickAction.id)
      }
    } else {
      await lc.api.champSelect.benchSwap(championId)
    }
  } catch (error: any) {
    console.error(error)
    message.warning(
      t('BenchChampionsMini.swapFailed', {
        reason: error.message
      })
    )
  } finally {
    isSwappingOrPicking.value = false
  }
}

const handleReroll = async (grabBack = false) => {
  if (isRerolling.value) {
    return
  }

  isRerolling.value = true
  try {
    const prevId = lcs.champSelect.currentChampion

    await lc.api.champSelect.reroll()

    // 使用一个简短的延时来实现，simple workaround
    if (grabBack && prevId !== null) {
      window.setTimeout(async () => {
        if (combinedChampions.value) {
          await handleBenchSwapOrPick(prevId)
        }
      }, 25)
    }
  } catch (error: any) {
    message.warning(
      t('BenchChampionsMini.rerollFailed', {
        reason: error.message
      })
    )
  } finally {
    isRerolling.value = false
  }
}
</script>

<style scoped lang="less">
[data-theme='dark'] {
.outer {
  display: flex;
  align-items: center;
  justify-content: center;
}

.operations {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.btns {
  display: flex;
  gap: 4px;
}

.champions {
  display: grid;
  grid-template-columns: repeat(5, auto);
  gap: 4px;
}

.champion-image {
  width: 36px;
  height: 36px;
  border-radius: 2px;
  cursor: pointer;
  box-sizing: border-box;
  border-style: solid;
  border-width: 1px;
  border-color: rgb(72, 72, 72);
}

.champion-image.buffed {
  border-width: 1px;
  border-color: rgb(0, 161, 67);
}

.champion-image.nerfed {
  border-width: 1px;
  border-color: rgb(181, 75, 0);
}

.champion-image.mixed {
  border-width: 1px;
  border-style: solid;
  border-image: linear-gradient(to bottom right, rgb(0, 161, 67) 50%, rgb(181, 75, 0) 50%) 1;
}

.champion-image-invalid {
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.champion-image-placeholder {
  width: 36px;
  height: 36px;
  box-sizing: border-box;
  border: 1px solid rgb(72, 72, 72);
  border-radius: 2px;
}

.raw-popover {
  background-color: rgba(0, 0, 0, 0.866);
  padding: 4px 8px;
  border-radius: 2px;
}

.balance-item {
  font-size: 11px;
  color: rgb(204, 204, 204);

  .balance-item-value {
    display: inline-block;
    text-align: end;
    min-width: 36px;
    white-space: nowrap;
  }

  .balance-item-value.buffed {
    color: rgb(0, 219, 91);
  }

  .balance-item-value.nerfed {
    color: rgb(255, 106, 0);
  }
}

.balance-data-source-name {
  margin-top: 4px;
  font-size: 10px;
  color: rgb(145, 145, 145);
}

}

[data-theme='light'] {
.outer {
  display: flex;
  align-items: center;
  justify-content: center;
}

.operations {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.btns {
  display: flex;
  gap: 4px;
}

.champions {
  display: grid;
  grid-template-columns: repeat(5, auto);
  gap: 4px;
}

.champion-image {
  width: 36px;
  height: 36px;
  border-radius: 2px;
  cursor: pointer;
  box-sizing: border-box;
  border-style: solid;
  border-width: 1px;
  border-color: rgb(72, 72, 72);
}

.champion-image.buffed {
  border-width: 1px;
  border-color: rgb(0, 161, 67);
}

.champion-image.nerfed {
  border-width: 1px;
  border-color: rgb(181, 75, 0);
}

.champion-image.mixed {
  border-width: 1px;
  border-style: solid;
  border-image: linear-gradient(to bottom right, rgb(0, 161, 67) 50%, rgb(181, 75, 0) 50%) 1;
}

.champion-image-invalid {
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.champion-image-placeholder {
  width: 36px;
  height: 36px;
  box-sizing: border-box;
  border: 1px solid rgb(72, 72, 72);
  border-radius: 2px;
}

.raw-popover {
  background-color: rgba(255, 255, 255, 0.866);
  padding: 4px 8px;
  border-radius: 2px;
}

.balance-item {
  font-size: 11px;
  color: rgb(51, 51, 51);

  .balance-item-value {
    display: inline-block;
    text-align: end;
    min-width: 36px;
    white-space: nowrap;
  }

  .balance-item-value.buffed {
    color: rgb(0, 219, 91);
  }

  .balance-item-value.nerfed {
    color: rgb(255, 106, 0);
  }
}

.balance-data-source-name {
  margin-top: 4px;
  font-size: 10px;
  color: rgb(72, 72, 72);
}

}
</style>
