<template>
  <div class="mb-1 flex">
    <div
      class="relative mr-2 cursor-pointer transition-[filter] hover:brightness-110"
      @click.stop="() => navigateToSummonerByPuuid(puuid)"
    >
      <ChampionIcon
        :champion-id="championId || -1"
        round
        ring
        ring-color="rgba(255, 255, 255, 0.31)"
        class="size-10.5"
      />
      <div
        v-if="summoner"
        class="absolute right-0 bottom-0 translate-x-[35%] rounded bg-black/50 px-1 text-[10px] text-white"
      >
        {{ summoner.summonerLevel }}
      </div>
    </div>

    <div class="flex w-0 flex-1 flex-col justify-center gap-1">
      <div class="flex items-center gap-1">
        <div
          class="min-w-0 flex-1 cursor-pointer transition-[filter] hover:brightness-125"
          @click="() => navigateToSummonerByPuuid(puuid)"
        >
          <NPopover
            :keep-alive-on-hover="false"
            :delay="50"
            :disabled="premadeTeamId === undefined"
          >
            <template #trigger>
              <div class="w-fit max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                <span
                  class="text-[13px] font-bold text-black/80 dark:text-white/80"
                  :style="{
                    color: premadeTeamId ? premadeColors[premadeTeamId]?.foregroundColor : undefined
                  }"
                  >{{
                    masked(
                      summoner?.gameName || summoner?.displayName || '—',
                      name(championId || -1)
                    )
                  }}</span
                >
                <span
                  v-if="!as.settings.streamerMode"
                  class="ml-1 text-xs text-gray-500 dark:text-gray-400"
                  >#{{ summoner?.tagLine || '—' }}</span
                >
              </div>
            </template>
            <div class="max-w-50 text-xs">
              {{ t('PlayerInfoCard.premadePopover', { team: premadeTeamId }) }}
            </div>
          </NPopover>
        </div>

        <NDropdown
          v-if="matchCollectionOptions.length"
          trigger="click"
          size="small"
          placement="bottom-start"
          :options="matchCollectionOptions"
          @select="handleMatchCollectionSelect"
        >
          <NButton
            quaternary
            size="tiny"
            class="shrink-0 text-black/60 dark:text-white/60"
            @click.stop
          >
            <template #icon>
              <NIcon size="16">
                <MoreVertFilledIcon />
              </NIcon>
            </template>
          </NButton>
        </NDropdown>
      </div>

      <NPopover :keep-alive-on-hover="false" :delay="50">
        <template #trigger>
          <div class="flex gap-1">
            <div v-if="rankedSoloFlex.solo" class="flex w-0 flex-1 items-center justify-start">
              <img
                class="mr-1 h-4 w-4"
                :src="RANKED_MEDAL_MAP[rankedSoloFlex.solo.tier]"
                alt="rank"
              />
              <span
                class="overflow-hidden text-[11px] text-ellipsis whitespace-nowrap text-black/80 dark:text-white/80"
                >{{ rankedSoloFlex.solo.text }}</span
              >
            </div>
            <div v-else class="flex w-0 flex-1 items-center justify-center">
              <span class="text-[11px] text-black/60 dark:text-white/60">{{
                t('shortTiers.UNRANKED', {
                  ns: 'common'
                })
              }}</span>
            </div>

            <div v-if="rankedSoloFlex.flex" class="flex w-0 flex-1 items-center justify-start">
              <img
                class="mr-1 h-4 w-4"
                :src="RANKED_MEDAL_MAP[rankedSoloFlex.flex.tier]"
                alt="rank"
              />
              <span
                class="overflow-hidden text-[11px] text-ellipsis whitespace-nowrap text-black/80 dark:text-white/80"
                >{{ rankedSoloFlex.flex.text }}</span
              >
            </div>
            <div v-else class="flex w-0 flex-1 items-center justify-center">
              <span class="text-[11px] text-black/60 dark:text-white/60">{{
                t('shortTiers.UNRANKED', {
                  ns: 'common'
                })
              }}</span>
            </div>
          </div>
        </template>

        <RankedTable v-if="rankedStats" :ranked-stats="rankedStats" />
        <div v-else class="text-xs">{{ t('PlayerInfoCard.empty') }}</div>
      </NPopover>
    </div>
  </div>
</template>

<script setup lang="tsx">
import RankedTable from '@renderer-shared/components/RankedTable.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useChampionInfo } from '@renderer-shared/composables/useChampionInfo'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { MoreVertFilled as MoreVertFilledIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon, NPopover, type DropdownOption } from 'naive-ui'
import { computed } from 'vue'

import { PREMADE_TEAM_COLORS, PREMADE_TEAM_COLORS_LIGHT, RANKED_MEDAL_MAP } from '../../constants'
import { useOngoingGamePanel } from '../../context'

const { puuid } = defineProps<{
  puuid: string
}>()

const { t } = useTranslation()
const { name } = useChampionInfo()
const { masked } = useStreamerModeMaskedText()

const as = useAppCommonStore()
const ogs = useOngoingGameStore()

const { mergedPremadeTeams, navigateToSummonerByPuuid } = useOngoingGamePanel()

const summoner = computed(() => ogs.summoner[puuid])
const rankedStats = computed(() => ogs.rankedStats[puuid])
const position = computed(() => ogs.positionAssignments?.[puuid])
const championId = computed(() => ogs.championSelections?.[puuid])

const premadeTeamId = computed(() => mergedPremadeTeams.value.premadeTeamIdMap[puuid])

const premadeColors = computed(() => {
  return as.colorTheme === 'dark' ? PREMADE_TEAM_COLORS : PREMADE_TEAM_COLORS_LIGHT
})

const currentChampionId = computed(() => championId.value || -1)

const hasCurrentChampion = computed(() => currentChampionId.value > 0)

const championName = computed(() => name(currentChampionId.value))

const currentPosition = computed(() => position.value?.position)

const hasCurrentPosition = computed(() => {
  return !!currentPosition.value && currentPosition.value !== 'NONE'
})

const currentPositionName = computed(() => {
  if (!hasCurrentPosition.value) {
    return t('positions.ALL', { ns: 'common' })
  }

  return t(`positions.${currentPosition.value}`, { ns: 'common' })
})

const matchCollectionOptions = computed(() => {
  const options: DropdownOption[] = []

  if (hasCurrentChampion.value) {
    options.push({
      label: t('PlayerInfoCard.collectByChampion', { champion: championName.value }),
      key: 'collect-by-champion',
      icon: () => <ChampionIcon class="size-4 rounded" championId={currentChampionId.value} />
    })
  }

  if (hasCurrentPosition.value) {
    options.push({
      label: t('PlayerInfoCard.collectByPosition', { position: currentPositionName.value }),
      key: 'collect-by-position',
      icon: () => <PositionIcon position={currentPosition.value} />
    })
  }

  return options
})

const handleMatchCollectionSelect = (key: string | number) => {
  switch (key) {
    case 'collect-by-champion':
      if (hasCurrentChampion.value) {
        navigateToSummonerByPuuid(puuid, {
          matchHistory: { collectByChampionId: currentChampionId.value }
        })
      }
      break
    case 'collect-by-position':
      if (hasCurrentPosition.value && currentPosition.value) {
        navigateToSummonerByPuuid(puuid, {
          matchHistory: { collectByPosition: currentPosition.value }
        })
      }
      break
  }
}

const rankedSoloFlex = computed(() => {
  if (!rankedStats.value) {
    return {
      solo: null,
      flex: null
    }
  }

  const result: Record<string, any> = {}

  const solo = rankedStats.value.queueMap['RANKED_SOLO_5x5']
  const flex = rankedStats.value.queueMap['RANKED_FLEX_SR']

  if (solo && !isUnrankedTier(solo.tier)) {
    const soloText =
      solo.division && solo.division !== 'NA'
        ? `${t(`shortTiers.${solo.tier || 'UNRANKED'}`, {
            ns: 'common'
          })} ${solo.division} ${solo.leaguePoints}`
        : `${t(`shortTiers.${solo.tier || 'UNRANKED'}`, {
            ns: 'common'
          })} ${solo.leaguePoints}`

    result.solo = {
      text: soloText,
      tier: solo.tier,
      division: solo.division,
      lp: solo.leaguePoints
    }
  }

  if (flex && !isUnrankedTier(flex.tier)) {
    const flexText =
      flex.division && flex.division !== 'NA'
        ? `${t(`shortTiers.${flex.tier || 'UNRANKED'}`, {
            ns: 'common'
          })} ${flex.division} ${flex.leaguePoints}`
        : `${t(`shortTiers.${flex.tier || 'UNRANKED'}`, {
            ns: 'common'
          })} ${flex.leaguePoints}`

    result.flex = {
      text: flexText,
      tier: flex.tier,
      division: flex.division,
      lp: flex.leaguePoints
    }
  }

  return result
})

const isUnrankedTier = (tier: string | undefined | null) => {
  return !tier || tier === 'NA' || tier === 'NONE'
}
</script>
