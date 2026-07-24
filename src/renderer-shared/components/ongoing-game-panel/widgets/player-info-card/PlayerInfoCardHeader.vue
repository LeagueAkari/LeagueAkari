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
                <template v-if="summonerName">
                  <span
                    class="text-[13px] font-bold text-black/80 dark:text-white/80"
                    :style="{
                      color: premadeTeamId
                        ? premadeColors[premadeTeamId]?.foregroundColor
                        : undefined
                    }"
                    >{{ masked(summonerName, championName) }}</span
                  >
                  <span
                    v-if="!ongoingGame.streamerMode"
                    class="ml-1 text-xs text-gray-500 dark:text-gray-400"
                    >#{{ summoner?.tagLine || '—' }}</span
                  >
                </template>
                <NSkeleton v-else :sharp="false" text :height="22" :width="112" />
              </div>
            </template>
            <div class="max-w-50 text-xs">
              {{ t('ongoingGame.playerCard.premadePopover', { team: premadeTeamId }) }}
            </div>
          </NPopover>
        </div>

        <span v-if="playerActionOptions.length" class="relative inline-flex shrink-0">
          <NPopover v-model:show="isTagEditPopoverShowing" trigger="click" placement="bottom-end">
            <template #trigger>
              <span class="player-action-anchor pointer-events-none absolute inset-0" />
            </template>

            <PlayerTagEditPanel
              :puuid="puuid"
              :summoner="summoner"
              @cancel="isTagEditPopoverShowing = false"
              @saved="handleTagSaved"
            />
          </NPopover>

          <NDropdown
            trigger="click"
            size="small"
            placement="bottom-start"
            :options="playerActionOptions"
            @select="handlePlayerActionSelect"
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
        </span>
      </div>

      <NPopover :keep-alive-on-hover="false" :delay="50">
        <template #trigger>
          <div class="flex gap-1">
            <div v-if="rankedSoloFlex.solo" class="flex w-0 flex-1 items-center justify-start">
              <img
                class="mr-1 size-3.5"
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
                class="mr-1 size-3.5"
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
        <div v-else class="text-xs">{{ t('ongoingGame.playerCard.empty') }}</div>
      </NPopover>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { PlayerTagEditPanel } from '@renderer-shared/components/player-tag-edit'
import RankedTable from '@renderer-shared/components/RankedTable.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { Edit20Filled } from '@vicons/fluent'
import { MoreVertFilled as MoreVertFilledIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon, NPopover, NSkeleton, type DropdownOption } from 'naive-ui'
import { computed, ref } from 'vue'

import { PREMADE_TEAM_COLORS, PREMADE_TEAM_COLORS_LIGHT, RANKED_MEDAL_MAP } from '../../constants'
import { useOngoingGamePanel } from '../../context'
import {
  PLAYER_INFO_CARD_ACTION_KEYS,
  createCollectByChampionInitParams,
  getPlayerInfoCardActionKeys
} from './player-actions'

const { puuid } = defineProps<{
  puuid: string
}>()

const { t } = useTranslation()
const { masked } = useStreamerModeMaskedText()

const {
  ongoingGame,
  mergedPremadeTeams,
  navigateToSummonerByPuuid,
  isStandaloneOngoingGameWindow
} = useOngoingGamePanel()
const resources = useAkariResourceProvider()

const summoner = computed(() => ongoingGame.value.summoner[puuid])
const summonerName = computed(() => summoner.value?.gameName || summoner.value?.displayName || '')
const rankedStats = computed(() => ongoingGame.value.rankedStats[puuid])
const position = computed(() => ongoingGame.value.positionAssignments?.[puuid])
const championId = computed(() => ongoingGame.value.championSelections?.[puuid])

const isTagEditPopoverShowing = ref(false)

const premadeTeamId = computed(() => mergedPremadeTeams.value.premadeTeamIdMap[puuid])

const premadeColors = computed(() => {
  return resources.runtime.colorMode === 'dark' ? PREMADE_TEAM_COLORS : PREMADE_TEAM_COLORS_LIGHT
})

const currentChampionId = computed(() => championId.value || -1)

const hasCurrentChampion = computed(() => currentChampionId.value > 0)

const championName = computed(() => resources.champions.name(currentChampionId.value))

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

const canEditTag = computed(
  () =>
    !isStandaloneOngoingGameWindow.value &&
    !!ongoingGame.value.selfPuuid &&
    puuid !== ongoingGame.value.selfPuuid
)

const playerActionKeys = computed(() =>
  getPlayerInfoCardActionKeys({
    isStandaloneOngoingGameWindow: isStandaloneOngoingGameWindow.value,
    canEditTag: canEditTag.value,
    canCollectByChampion: hasCurrentChampion.value,
    canCollectByPosition: hasCurrentPosition.value
  })
)

const playerActionOptions = computed(() => {
  return playerActionKeys.value.map<DropdownOption>((key) => {
    switch (key) {
      case PLAYER_INFO_CARD_ACTION_KEYS.editTag:
        return {
          label: t('ongoingGame.playerCard.editTag'),
          key,
          icon: () => (
            <NIcon>
              <Edit20Filled />
            </NIcon>
          )
        }
      case PLAYER_INFO_CARD_ACTION_KEYS.collectByChampion:
        return {
          label: t('ongoingGame.playerCard.collectByChampion', { champion: championName.value }),
          key,
          icon: () => <ChampionIcon class="size-4 rounded" championId={currentChampionId.value} />
        }
      case PLAYER_INFO_CARD_ACTION_KEYS.collectByPosition:
        return {
          label: t('ongoingGame.playerCard.collectByPosition', {
            position: currentPositionName.value
          }),
          key,
          icon: () => <PositionIcon position={currentPosition.value} />
        }
    }
  })
})

const handlePlayerActionSelect = (key: string | number) => {
  switch (key) {
    case PLAYER_INFO_CARD_ACTION_KEYS.editTag:
      isTagEditPopoverShowing.value = true
      break
    case PLAYER_INFO_CARD_ACTION_KEYS.collectByChampion:
      if (hasCurrentChampion.value) {
        navigateToSummonerByPuuid(
          puuid,
          createCollectByChampionInitParams(
            currentChampionId.value,
            ongoingGame.value.settings.matchHistoryLoadCount
          )
        )
      }
      break
    case PLAYER_INFO_CARD_ACTION_KEYS.collectByPosition:
      if (hasCurrentPosition.value && currentPosition.value) {
        navigateToSummonerByPuuid(puuid, {
          matchHistory: {
            collectByPosition: currentPosition.value,
            expectedCount: ongoingGame.value.settings.matchHistoryLoadCount
          }
        })
      }
      break
  }
}

const handleTagSaved = () => {
  isTagEditPopoverShowing.value = false
  ongoingGame.value.reloadPlayer(puuid, { includes: ['savedInfo'] })
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
