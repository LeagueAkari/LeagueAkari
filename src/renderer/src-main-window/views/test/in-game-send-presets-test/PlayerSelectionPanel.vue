<template>
  <div v-if="totalCount > 0" class="flex flex-col gap-2 pt-3">
    <div class="flex items-center justify-between">
      <div class="text-xs font-semibold text-black/70 dark:text-white/70">
        发送的目标 ({{ selectedCount }} / {{ totalCount }})
      </div>
      <div class="flex items-center gap-1">
        <NButton size="tiny" quaternary @click="setAllSelected(true)"> 全选 </NButton>
        <NButton size="tiny" quaternary @click="setAllSelected(false)"> 清空 </NButton>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="team of teams"
        :key="team.id"
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
              ({{ selectedInTeam(team.id) }}/{{ team.players.length }})
            </span>
          </div>
          <NCheckbox
            size="small"
            :checked="isTeamAllSelected(team.id)"
            :indeterminate="isTeamIndeterminate(team.id)"
            @update:checked="(value) => setTeamSelected(team.id, value)"
          >
            <span class="text-[11px] text-black/55 dark:text-white/55">全选</span>
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
            <ChampionIcon class="size-6 shrink-0" round :champion-id="player.championId" />
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
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { NButton, NCheckbox } from 'naive-ui'

import { usePlayerSelectionPreset } from './context'

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
} = usePlayerSelectionPreset()
</script>
