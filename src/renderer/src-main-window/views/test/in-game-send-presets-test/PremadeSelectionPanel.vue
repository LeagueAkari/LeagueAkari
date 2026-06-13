<template>
  <div v-if="totalCount > 0" class="flex flex-col gap-2 pt-3">
    <div class="flex items-center justify-between">
      <div class="text-xs font-semibold text-black/70 dark:text-white/70">
        选中的小队 ({{ selectedGroupCount }} / {{ totalGroupCount }})
      </div>
      <div class="flex items-center gap-1">
        <NButton
          size="tiny"
          quaternary
          :disabled="totalGroupCount === 0"
          @click="setAllSelected(true)"
        >
          全选
        </NButton>
        <NButton
          size="tiny"
          quaternary
          :disabled="totalGroupCount === 0"
          @click="setAllSelected(false)"
        >
          清空
        </NButton>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="teamView of teams"
        :key="teamView.team.id"
        class="rounded border border-black/10 bg-black/3 p-2 dark:border-white/10 dark:bg-white/3"
      >
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 text-xs font-semibold">
            <div
              v-if="teamView.team.indicatorColorClass"
              :class="[
                'size-2.5 shrink-0 rounded-full border border-white/20',
                teamView.team.indicatorColorClass
              ]"
            />
            <span>{{ teamView.team.primaryLabel }}</span>
            <span
              v-if="teamView.team.secondaryLabel"
              class="font-normal text-black/45 dark:text-white/45"
            >
              · {{ teamView.team.secondaryLabel }}
            </span>
            <span class="font-normal text-black/45 dark:text-white/45">
              ({{ teamView.groups.length }} 组开黑)
            </span>
          </div>
          <NCheckbox
            v-if="teamView.groups.length > 0"
            size="small"
            :checked="isTeamAllSelected(teamView.team.id)"
            :indeterminate="isTeamIndeterminate(teamView.team.id)"
            @update:checked="(value) => setTeamSelected(teamView.team.id, value)"
          >
            <span class="text-[11px] text-black/55 dark:text-white/55">全选</span>
          </NCheckbox>
        </div>

        <div
          v-if="teamView.groups.length === 0"
          class="py-2 text-center text-[11px] text-black/40 dark:text-white/35"
        >
          无开黑组合
        </div>
        <div v-else class="flex flex-col gap-1.5">
          <div
            v-for="bucket of teamView.groups"
            :key="bucket.key"
            class="flex cursor-pointer flex-col gap-1 rounded border px-1.5 py-1.5 transition-colors hover:bg-black/4 dark:hover:bg-white/4"
            :style="{
              borderColor: colors[bucket.groupLetter]?.foregroundColor + '55'
            }"
            @click.stop="setBucketSelected(bucket.groupIndex, !isBucketSelected(bucket.groupIndex))"
          >
            <div class="flex items-center gap-2" @click.stop>
              <NCheckbox
                size="small"
                :checked="isBucketSelected(bucket.groupIndex)"
                @update:checked="(value) => setBucketSelected(bucket.groupIndex, value)"
              />
              <div
                class="rounded-sm px-1 py-0.5 text-[10px] leading-3 font-semibold"
                :style="{
                  backgroundColor: colors[bucket.groupLetter]?.foregroundColor,
                  color: colors[bucket.groupLetter]?.color
                }"
              >
                {{ bucket.players.length }} 黑
              </div>
            </div>
            <div class="flex flex-col gap-0.5 pl-6">
              <div
                v-for="player of bucket.players"
                :key="player.puuid"
                class="flex items-center gap-2"
              >
                <ChampionIcon class="size-5 shrink-0" round :champion-id="player.championId" />
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
    </div>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { NButton, NCheckbox } from 'naive-ui'

import { usePremadeSelectionPreset } from './context'

const {
  totalCount,
  teams,
  selectedGroupCount,
  totalGroupCount,
  colors,
  isBucketSelected,
  setBucketSelected,
  setAllSelected,
  isTeamAllSelected,
  isTeamIndeterminate,
  setTeamSelected
} = usePremadeSelectionPreset()
</script>
