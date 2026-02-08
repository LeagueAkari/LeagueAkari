<template>
  <div class="flex size-full gap-4">
    <!-- 图表区域 -->
    <div v-if="selectedParticipant" class="box-border flex min-w-0 flex-1 flex-col px-2">
      <div class="mb-3 flex items-center gap-2">
        <ChampionIcon
          :champion-id="selectedParticipant.championId"
          class="size-7! shrink-0 border-2 border-solid"
          :style="{
            borderColor: getTeamColor(selectedParticipant.teamIdentifier)
          }"
          round
        />
        <div class="min-w-0 truncate text-sm font-medium text-black dark:text-white">
          <template v-if="hidePrivacy">
            {{ lcs.gameData.championName(selectedParticipant.championId) }}
          </template>
          <template v-else>
            {{ selectedParticipant.gameName }} #{{ selectedParticipant.tagLine }}
          </template>
        </div>
        <div
          v-if="
            selectedParticipant.position && selectedParticipant.position.toLowerCase() !== 'invalid'
          "
          :class="tagTheme"
        >
          {{ position(selectedParticipant.position) }}
        </div>
      </div>

      <NSlider
        v-model:value="currentFrameIndex"
        :min="0"
        :max="frames.length - 1"
        :format-tooltip="formatTooltip"
      />

      <!-- hint -->
      <div class="my-4 text-xs text-black/60 italic dark:text-white/60">
        {{ t('MatchCard.statsLine.hint') }}
      </div>

      <!-- items -->
      <NScrollbar class="min-h-0 flex-1">
        <div class="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-x-2 gap-y-4">
          <div class="flex flex-col" v-for="item of displayedItems">
            <div class="text-xs text-black/60 dark:text-white/60">{{ item.name }}</div>
            <div class="text-lg font-bold whitespace-nowrap text-black dark:text-white">
              {{ item.formattedValue }}
            </div>
          </div>
        </div>
      </NScrollbar>
    </div>

    <div class="flex w-52 flex-col">
      <template v-if="selectedFrameParticipant && isSupportedMap(basicInfo.mapId)">
        <MapPosition
          :size="180"
          :mapId="basicInfo.mapId"
          :points="[selectedFrameParticipant.position]"
        />

        <div class="my-3 h-px bg-black/10 dark:bg-white/10"></div>
      </template>

      <!-- 右侧控制面板 -->
      <NScrollbar class="min-h-0 flex-1">
        <div class="flex flex-col gap-3">
          <!-- 玩家选择 -->
          <div class="flex w-full flex-col gap-2">
            <div class="text-xs font-semibold text-black/60 dark:text-white/60">
              {{ t('MatchCard.statsLine.participant') }}
            </div>

            <NRadioGroup v-model:value="selectedPlayer">
              <div class="flex flex-col gap-1.5">
                <NRadio
                  v-for="player in sortedPlayerOptions"
                  :key="player.value"
                  :value="player.value"
                >
                  <template #default>
                    <div class="flex w-48 items-center gap-2">
                      <!-- 颜色方块 -->
                      <div
                        class="h-3 w-3 shrink-0 rounded-sm"
                        :style="{ backgroundColor: player.color }"
                      ></div>
                      <span class="truncate">{{ player.label }}</span>
                    </div>
                  </template>
                </NRadio>
              </div>
            </NRadioGroup>
          </div>
        </div>
      </NScrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { isSgpDetailedParticipantFrame } from '@shared/data-adapter/match-history/frames'
import { useTranslation } from 'i18next-vue'
import { NRadio, NRadioGroup, NScrollbar, NSlider } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { useMatchCard } from '../../context'
import { isSupportedMap } from '../../utils/game-map'
import { usePosition } from '../../utils/text'
import { getTeamColor, playerColors, useWinResultTagTheme } from '../../utils/theme'
import { formatMilliseconds } from '../../utils/time'
import MapPosition from '../../widgets/MapPosition.vue'

const lcs = useLeagueClientStore()
const { t } = useTranslation()

const {
  basicInfo,
  details,
  frames,
  participants,
  team,
  loadingDetails,
  onLoadDetails,
  hidePrivacy
} = useMatchCard()

const currentFrameIndex = ref(0)
const selectedPlayer = ref(0)

const position = usePosition()
const tagTheme = useWinResultTagTheme(() => team.value?.winResult)

const formatTooltip = (index: number) => {
  return formatMilliseconds(frames.value[index]?.timestamp || 0)
}

const sortedPlayerOptions = computed(() => {
  return participants.value
    .toSorted((a, b) => {
      if (basicInfo.value.isCherrySubteam) {
        return a.subteamPlacement - b.subteamPlacement
      }

      return a.teamIdentifier.localeCompare(b.teamIdentifier)
    })
    .map((p) => {
      return {
        value: p.participantId,
        label: `${lcs.gameData.championName(p.championId)}`,
        color: playerColors[(p.participantId - 1) % playerColors.length]
      }
    })
})

const selectedParticipant = computed(() => {
  return participants.value.find((p) => p.participantId === selectedPlayer.value)
})

const selectedFrameParticipant = computed(() => {
  return frames.value[currentFrameIndex.value]?.participantFrames[selectedPlayer.value]
})

const displayedItems = computed(() => {
  if (!isSgpDetailedParticipantFrame(selectedFrameParticipant.value)) {
    return []
  }

  const stats = selectedFrameParticipant.value.championStats

  return [
    {
      name: t('MatchCard.statsLine.stats.abilityHaste'),
      formattedValue: stats.abilityHaste.toString()
    },
    {
      name: t('MatchCard.statsLine.stats.abilityPower'),
      formattedValue: stats.abilityPower.toString()
    },
    { name: t('MatchCard.statsLine.stats.armor'), formattedValue: stats.armor.toString() },
    { name: t('MatchCard.statsLine.stats.armorPen'), formattedValue: stats.armorPen.toString() },
    {
      name: t('MatchCard.statsLine.stats.armorPenPercent'),
      formattedValue: `${stats.armorPenPercent.toString()}%`
    },
    {
      name: t('MatchCard.statsLine.stats.attackDamage'),
      formattedValue: stats.attackDamage.toString()
    },
    {
      name: t('MatchCard.statsLine.stats.attackSpeed'),
      formattedValue: `${stats.attackSpeed.toString()}%`
    },
    {
      name: t('MatchCard.statsLine.stats.bonusArmorPenPercent'),
      formattedValue: `${stats.bonusArmorPenPercent.toString()}%`
    },
    {
      name: t('MatchCard.statsLine.stats.bonusMagicPenPercent'),
      formattedValue: `${stats.bonusMagicPenPercent.toString()}%`
    },
    {
      name: t('MatchCard.statsLine.stats.ccReduction'),
      formattedValue: `${stats.ccReduction.toString()}%`
    },
    {
      name: t('MatchCard.statsLine.stats.cooldownReduction'),
      formattedValue: `${stats.cooldownReduction.toString()}%`
    },
    {
      name: t('MatchCard.statsLine.stats.health'),
      formattedValue: `${stats.health.toString()} / ${stats.healthMax.toString()}`
    },
    {
      name: t('MatchCard.statsLine.stats.healthRegen'),
      formattedValue: stats.healthRegen.toString()
    },
    {
      name: t('MatchCard.statsLine.stats.lifesteal'),
      formattedValue: `${stats.lifesteal.toString()}%`
    },
    { name: t('MatchCard.statsLine.stats.magicPen'), formattedValue: stats.magicPen.toString() },
    {
      name: t('MatchCard.statsLine.stats.magicPenPercent'),
      formattedValue: `${stats.magicPenPercent.toString()}%`
    },
    {
      name: t('MatchCard.statsLine.stats.magicResist'),
      formattedValue: stats.magicResist.toString()
    },
    {
      name: t('MatchCard.statsLine.stats.movementSpeed'),
      formattedValue: stats.movementSpeed.toString()
    },
    {
      name: t('MatchCard.statsLine.stats.omnivamp'),
      formattedValue: `${stats.omnivamp.toString()}%`
    },
    {
      name: t('MatchCard.statsLine.stats.physicalVamp'),
      formattedValue: `${stats.physicalVamp.toString()}%`
    },
    {
      name: t('MatchCard.statsLine.stats.power'),
      formattedValue: `${stats.power.toString()} / ${stats.powerMax.toString()}`
    },
    {
      name: t('MatchCard.statsLine.stats.powerRegen'),
      formattedValue: stats.powerRegen.toString()
    },
    {
      name: t('MatchCard.statsLine.stats.spellVamp'),
      formattedValue: `${stats.spellVamp.toString()}%`
    }
  ]
})

watch(
  [details, loadingDetails, () => basicInfo.value.gameId],
  ([d, l, g]) => {
    if (!d && !l) {
      onLoadDetails(g)
    }
  },
  { immediate: true }
)

watch(
  () => sortedPlayerOptions.value,
  (options) => {
    if (options.length > 0) {
      selectedPlayer.value = options[0].value
    }
  },
  { immediate: true }
)
</script>

<style scoped></style>
