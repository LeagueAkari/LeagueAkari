<template>
  <div v-if="totalCount > 0" class="flex flex-col gap-2 pt-3">
    <div class="flex items-center justify-between">
      <div class="text-xs font-semibold text-black/70 dark:text-white/70">
        {{ t('playersTitle', { selected: selectedCount, total: totalCount }) }}
      </div>
      <div class="flex items-center gap-1">
        <NButton size="tiny" quaternary @click="setAllSelected(true)">
          {{ t('selectAll') }}
        </NButton>
        <NButton size="tiny" quaternary @click="setAllSelected(false)">
          {{ t('clear') }}
        </NButton>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="team of teams"
        :key="team.teamIdentifier"
        class="rounded border border-black/10 bg-black/3 p-2 dark:border-white/10 dark:bg-white/3"
      >
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 text-xs font-semibold">
            <div
              v-if="team.indicatorColorClass"
              :class="[
                'size-2.5 shrink-0 rounded-full border border-white/20',
                team.indicatorColorClass
              ]"
            />
            <span>{{ team.primaryLabel }}</span>
            <span v-if="team.secondaryLabel" class="font-normal text-black/45 dark:text-white/45">
              · {{ team.secondaryLabel }}
            </span>
            <span class="font-normal text-black/45 dark:text-white/45">
              ({{ selectedInTeam(team.teamIdentifier) }}/{{ team.players.length }})
            </span>
          </div>

          <NCheckbox
            size="small"
            :checked="isTeamAllSelected(team.teamIdentifier)"
            :indeterminate="isTeamIndeterminate(team.teamIdentifier)"
            @update:checked="(value) => setTeamSelected(team.teamIdentifier, value)"
          >
            <span class="text-[11px] text-black/55 dark:text-white/55">
              {{ t('selectAll') }}
            </span>
          </NCheckbox>
        </div>

        <div class="flex flex-col gap-1">
          <div
            v-for="player of team.players"
            :key="player.puuid"
            class="flex cursor-pointer items-center gap-2 rounded px-1 py-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            @click="setPlayerSelected(player.puuid, !isPlayerSelected(player.puuid))"
          >
            <span @click.stop>
              <NCheckbox
                size="small"
                :checked="isPlayerSelected(player.puuid)"
                @update:checked="(value) => setPlayerSelected(player.puuid, value)"
              />
            </span>

            <ChampionIcon
              v-if="player.hasChampionSelection"
              class="size-6 shrink-0"
              round
              :champion-id="player.championId"
            />
            <LcuImage
              v-else
              class="size-6 shrink-0 rounded-full"
              :src="profileIconUri(player.profileIconId)"
            />

            <div class="flex min-w-0 flex-1 items-baseline gap-0.5 text-[12px] leading-none">
              <span class="truncate font-medium text-black/85 dark:text-white/85">
                {{ player.gameName }}
              </span>
              <span
                v-if="player.tagLine"
                class="shrink-0 text-[11px] text-black/50 dark:text-white/50"
              >
                #{{ player.tagLine }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { profileIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox } from 'naive-ui'

import type { PlayerSelectionPresetContext } from '../composables/usePresetSelections'

const props = defineProps<{
  selection: PlayerSelectionPresetContext
}>()

const { t } = useTranslation('renderer', { keyPrefix: 'InGameSend.presets.selection' })

const {
  totalCount,
  teams,
  selectedCount,
  selectedInTeam,
  isTeamAllSelected,
  isTeamIndeterminate,
  isPlayerSelected,
  setTeamSelected,
  setPlayerSelected,
  setAllSelected
} = props.selection
</script>
