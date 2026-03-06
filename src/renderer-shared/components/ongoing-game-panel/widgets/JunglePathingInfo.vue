<template>
  <NPopover :keep-alive-on-hover="true" trigger="manual" :show="popoverShow">
    <template #trigger>
      <div
        :class="fullWidth ? 'flex w-full' : 'inline-flex'"
        @mouseenter="handleTriggerMouseEnter"
        @mouseleave="handleTriggerMouseLeave"
      >
        <span
          v-if="triggerMode === 'text'"
          :data-ftue-target="ftueTarget || undefined"
          class="inline-flex cursor-default items-center rounded border border-emerald-600/35 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] leading-none text-emerald-700 dark:border-emerald-300/40 dark:bg-emerald-400/15 dark:text-emerald-300"
        >
          {{ triggerText || t('JunglePathing.title') }}
        </span>
        <div
          v-else
          :data-ftue-target="ftueTarget || undefined"
          class="mb-1 flex cursor-pointer items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 transition-[filter] hover:brightness-110 dark:border-emerald-400/20 dark:bg-emerald-400/10"
          :class="{ 'w-full': fullWidth }"
        >
          <!-- mini map -->
          <div
            class="relative shrink-0"
            :style="{ width: `${MINI_SIZE}px`, height: `${MINI_SIZE}px` }"
          >
            <img class="absolute h-full w-full rounded" :src="map11" />
            <svg class="absolute h-full w-full" viewBox="0 0 100 100">
              <line
                x1="0"
                y1="0"
                x2="100"
                y2="100"
                stroke="rgba(255,255,255,0.3)"
                stroke-width="1"
                stroke-dasharray="3,2"
              />
            </svg>
            <div
              v-for="(pt, i) of miniMapPoints.slice(0, 20)"
              :key="i"
              class="absolute h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50"
              :class="minuteDotColors[pt.lane]"
              :style="{ left: `${pt.left}px`, top: `${pt.top}px` }"
            />
          </div>

          <!-- text stats -->
          <div class="flex min-w-0 flex-1 flex-col gap-0.5 text-[11px]">
            <div class="flex items-center gap-1">
              <span class="font-bold text-emerald-700 dark:text-emerald-300">{{
                t('JunglePathing.title')
              }}</span>
              <span
                v-if="analysis.currentChampion"
                class="text-[10px] text-amber-600 dark:text-amber-400"
                >{{ t('JunglePathing.currentChampion') }}</span
              >
              <span class="text-[10px] text-black/50 dark:text-white/50">{{
                t('JunglePathing.gamesAnalyzed', { count: displayStats.gamesAnalyzed })
              }}</span>
            </div>
            <div class="flex gap-1 text-black/80 dark:text-white/80">
              <span class="whitespace-nowrap" :class="topsideTextColor(displayStats)">{{
                topsideTextShort(displayStats)
              }}</span>
              <span class="text-black/40 dark:text-white/40">|</span>
              <span class="whitespace-nowrap">
                <span class="text-red-400">{{ t('JunglePathing.topShort') }}</span
                >{{ formatWeightSum(displayStats.topZoneWeightSum) }}
                <span class="text-yellow-400">{{ t('JunglePathing.midShort') }}</span
                >{{ formatWeightSum(displayStats.midZoneWeightSum) }}
                <span class="text-blue-400">{{ t('JunglePathing.botShort') }}</span
                >{{ formatWeightSum(displayStats.botZoneWeightSum) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- popover detail -->
    <div
      ref="popoverContentRef"
      class="flex flex-col gap-2"
      :style="popoverContentStyle"
      @mouseenter="handlePopoverMouseEnter"
      @mouseleave="handlePopoverMouseLeave"
    >
      <!-- tab switch + copy -->
      <div
        v-if="tabs.length > 1 || showCopyAll"
        class="flex items-center gap-2"
        :class="
          tabs.length > 1 && showCopyAll
            ? 'justify-between'
            : tabs.length > 1
              ? 'justify-start'
              : 'justify-end'
        "
      >
        <div v-if="tabs.length > 1" class="flex gap-1 text-xs">
          <button
            v-for="tab of tabs"
            :key="tab.key"
            class="cursor-pointer rounded px-2 py-0.5 transition-colors"
            :class="
              activeTab === tab.key
                ? 'bg-emerald-500/20 font-bold text-emerald-700 dark:text-emerald-300'
                : 'text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5'
            "
            @click="setActiveTab(tab.key)"
          >
            {{ tab.label }}<span v-if="tab.stats"> ({{ tab.stats.gamesAnalyzed }})</span>
          </button>
        </div>
        <button
          v-if="showCopyAll"
          class="shrink-0 cursor-pointer rounded px-2 py-1 text-[11px] text-black/60 transition-colors hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5"
          @click="handleCopyAll"
        >
          <NIcon class="mr-0.5 align-middle" :component="CopyIcon" />
          {{ t('JunglePathing.copyAll') }}
        </button>
      </div>

      <div
        v-if="activeTabLoading"
        class="flex items-center gap-2 rounded bg-black/5 p-2 text-xs text-black/70 dark:bg-white/5 dark:text-white/70"
      >
        <NSpin :size="14" />
        <span>{{ t('PlayerTab.loading') }}</span>
      </div>

      <div
        v-else-if="!hasPopoverStats"
        class="rounded bg-black/5 p-2 text-xs text-black/70 dark:bg-white/5 dark:text-white/70"
      >
        {{ t('JunglePathing.noData') }}
      </div>

      <template v-else>
        <div class="flex gap-3">
          <!-- larger map -->
          <div class="flex shrink-0 flex-col gap-1">
            <div class="relative" :style="{ width: `${LARGE_SIZE}px`, height: `${LARGE_SIZE}px` }">
              <img class="absolute h-full w-full rounded" :src="map11" />
              <!-- 红蓝方底色 -->
              <svg class="absolute h-full w-full rounded" viewBox="0 0 100 100">
                <polygon points="0,0 100,100 0,100" :fill="blueSideTriangleFill" />
                <polygon points="0,0 100,100 100,0" :fill="redSideTriangleFill" />
                <line
                  x1="0"
                  y1="0"
                  x2="100"
                  y2="100"
                  stroke="rgba(255,255,255,0.4)"
                  stroke-width="0.8"
                  stroke-dasharray="4,3"
                />
              </svg>
              <div
                v-for="(pt, i) of largeMapPoints"
                :key="i"
                class="absolute z-2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60"
                :class="minuteDotColors[pt.lane]"
                :style="{ left: `${pt.left}px`, top: `${pt.top}px` }"
              />
            </div>
            <div class="flex flex-col gap-1 pl-0.5 text-[10px] text-black/55 dark:text-white/55">
              <span class="inline-flex items-center gap-1 whitespace-nowrap">
                <span class="grid w-[30px] grid-cols-3 place-items-center">
                  <svg class="h-2 w-2 text-red-400" viewBox="0 0 8 8" aria-hidden="true">
                    <circle cx="4" cy="4" r="2" fill="currentColor" />
                  </svg>
                  <svg class="h-2 w-2 text-yellow-400" viewBox="0 0 8 8" aria-hidden="true">
                    <circle cx="4" cy="4" r="2" fill="currentColor" />
                  </svg>
                  <svg class="h-2 w-2 text-blue-400" viewBox="0 0 8 8" aria-hidden="true">
                    <circle cx="4" cy="4" r="2" fill="currentColor" />
                  </svg>
                </span>
                {{ t('JunglePathing.gankLegend') }}
              </span>
            </div>
          </div>

          <!-- detail stats -->
          <div class="flex flex-col justify-center gap-2 text-xs">
            <div>
              <div class="mb-1 font-bold text-black/90 dark:text-white/90">
                {{ t('JunglePathing.mapPref') }}
              </div>
              <div class="mt-0.5 text-[11px] whitespace-nowrap text-black/75 dark:text-white/75">
                <span class="text-red-400">{{ t('JunglePathing.top') }}</span
                >{{ formatWeightSum(popoverStats.topZoneWeightSum) }}
                <span class="text-yellow-400">{{ t('JunglePathing.mid') }}</span
                >{{ formatWeightSum(popoverStats.midZoneWeightSum) }}
                <span class="text-blue-400">{{ t('JunglePathing.bot') }}</span
                >{{ formatWeightSum(popoverStats.botZoneWeightSum) }}
                <span class="mx-1 text-black/40 dark:text-white/40">|</span>
                <span :class="topsideTextColor(popoverStats)">{{
                  topsideTextWithPct(popoverStats)
                }}</span>
              </div>
            </div>
            <div>
              <div class="mb-1 font-bold text-black/90 dark:text-white/90">
                {{ t('JunglePathing.objectives') }}
              </div>
              <div class="flex flex-col gap-1">
                <div class="grid grid-cols-2 gap-x-3 gap-y-1">
                  <div class="flex min-w-0 flex-col gap-1">
                    <div class="inline-flex min-w-0 items-center gap-0.5">
                      <DragonIcon class="size-3.5" />{{
                        t('JunglePathing.firstDragonRate', {
                          pct: Math.round(popoverStats.objectives.firstDragonRate * 100)
                        })
                      }}
                    </div>
                    <div class="inline-flex min-w-0 items-center gap-0.5">
                      <DragonIcon class="size-3.5" />{{
                        t('JunglePathing.soloDragonRate', {
                          pct: Math.round(popoverStats.objectives.soloDragonRate * 100)
                        })
                      }}
                    </div>
                    <div class="inline-flex min-w-0 items-center justify-between gap-1">
                      <span class="inline-flex items-center gap-0.5">
                        <DragonIcon class="size-3.5" />{{
                          t(
                            currentObjectiveTextMode === 'single'
                              ? 'JunglePathing.dragons'
                              : 'JunglePathing.avgDragons',
                            {
                              count: roundToTenth(popoverStats.objectives.avgDragons)
                            }
                          )
                        }}
                      </span>
                      <span
                        v-if="popoverStats.objectives.avgFirstDragonTime !== null"
                        class="shrink-0 text-black/50 dark:text-white/50"
                      >
                        {{
                          t('JunglePathing.firstTime', {
                            time: formatTime(popoverStats.objectives.avgFirstDragonTime)
                          })
                        }}
                      </span>
                    </div>
                  </div>
                  <div class="flex min-w-0 flex-col gap-1">
                    <div class="inline-flex min-w-0 items-center justify-between gap-1">
                      <span class="inline-flex items-center gap-0.5">
                        <VoidGrubIcon class="size-3.5" />{{
                          t(
                            currentObjectiveTextMode === 'single'
                              ? 'JunglePathing.voidgrubs'
                              : 'JunglePathing.avgVoidgrubs',
                            {
                              count: roundToTenth(popoverStats.objectives.avgVoidgrubs)
                            }
                          )
                        }}
                      </span>
                      <span
                        v-if="popoverStats.objectives.avgFirstVoidgrubTime !== null"
                        class="shrink-0 text-black/50 dark:text-white/50"
                      >
                        {{
                          t('JunglePathing.firstTime', {
                            time: formatTime(popoverStats.objectives.avgFirstVoidgrubTime)
                          })
                        }}
                      </span>
                    </div>
                    <div class="inline-flex min-w-0 items-center justify-between gap-1">
                      <span class="inline-flex items-center gap-0.5">
                        <RiftHeraldIcon class="size-3.5" />{{
                          t(
                            currentObjectiveTextMode === 'single'
                              ? 'JunglePathing.heralds'
                              : 'JunglePathing.avgHeralds',
                            {
                              count: roundToTenth(popoverStats.objectives.avgHeralds)
                            }
                          )
                        }}
                      </span>
                      <span
                        v-if="popoverStats.objectives.avgFirstHeraldTime !== null"
                        class="shrink-0 text-black/50 dark:text-white/50"
                      >
                        {{
                          t('JunglePathing.firstTime', {
                            time: formatTime(popoverStats.objectives.avgFirstHeraldTime)
                          })
                        }}
                      </span>
                    </div>
                    <div class="inline-flex min-w-0 items-center justify-between gap-1">
                      <span class="inline-flex items-center gap-0.5">
                        <BaronIcon class="size-3.5" />{{
                          t(
                            currentObjectiveTextMode === 'single'
                              ? 'JunglePathing.barons'
                              : 'JunglePathing.avgBarons',
                            {
                              count: roundToTenth(popoverStats.objectives.avgBarons)
                            }
                          )
                        }}
                      </span>
                      <span
                        v-if="popoverStats.objectives.avgFirstBaronTime !== null"
                        class="shrink-0 text-black/50 dark:text-white/50"
                      >
                        {{
                          t('JunglePathing.firstTime', {
                            time: formatTime(popoverStats.objectives.avgFirstBaronTime)
                          })
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="max-w-[360px] text-[11px] leading-relaxed text-black/40 dark:text-white/40">
              {{
                t(
                  currentObjectiveTextMode === 'single'
                    ? 'JunglePathing.descriptionSingle'
                    : 'JunglePathing.description'
                )
              }}
            </div>
          </div>
        </div>

        <!-- 首清营地 + 前期抓人地图 -->
        <div class="flex gap-3">
          <div class="flex shrink-0 flex-col gap-1">
            <div
              class="relative"
              :style="{ width: `${CAMP_MAP_SIZE}px`, height: `${CAMP_MAP_SIZE}px` }"
            >
              <img class="absolute h-full w-full rounded" :src="map11" />
              <!-- 红蓝方底色 -->
              <svg class="absolute h-full w-full rounded" viewBox="0 0 100 100">
                <polygon points="0,0 100,100 0,100" :fill="blueSideTriangleFill" />
                <polygon points="0,0 100,100 100,0" :fill="redSideTriangleFill" />
                <line
                  x1="0"
                  y1="0"
                  x2="100"
                  y2="100"
                  stroke="rgba(255,255,255,0.4)"
                  stroke-width="0.8"
                  stroke-dasharray="4,3"
                />
              </svg>
              <div
                v-for="(pt, i) of firstClearCampMapPoints"
                :key="`camp-${i}`"
                class="absolute z-1 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40"
                :title="firstClearCampPointTitle(pt.kind, pt.camp, pt.pct)"
                :style="{
                  left: `${pt.left}px`,
                  top: `${pt.top}px`,
                  width: `${pt.size}px`,
                  height: `${pt.size}px`,
                  backgroundColor: campMarkerColors[pt.camp],
                  opacity: pt.opacity,
                  borderColor:
                    pt.kind === 'invade' ? 'rgba(251,191,36,0.85)' : 'rgba(255,255,255,0.4)'
                }"
              />
              <!-- 3/4级抓人击杀位置（叉号标记） -->
              <div
                v-for="(pt, i) of earlyGankMapPoints"
                :key="`eg-${i}`"
                class="absolute z-5 h-4 w-4 -translate-x-1/2 -translate-y-1/2"
                :style="{ left: `${pt.left}px`, top: `${pt.top}px` }"
              >
                <span
                  class="absolute top-1/2 left-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-sm"
                  :class="pt.level === 3 ? 'bg-orange-400' : 'bg-purple-400'"
                />
                <span
                  class="absolute top-1/2 left-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm"
                  :class="pt.level === 3 ? 'bg-orange-400' : 'bg-purple-400'"
                />
              </div>
            </div>
            <div class="flex flex-col gap-1 pl-0.5 text-[10px] text-black/55 dark:text-white/55">
              <span class="inline-flex items-center gap-1 whitespace-nowrap">
                <span
                  class="inline-block h-2.5 w-2.5 rounded-full border border-white/40 bg-white/40"
                />
                {{ t('JunglePathing.firstClearOwnLegend') }}
              </span>
              <span class="inline-flex items-center gap-1 whitespace-nowrap text-amber-400">
                <span
                  class="inline-block h-2.5 w-2.5 rounded-full border border-amber-400/90 bg-white/20"
                />
                {{ t('JunglePathing.firstClearInvadeLegend') }}
              </span>
              <span class="inline-flex items-center gap-1 whitespace-nowrap text-orange-400">
                <svg class="h-2.5 w-2.5 text-orange-400" viewBox="0 0 8 8" aria-hidden="true">
                  <line
                    x1="2"
                    y1="2"
                    x2="6"
                    y2="6"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linecap="round"
                  />
                  <line
                    x1="2"
                    y1="6"
                    x2="6"
                    y2="2"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linecap="round"
                  />
                </svg>
                {{ t('JunglePathing.level3KillLegend') }}
              </span>
              <span class="inline-flex items-center gap-1 whitespace-nowrap text-purple-400">
                <svg class="h-2.5 w-2.5 text-purple-400" viewBox="0 0 8 8" aria-hidden="true">
                  <line
                    x1="2"
                    y1="2"
                    x2="6"
                    y2="6"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linecap="round"
                  />
                  <line
                    x1="2"
                    y1="6"
                    x2="6"
                    y2="2"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linecap="round"
                  />
                </svg>
                {{ t('JunglePathing.level4KillLegend') }}
              </span>
            </div>
          </div>
          <div class="flex flex-col justify-center gap-2 text-xs">
            <div>
              <div class="mb-1 font-bold text-black/90 dark:text-white/90">
                {{ t('JunglePathing.firstClear') }}
              </div>
              <div
                v-if="popoverStats.firstClearCamp.blueGames > 0"
                class="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-x-2"
                :class="sideRowClass('blue')"
              >
                <span class="row-span-2 self-start text-[#40c1ff]">{{
                  t('JunglePathing.blueTeam')
                }}</span>
                <span class="min-w-0 truncate">{{ firstClearOwnText(popoverStats, 'blue') }}</span>
                <span class="min-w-0 truncate text-amber-500">
                  {{ firstClearInvadeText(popoverStats, 'blue') || t('JunglePathing.noData') }}
                </span>
              </div>
              <div
                v-if="popoverStats.firstClearCamp.redGames > 0"
                class="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-x-2"
                :class="sideRowClass('red')"
              >
                <span class="row-span-2 self-start text-[#ff3333]">{{
                  t('JunglePathing.redTeam')
                }}</span>
                <span class="min-w-0 truncate">{{ firstClearOwnText(popoverStats, 'red') }}</span>
                <span class="min-w-0 truncate text-amber-500">
                  {{ firstClearInvadeText(popoverStats, 'red') || t('JunglePathing.noData') }}
                </span>
              </div>
              <div
                v-if="
                  popoverStats.firstClearCamp.blueGames === 0 &&
                  popoverStats.firstClearCamp.redGames === 0
                "
                class="text-black/50 dark:text-white/50"
              >
                —
              </div>
            </div>
            <div>
              <div class="mb-1 font-bold text-black/90 dark:text-white/90">
                {{ t('JunglePathing.earlyGank') }}
              </div>
              <div class="flex flex-col gap-0.5">
                <div
                  v-if="popoverStats.earlyGank.byTeam.blueGames > 0"
                  class="grid grid-cols-[42px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-2"
                  :class="sideRowClass('blue')"
                >
                  <span class="text-[#40c1ff]">{{ t('JunglePathing.blueTeam') }}</span>
                  <span class="min-w-0 truncate whitespace-nowrap text-orange-400"
                    >{{
                      t('JunglePathing.level3Gank', {
                        pct: Math.round(earlyGankRateByTeam(popoverStats, 'blue', 3) * 100)
                      })
                    }}{{ killLaneText(earlyGankPositionsByTeam(popoverStats, 'blue', 3)) }}</span
                  >
                  <span class="min-w-0 truncate whitespace-nowrap text-purple-400"
                    >{{
                      t('JunglePathing.level4Gank', {
                        pct: Math.round(earlyGankRateByTeam(popoverStats, 'blue', 4) * 100)
                      })
                    }}{{ killLaneText(earlyGankPositionsByTeam(popoverStats, 'blue', 4)) }}</span
                  >
                </div>
                <div
                  v-if="popoverStats.earlyGank.byTeam.redGames > 0"
                  class="grid grid-cols-[42px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-2"
                  :class="sideRowClass('red')"
                >
                  <span class="text-[#ff3333]">{{ t('JunglePathing.redTeam') }}</span>
                  <span class="min-w-0 truncate whitespace-nowrap text-orange-400"
                    >{{
                      t('JunglePathing.level3Gank', {
                        pct: Math.round(earlyGankRateByTeam(popoverStats, 'red', 3) * 100)
                      })
                    }}{{ killLaneText(earlyGankPositionsByTeam(popoverStats, 'red', 3)) }}</span
                  >
                  <span class="min-w-0 truncate whitespace-nowrap text-purple-400"
                    >{{
                      t('JunglePathing.level4Gank', {
                        pct: Math.round(earlyGankRateByTeam(popoverStats, 'red', 4) * 100)
                      })
                    }}{{ killLaneText(earlyGankPositionsByTeam(popoverStats, 'red', 4)) }}</span
                  >
                </div>
                <div
                  v-if="
                    popoverStats.earlyGank.byTeam.blueGames === 0 &&
                    popoverStats.earlyGank.byTeam.redGames === 0
                  "
                  class="text-black/50 dark:text-white/50"
                >
                  —
                </div>
              </div>
            </div>
            <div class="max-w-[360px] text-[11px] leading-relaxed text-black/40 dark:text-white/40">
              {{
                t(
                  currentObjectiveTextMode === 'single'
                    ? 'JunglePathing.description2Single'
                    : 'JunglePathing.description2'
                )
              }}
            </div>
          </div>
        </div>
      </template>
    </div>
  </NPopover>
</template>

<script setup lang="ts">
import BaronIcon from '@renderer-shared/components/match-card/icons/Baron.vue'
import DragonIcon from '@renderer-shared/components/match-card/icons/Dragon.vue'
import RiftHeraldIcon from '@renderer-shared/components/match-card/icons/RiftHerald.vue'
import VoidGrubIcon from '@renderer-shared/components/match-card/icons/VoidGrub.vue'
import map11 from '@renderer-shared/components/match-card/map-images/11.png'
import { mapToImagePosition } from '@renderer-shared/components/match-card/utils/game-map'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import {
  GankPoint,
  JunglePathingAnalysis,
  JunglePathingStats
} from '@shared/data-adapter/analysis/jungle'
import {
  BLUE_SIDE_CAMPS,
  type JungleCamp,
  RED_SIDE_CAMPS
} from '@shared/data-adapter/analysis/jungle'
import { Copy as CopyIcon } from '@vicons/tabler'
import { useTranslation } from 'i18next-vue'
import { NIcon, NPopover, NSpin, useMessage } from 'naive-ui'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'

export interface JunglePathingCustomTab {
  key: string
  label: string
  analysis: JunglePathingAnalysis | null
  loading?: boolean
  objectiveTextMode?: 'single' | 'average'
}

interface ResolvedJunglePathingTab {
  key: string
  label: string
  stats: JunglePathingStats | null
  analysis: JunglePathingAnalysis | null
  loading: boolean
  objectiveTextMode: 'single' | 'average'
}

const emits = defineEmits<{
  tabChange: [key: string]
}>()

const {
  analysis,
  showCopyAll = true,
  triggerMode = 'default',
  triggerText = '',
  ftueTarget = '',
  customTabs = [],
  currentGameSide = null,
  fullWidth = false
} = defineProps<{
  analysis: JunglePathingAnalysis
  showCopyAll?: boolean
  triggerMode?: 'default' | 'text'
  triggerText?: string
  ftueTarget?: string
  customTabs?: JunglePathingCustomTab[]
  currentGameSide?: 'blue' | 'red' | null
  fullWidth?: boolean
}>()

const { t } = useTranslation()
const ogs = useOngoingGameStore()
const lcs = useLeagueClientStore()
const message = useMessage()
const popoverShow = ref(false)
const popoverContentRef = ref<HTMLElement | null>(null)

const isTriggerHovered = ref(false)
const isPopoverHovered = ref(false)
const autoCloseBlockedUntil = ref(0)

const maxPopoverWidth = ref(0)
const maxPopoverHeight = ref(0)

const AUTO_CLOSE_DELAY_MS = 160
const TAB_SWITCH_GUARD_MS = 900

let popoverCloseTimer: ReturnType<typeof setTimeout> | null = null
let popoverResizeObserver: ResizeObserver | null = null

const clearPopoverCloseTimer = () => {
  if (popoverCloseTimer) {
    clearTimeout(popoverCloseTimer)
    popoverCloseTimer = null
  }
}

const clearPopoverResizeObserver = () => {
  if (popoverResizeObserver) {
    popoverResizeObserver.disconnect()
    popoverResizeObserver = null
  }
}

const blockAutoClose = (duration = TAB_SWITCH_GUARD_MS) => {
  autoCloseBlockedUntil.value = Date.now() + duration
}

const updateMaxPopoverSize = () => {
  const el = popoverContentRef.value
  if (!el) {
    return
  }

  const rect = el.getBoundingClientRect()
  maxPopoverWidth.value = Math.max(maxPopoverWidth.value, Math.ceil(rect.width))
  maxPopoverHeight.value = Math.max(maxPopoverHeight.value, Math.ceil(rect.height))
}

const popoverContentStyle = computed(() => {
  return {
    minWidth: maxPopoverWidth.value > 0 ? `${maxPopoverWidth.value}px` : undefined,
    minHeight: maxPopoverHeight.value > 0 ? `${maxPopoverHeight.value}px` : undefined
  }
})

const tryClosePopover = () => {
  if (isTriggerHovered.value || isPopoverHovered.value) {
    return
  }

  const remaining = autoCloseBlockedUntil.value - Date.now()
  if (remaining > 0) {
    clearPopoverCloseTimer()
    popoverCloseTimer = setTimeout(() => {
      tryClosePopover()
    }, remaining + 16)
    return
  }

  popoverShow.value = false
}

const handleTriggerMouseEnter = () => {
  isTriggerHovered.value = true
  clearPopoverCloseTimer()
  popoverShow.value = true
}

const handleTriggerMouseLeave = () => {
  isTriggerHovered.value = false
  schedulePopoverClose()
}

const handlePopoverMouseEnter = () => {
  isPopoverHovered.value = true
  clearPopoverCloseTimer()
}

const handlePopoverMouseLeave = () => {
  isPopoverHovered.value = false
  schedulePopoverClose()
}

const schedulePopoverClose = () => {
  clearPopoverCloseTimer()
  popoverCloseTimer = setTimeout(() => {
    tryClosePopover()
  }, AUTO_CLOSE_DELAY_MS)
}

watch(
  () => popoverShow.value,
  async (show) => {
    if (show) {
      maxPopoverWidth.value = 0
      maxPopoverHeight.value = 0

      await nextTick()
      updateMaxPopoverSize()

      clearPopoverResizeObserver()
      const el = popoverContentRef.value
      if (el) {
        popoverResizeObserver = new ResizeObserver(() => {
          updateMaxPopoverSize()
        })
        popoverResizeObserver.observe(el)
      }

      return
    }

    isTriggerHovered.value = false
    isPopoverHovered.value = false
    clearPopoverCloseTimer()
    clearPopoverResizeObserver()
  }
)

onUnmounted(() => {
  clearPopoverCloseTimer()
  clearPopoverResizeObserver()
})

const MINI_SIZE = 48
const LARGE_SIZE = 140
const CAMP_MAP_SIZE = LARGE_SIZE

const minuteDotColors: Record<string, string> = {
  top: 'bg-red-400/80',
  mid: 'bg-yellow-400/80',
  bot: 'bg-blue-400/80'
}

/** 卡片上优先显示当前英雄数据，fallback 到总体 */
const displayStats = computed<JunglePathingStats>(() => {
  if (customTabs.length > 0) {
    const firstStats = customTabs.find((tab) => !!tab.analysis)?.analysis?.overall
    if (firstStats) {
      return firstStats
    }
  }

  return analysis.currentChampion ?? analysis.overall
})

const activeTab = ref<string>('')

const tabs = computed<ResolvedJunglePathingTab[]>(() => {
  if (customTabs.length > 0) {
    return customTabs.map((tab) => ({
      key: tab.key,
      label: tab.label,
      stats: tab.analysis?.overall ?? null,
      analysis: tab.analysis,
      loading: !!tab.loading,
      objectiveTextMode: tab.objectiveTextMode || 'average'
    }))
  }

  const items: ResolvedJunglePathingTab[] = []
  if (analysis.currentChampion) {
    const currentChampionName = analysis.currentChampionId
      ? lcs.gameData.championName(analysis.currentChampionId)
      : ''

    items.push({
      key: 'currentChampion',
      label: currentChampionName || t('JunglePathing.currentChampion'),
      stats: analysis.currentChampion,
      analysis,
      loading: false,
      objectiveTextMode: 'average'
    })
  }
  items.push({
    key: 'overall',
    label: t('JunglePathing.overall'),
    stats: analysis.overall,
    analysis,
    loading: false,
    objectiveTextMode: 'average'
  })
  return items
})

watch(
  () => tabs.value,
  (nextTabs) => {
    if (nextTabs.length === 0) {
      activeTab.value = ''
      return
    }

    if (!nextTabs.some((tab) => tab.key === activeTab.value)) {
      activeTab.value = nextTabs[0].key
    }
  },
  { immediate: true }
)

const activeTabConfig = computed(() => {
  return tabs.value.find((tab) => tab.key === activeTab.value) || null
})

const activeTabLoading = computed(() => {
  return !!activeTabConfig.value?.loading
})

const hasPopoverStats = computed(() => {
  return !!activeTabConfig.value?.stats
})

const currentObjectiveTextMode = computed<'single' | 'average'>(() => {
  return activeTabConfig.value?.objectiveTextMode || 'average'
})

const popoverStats = computed<JunglePathingStats>(() => {
  if (activeTabConfig.value?.stats) {
    return activeTabConfig.value.stats
  }

  return displayStats.value
})

const setActiveTab = (key: string) => {
  blockAutoClose()
  popoverShow.value = true
  activeTab.value = key
  emits('tabChange', key)

  nextTick(() => {
    updateMaxPopoverSize()
  })
}

const miniMapPoints = computed(() => {
  return displayStats.value.gankPositions.map((pt) => ({
    ...mapToImagePosition(pt.x, pt.y, MINI_SIZE, MINI_SIZE, 11),
    lane: pt.lane
  }))
})

const largeMapPoints = computed(() => {
  return popoverStats.value.gankPositions.map((pt) => ({
    ...mapToImagePosition(pt.x, pt.y, LARGE_SIZE, LARGE_SIZE, 11),
    lane: pt.lane
  }))
})

const earlyGankMapPoints = computed(() => {
  const eg = popoverStats.value.earlyGank
  return [
    ...eg.level3KillPositions.map((pt) => ({
      ...mapToImagePosition(pt.x, pt.y, CAMP_MAP_SIZE, CAMP_MAP_SIZE, 11),
      lane: pt.lane,
      level: 3 as const
    })),
    ...eg.level4KillPositions.map((pt) => ({
      ...mapToImagePosition(pt.x, pt.y, CAMP_MAP_SIZE, CAMP_MAP_SIZE, 11),
      lane: pt.lane,
      level: 4 as const
    }))
  ]
})

type MapPreferenceKind = 'top' | 'mid' | 'bot' | 'topMid' | 'midBot' | 'balanced'

interface MapPreference {
  kind: MapPreferenceKind
  pct: number | null
}

function resolveMapPreference(stats: JunglePathingStats): MapPreference {
  const topShare = stats.avgTopZonePercentage
  const midShare = stats.avgMidZonePercentage
  const botShare = stats.avgBotZonePercentage
  const topMidShare = topShare + midShare
  const midBotShare = midShare + botShare

  if (midBotShare >= 0.7 && topShare <= 0.28) {
    return { kind: 'midBot', pct: Math.round(midBotShare * 100) }
  }
  if (topMidShare >= 0.7 && botShare <= 0.28) {
    return { kind: 'topMid', pct: Math.round(topMidShare * 100) }
  }

  const ranked = [
    { kind: 'top' as const, share: topShare },
    { kind: 'mid' as const, share: midShare },
    { kind: 'bot' as const, share: botShare }
  ].sort((a, b) => b.share - a.share)

  if (ranked[0].share >= 0.4 && ranked[0].share - ranked[1].share >= 0.08) {
    return { kind: ranked[0].kind, pct: Math.round(ranked[0].share * 100) }
  }

  return { kind: 'balanced', pct: null }
}

function mapPreferenceText(pref: MapPreference, short = false): string {
  switch (pref.kind) {
    case 'top':
      return t('JunglePathing.topsidePref')
    case 'mid':
      return t('JunglePathing.midPref')
    case 'bot':
      return t('JunglePathing.botsidePref')
    case 'topMid':
      return t('JunglePathing.topMidPref')
    case 'midBot':
      return t('JunglePathing.midBotPref')
    default:
      return short ? t('JunglePathing.balancedShort') : t('JunglePathing.balanced')
  }
}

function mapPreferenceColor(pref: MapPreference): string {
  switch (pref.kind) {
    case 'top':
    case 'topMid':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'mid':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'bot':
    case 'midBot':
      return 'text-blue-600 dark:text-blue-400'
    default:
      return 'text-black/70 dark:text-white/70'
  }
}

function topsideTextShort(stats: JunglePathingStats) {
  return mapPreferenceText(resolveMapPreference(stats), true)
}

function topsideTextWithPct(stats: JunglePathingStats) {
  const pref = resolveMapPreference(stats)
  const base = mapPreferenceText(pref)
  if (pref.pct === null) return base
  return `${base} ${pref.pct}%`
}

function topsideTextColor(stats: JunglePathingStats) {
  return mapPreferenceColor(resolveMapPreference(stats))
}

function formatWeightSum(value: number): string {
  return Math.round(value).toString()
}

function zoneWeightText(stats: JunglePathingStats) {
  return `${t('JunglePathing.top')}${formatWeightSum(stats.topZoneWeightSum)} ${t('JunglePathing.mid')}${formatWeightSum(stats.midZoneWeightSum)} ${t('JunglePathing.bot')}${formatWeightSum(stats.botZoneWeightSum)}`
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function killLaneText(positions: GankPoint[]): string {
  if (positions.length === 0) return ''
  const counts = { top: 0, mid: 0, bot: 0 }
  for (const pt of positions) counts[pt.lane]++
  const parts: string[] = []
  if (counts.top > 0) parts.push(`${t('JunglePathing.topShort')}${counts.top}`)
  if (counts.mid > 0) parts.push(`${t('JunglePathing.midShort')}${counts.mid}`)
  if (counts.bot > 0) parts.push(`${t('JunglePathing.botShort')}${counts.bot}`)
  return ` (${parts.join(' ')})`
}

const campNames: Record<JungleCamp, () => string> = {
  red: () => t('JunglePathing.campRed'),
  blue: () => t('JunglePathing.campBlue'),
  wolves: () => t('JunglePathing.campWolves'),
  raptors: () => t('JunglePathing.campRaptors')
}

function sumCampCount(camps: Record<JungleCamp, number>) {
  return camps.red + camps.blue + camps.wolves + camps.raptors
}

function firstClearCampParts(
  stats: JunglePathingStats,
  side: 'blue' | 'red'
): { ownText: string; invadeText: string } {
  const camps = stats.firstClearCamp[side]
  const invadeCamps =
    side === 'blue' ? stats.firstClearCamp.blueInvade : stats.firstClearCamp.redInvade
  const games = side === 'blue' ? stats.firstClearCamp.blueGames : stats.firstClearCamp.redGames
  if (games === 0) return { ownText: '—', invadeText: '' }

  const ownStarts = sumCampCount(camps)
  const ownEntries = (Object.keys(camps) as JungleCamp[])
    .filter((c) => camps[c] > 0)
    .sort((a, b) => camps[b] - camps[a])
    .map((c) =>
      t('JunglePathing.campStart', {
        camp: campNames[c](),
        pct: ownStarts > 0 ? Math.round((camps[c] / ownStarts) * 100) : 0
      })
    )
  const ownText =
    ownStarts > 0
      ? `${t('JunglePathing.campOwnStart', { pct: Math.round((ownStarts / games) * 100) })} (${ownEntries.join(', ')})`
      : t('JunglePathing.noData')

  const invadeStarts = sumCampCount(invadeCamps)
  if (invadeStarts <= 0) {
    return { ownText, invadeText: '' }
  }

  const invadeEntries = (Object.keys(invadeCamps) as JungleCamp[])
    .filter((c) => invadeCamps[c] > 0)
    .sort((a, b) => invadeCamps[b] - invadeCamps[a])
    .map((c) =>
      t('JunglePathing.campStart', {
        camp: campNames[c](),
        pct: Math.round((invadeCamps[c] / invadeStarts) * 100)
      })
    )

  const invadeText = `${t('JunglePathing.campInvadeStart', { pct: Math.round((invadeStarts / games) * 100) })} (${invadeEntries.join(', ')})`
  return { ownText, invadeText }
}

function firstClearOwnText(stats: JunglePathingStats, side: 'blue' | 'red') {
  return firstClearCampParts(stats, side).ownText
}

function firstClearInvadeText(stats: JunglePathingStats, side: 'blue' | 'red') {
  return firstClearCampParts(stats, side).invadeText
}

function firstClearCampText(stats: JunglePathingStats, side: 'blue' | 'red'): string {
  const { ownText, invadeText } = firstClearCampParts(stats, side)
  if (!invadeText) return ownText
  return `${ownText} | ${invadeText}`
}

function earlyGankRateByTeam(
  stats: JunglePathingStats,
  side: 'blue' | 'red',
  level: 3 | 4
): number {
  const byTeam = stats.earlyGank.byTeam
  if (side === 'blue') {
    return level === 3 ? byTeam.blueLevel3GankRate : byTeam.blueLevel4GankRate
  }
  return level === 3 ? byTeam.redLevel3GankRate : byTeam.redLevel4GankRate
}

function earlyGankPositionsByTeam(
  stats: JunglePathingStats,
  side: 'blue' | 'red',
  level: 3 | 4
): GankPoint[] {
  const byTeam = stats.earlyGank.byTeam
  if (side === 'blue') {
    return level === 3 ? byTeam.blueLevel3KillPositions : byTeam.blueLevel4KillPositions
  }
  return level === 3 ? byTeam.redLevel3KillPositions : byTeam.redLevel4KillPositions
}

const campMarkerColors: Record<JungleCamp, string> = {
  red: 'rgba(255,60,60,0.5)',
  blue: 'rgba(60,140,255,0.5)',
  wolves: 'rgba(180,180,180,0.5)',
  raptors: 'rgba(200,120,255,0.5)'
}

const blueSideTriangleFill = computed(() => {
  if (currentGameSide === 'blue') {
    return 'rgba(60,140,255,0.2)'
  }
  if (currentGameSide === 'red') {
    return 'rgba(60,140,255,0.04)'
  }
  return 'rgba(60,140,255,0.08)'
})

const redSideTriangleFill = computed(() => {
  if (currentGameSide === 'red') {
    return 'rgba(255,60,60,0.2)'
  }
  if (currentGameSide === 'blue') {
    return 'rgba(255,60,60,0.04)'
  }
  return 'rgba(255,60,60,0.08)'
})

function isHighlightedSide(side: 'blue' | 'red') {
  return currentGameSide === side
}

function sideRowClass(side: 'blue' | 'red') {
  if (!currentGameSide) {
    return ''
  }

  if (isHighlightedSide(side)) {
    return 'rounded-sm bg-amber-500/3 font-semibold text-black dark:bg-amber-300/5 dark:text-white'
  }

  return 'opacity-75'
}

const firstClearDisplaySide = computed<'blue' | 'red'>(() => {
  if (currentGameSide) {
    return currentGameSide
  }

  const fc = popoverStats.value.firstClearCamp
  return fc.blueGames >= fc.redGames ? 'blue' : 'red'
})

const firstClearCampMapPoints = computed(() => {
  const side = firstClearDisplaySide.value
  const ownCampCoords = side === 'blue' ? BLUE_SIDE_CAMPS : RED_SIDE_CAMPS
  const invadeCampCoords = side === 'blue' ? RED_SIDE_CAMPS : BLUE_SIDE_CAMPS
  const ownCamps =
    side === 'blue' ? popoverStats.value.firstClearCamp.blue : popoverStats.value.firstClearCamp.red
  const invadeCamps =
    side === 'blue'
      ? popoverStats.value.firstClearCamp.blueInvade
      : popoverStats.value.firstClearCamp.redInvade
  const ownStarts = sumCampCount(ownCamps)
  const invadeStarts = sumCampCount(invadeCamps)
  const totalStarts = ownStarts + invadeStarts

  const ownPoints = ownCampCoords.map((camp) => {
    const count = ownCamps[camp.camp] || 0
    const pct = totalStarts > 0 ? count / totalStarts : 0
    return {
      ...mapToImagePosition(camp.x, camp.y, CAMP_MAP_SIZE, CAMP_MAP_SIZE, 11),
      kind: 'own' as const,
      camp: camp.camp,
      pct,
      size: 6 + pct * 16,
      opacity: count > 0 ? 1 : 0.2
    }
  })

  const invadePoints = invadeCampCoords
    .map((camp) => {
      const count = invadeCamps[camp.camp] || 0
      const pct = totalStarts > 0 ? count / totalStarts : 0
      return {
        ...mapToImagePosition(camp.x, camp.y, CAMP_MAP_SIZE, CAMP_MAP_SIZE, 11),
        kind: 'invade' as const,
        camp: camp.camp,
        pct,
        size: 6 + pct * 16,
        opacity: count > 0 ? 1 : 0
      }
    })
    .filter((point) => point.opacity > 0)

  return [...ownPoints, ...invadePoints]
})

function firstClearCampPointTitle(kind: 'own' | 'invade', camp: JungleCamp, pct: number) {
  const pctValue = Math.round(pct * 100)
  if (kind === 'invade') {
    return `${campNames[camp]()} · ${t('JunglePathing.campInvadeStart', { pct: pctValue })}`
  }
  return t('JunglePathing.campStart', {
    camp: campNames[camp](),
    pct: pctValue
  })
}

function formatStatsText(stats: JunglePathingStats, label: string): string {
  const mapPref = topsideTextWithPct(stats)
  const weights = zoneWeightText(stats)

  const fcLines: string[] = []
  if (stats.firstClearCamp.blueGames > 0) {
    fcLines.push(`  ${t('JunglePathing.blueTeam')}: ${firstClearCampText(stats, 'blue')}`)
  }
  if (stats.firstClearCamp.redGames > 0) {
    fcLines.push(`  ${t('JunglePathing.redTeam')}: ${firstClearCampText(stats, 'red')}`)
  }

  const obj = stats.objectives
  const objParts: string[] = []
  objParts.push(t('JunglePathing.firstDragonRate', { pct: Math.round(obj.firstDragonRate * 100) }))
  objParts.push(t('JunglePathing.soloDragonRate', { pct: Math.round(obj.soloDragonRate * 100) }))
  objParts.push(
    t('JunglePathing.avgDragons', { count: roundToTenth(obj.avgDragons) }) +
      (obj.avgFirstDragonTime !== null
        ? ` (${t('JunglePathing.firstTime', { time: formatTime(obj.avgFirstDragonTime) })})`
        : '')
  )
  objParts.push(
    t('JunglePathing.avgVoidgrubs', { count: roundToTenth(obj.avgVoidgrubs) }) +
      (obj.avgFirstVoidgrubTime !== null
        ? ` (${t('JunglePathing.firstTime', { time: formatTime(obj.avgFirstVoidgrubTime) })})`
        : '')
  )
  objParts.push(
    t('JunglePathing.avgHeralds', { count: roundToTenth(obj.avgHeralds) }) +
      (obj.avgFirstHeraldTime !== null
        ? ` (${t('JunglePathing.firstTime', { time: formatTime(obj.avgFirstHeraldTime) })})`
        : '')
  )
  objParts.push(
    t('JunglePathing.avgBarons', { count: roundToTenth(obj.avgBarons) }) +
      (obj.avgFirstBaronTime !== null
        ? ` (${t('JunglePathing.firstTime', { time: formatTime(obj.avgFirstBaronTime) })})`
        : '')
  )

  let text = `[${label}] ${stats.gamesAnalyzed}${t('JunglePathing.gamesUnit')}\n`
  text += `  ${t('JunglePathing.mapPref')}: ${mapPref} | ${weights}\n`
  if (fcLines.length > 0) {
    text += `  ${t('JunglePathing.firstClear')}:\n${fcLines.join('\n')}\n`
  }
  text += `  ${t('JunglePathing.objectives')}: ${objParts.join(', ')}\n`
  const egLines: string[] = []
  if (stats.earlyGank.byTeam.blueGames > 0) {
    egLines.push(
      `  ${t('JunglePathing.blueTeam')}: ${t('JunglePathing.level3Gank', { pct: Math.round(earlyGankRateByTeam(stats, 'blue', 3) * 100) })}${killLaneText(earlyGankPositionsByTeam(stats, 'blue', 3))}, ${t('JunglePathing.level4Gank', { pct: Math.round(earlyGankRateByTeam(stats, 'blue', 4) * 100) })}${killLaneText(earlyGankPositionsByTeam(stats, 'blue', 4))}`
    )
  }
  if (stats.earlyGank.byTeam.redGames > 0) {
    egLines.push(
      `  ${t('JunglePathing.redTeam')}: ${t('JunglePathing.level3Gank', { pct: Math.round(earlyGankRateByTeam(stats, 'red', 3) * 100) })}${killLaneText(earlyGankPositionsByTeam(stats, 'red', 3))}, ${t('JunglePathing.level4Gank', { pct: Math.round(earlyGankRateByTeam(stats, 'red', 4) * 100) })}${killLaneText(earlyGankPositionsByTeam(stats, 'red', 4))}`
    )
  }
  if (egLines.length > 0) {
    text += `  ${t('JunglePathing.earlyGank')}:\n${egLines.join('\n')}`
  } else {
    text += `  ${t('JunglePathing.earlyGank')}: ${t('JunglePathing.noData')}`
  }
  return text
}

function formatPlayerText(puuid: string, a: JunglePathingAnalysis): string {
  const summoner = ogs.summoner[puuid]
  const name = summoner ? `${summoner.gameName}#${summoner.tagLine}` : puuid.substring(0, 8)

  const champName = a.currentChampionId ? lcs.gameData.championName(a.currentChampionId) : ''

  const lines: string[] = []
  if (a.currentChampion) {
    const label = champName
      ? `${t('JunglePathing.currentChampion')} ${champName}`
      : t('JunglePathing.currentChampion')
    lines.push(formatStatsText(a.currentChampion, label))
  }
  lines.push(formatStatsText(a.overall, t('JunglePathing.overall')))

  return `${name}\n${lines.join('\n')}`
}

function handleCopyAll() {
  const myPuuid = lcs.summoner.me?.puuid
  if (!myPuuid) return

  // 找到自己所在的队伍
  let myTeam: string | null = null
  for (const [team, players] of Object.entries(ogs.teams)) {
    if (players.includes(myPuuid)) {
      myTeam = team
      break
    }
  }

  const allyJunglers: string[] = []
  const enemyJunglers: string[] = []

  for (const puuid of Object.keys(ogs.jungleAnalysis)) {
    let playerTeam: string | null = null
    for (const [team, players] of Object.entries(ogs.teams)) {
      if (players.includes(puuid)) {
        playerTeam = team
        break
      }
    }

    if (playerTeam === myTeam) {
      allyJunglers.push(puuid)
    } else {
      enemyJunglers.push(puuid)
    }
  }

  const sections: string[] = []

  if (allyJunglers.length > 0) {
    sections.push(`== ${t('JunglePathing.allyJungler')} ==`)
    for (const puuid of allyJunglers) {
      sections.push(formatPlayerText(puuid, ogs.jungleAnalysis[puuid]))
    }
  }

  if (enemyJunglers.length > 0) {
    sections.push(`== ${t('JunglePathing.enemyJungler')} ==`)
    for (const puuid of enemyJunglers) {
      sections.push(formatPlayerText(puuid, ogs.jungleAnalysis[puuid]))
    }
  }

  if (sections.length === 0) return

  const text = sections.join('\n\n')
  navigator.clipboard.writeText(text).then(() => {
    message.success(t('JunglePathing.copied'))
  })
}
</script>
