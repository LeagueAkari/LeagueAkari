<template>
  <div class="box-border flex h-full flex-col gap-3 p-4">
    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-3">
      <div class="text-sm font-bold text-black/60 dark:text-white/60">预设发送 (Demo)</div>
      <div class="flex items-center gap-3 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-black/50 dark:text-white/50">Native Input:</span>
          <NTag size="small" :type="nativeInputTagType" round>
            {{ nativeInputTagLabel }}
          </NTag>
          <NSelect
            v-model:value="nativeInputState"
            :options="nativeInputOptions"
            size="tiny"
            style="width: 140px"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-black/50 dark:text-white/50">阶段:</span>
          <NSelect
            v-model:value="gamePhase"
            :options="phaseOptions"
            size="tiny"
            style="width: 130px"
          />
        </div>
      </div>
    </div>

    <NScrollbar class="min-h-0 flex-1">
      <NCard size="small" content-style="padding: 12px 16px 16px">
        <NTabs
          v-model:value="activePreset"
          type="line"
          size="medium"
          animated
          justify-content="start"
        >
          <NTabPane
            v-for="preset of presets"
            :key="preset.id"
            :name="preset.id"
            :tab="preset.label"
          >
            <div class="flex flex-col gap-3 pt-2">
              <div class="text-xs leading-relaxed text-black/60 dark:text-white/70">
                {{ preset.description }}
              </div>

              <div class="pt-1">
                <ControlItem
                  v-for="target of targets"
                  :key="target.id"
                  :label-width="160"
                  align="center"
                >
                  <template #label>
                    <div class="flex items-center gap-1.5">
                      <NIcon><component :is="target.icon" /></NIcon>
                      <span>{{ target.label }}</span>
                    </div>
                  </template>
                  <template #labelDescription>
                    <span class="text-[11px]">{{ target.description }}</span>
                  </template>

                  <div class="flex items-center gap-2">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs text-black/60 dark:text-white/60">快捷键</span>
                      <ShortcutSelector
                        v-model:shortcut-id="shortcuts[preset.id][target.id]"
                        :target-id="`demo:${preset.id}:${target.id}`"
                      />
                    </div>
                    <NDivider vertical />
                    <NPopover :disabled="canSendToChat" trigger="hover">
                      <template #trigger>
                        <NButton
                          size="small"
                          :type="target.buttonType"
                          :disabled="!canSendToChat"
                          @click="onSendToChat(preset, target)"
                        >
                          <template #icon>
                            <NIcon><SendIcon /></NIcon>
                          </template>
                          发送在聊天
                        </NButton>
                      </template>
                      仅可在英雄选择阶段使用
                    </NPopover>
                    <NPopover trigger="hover">
                      <template #trigger>
                        <NButton size="small" secondary @click="onDryRun(preset, target)">
                          <template #icon>
                            <NIcon><DryRunIcon /></NIcon>
                          </template>
                          试运行
                        </NButton>
                      </template>
                      生成发送内容并在下方预览, 不会写入客户端
                    </NPopover>
                  </div>
                </ControlItem>
              </div>

              <!-- Team picker: 仅对支持队伍勾选的预设可用 -->
              <div v-if="preset.hasTeamSelection && totalCount > 0" class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <div class="text-xs font-semibold text-black/70 dark:text-white/70">
                    发送的目标 ({{ selectedPlayerCount(preset.id) }} / {{ totalCount }})
                  </div>
                  <div class="flex items-center gap-1">
                    <NButton size="tiny" quaternary @click="setAllSelected(preset.id, true)">
                      全选
                    </NButton>
                    <NButton size="tiny" quaternary @click="setAllSelected(preset.id, false)">
                      清空
                    </NButton>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div
                    v-for="team of teamsWithPlayers"
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
                        <span
                          v-if="team.secondaryLabel"
                          class="font-normal text-black/45 dark:text-white/45"
                        >
                          · {{ team.secondaryLabel }}
                        </span>
                        <span class="font-normal text-black/45 dark:text-white/45">
                          ({{ selectedInTeam(preset.id, team.id) }}/{{ team.players.length }})
                        </span>
                      </div>
                      <NCheckbox
                        size="small"
                        :checked="isTeamAllSelected(preset.id, team.id)"
                        :indeterminate="isTeamIndeterminate(preset.id, team.id)"
                        @update:checked="(v) => setTeamSelected(preset.id, team.id, v)"
                      >
                        <span class="text-[11px] text-black/55 dark:text-white/55">全选</span>
                      </NCheckbox>
                    </div>
                    <div class="flex flex-col gap-1">
                      <div
                        v-for="p of team.players"
                        :key="p.puuid"
                        class="flex cursor-pointer items-center gap-2 rounded px-1 py-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        @click="
                          setPlayerSelected(
                            preset.id,
                            p.puuid,
                            !isPlayerSelected(preset.id, p.puuid)
                          )
                        "
                      >
                        <span @click.stop>
                          <NCheckbox
                            size="small"
                            :checked="isPlayerSelected(preset.id, p.puuid)"
                            @update:checked="(v) => setPlayerSelected(preset.id, p.puuid, v)"
                          />
                        </span>
                        <ChampionIcon class="size-6 shrink-0" round :champion-id="p.championId" />
                        <div
                          class="flex min-w-0 flex-1 items-baseline gap-0.5 text-[12px] leading-none"
                        >
                          <span class="truncate font-medium text-black/85 dark:text-white/85">
                            {{ p.gameName }}
                          </span>
                          <span
                            v-if="p.tagLine"
                            class="shrink-0 text-[11px] text-black/50 dark:text-white/50"
                          >
                            #{{ p.tagLine }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Premade picker: 仅对开黑预设可用, 只展示开黑小队, 单排玩家不参与 -->
              <div v-if="preset.id === 'premade' && totalCount > 0" class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <div class="text-xs font-semibold text-black/70 dark:text-white/70">
                    选中的小队 ({{ selectedPremadeGroupCount }} / {{ totalPremadeGroupCount }})
                  </div>
                  <div class="flex items-center gap-1">
                    <NButton
                      size="tiny"
                      quaternary
                      :disabled="totalPremadeGroupCount === 0"
                      @click="setAllPremadeSelected(true)"
                    >
                      全选
                    </NButton>
                    <NButton
                      size="tiny"
                      quaternary
                      :disabled="totalPremadeGroupCount === 0"
                      @click="setAllPremadeSelected(false)"
                    >
                      清空
                    </NButton>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div
                    v-for="tv of premadeView"
                    :key="tv.team.id"
                    class="rounded border border-black/10 bg-black/3 p-2 dark:border-white/10 dark:bg-white/3"
                  >
                    <div class="mb-1.5 flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5 text-xs font-semibold">
                        <div
                          v-if="tv.team.indicatorColorClass"
                          :class="[
                            'size-2.5 shrink-0 rounded-full border border-white/20',
                            tv.team.indicatorColorClass
                          ]"
                        />
                        <span>{{ tv.team.primaryLabel }}</span>
                        <span
                          v-if="tv.team.secondaryLabel"
                          class="font-normal text-black/45 dark:text-white/45"
                        >
                          · {{ tv.team.secondaryLabel }}
                        </span>
                        <span class="font-normal text-black/45 dark:text-white/45">
                          ({{ tv.groups.length }} 组开黑)
                        </span>
                      </div>
                      <NCheckbox
                        v-if="tv.groups.length > 0"
                        size="small"
                        :checked="isPremadeTeamAllSelected(tv.team.id)"
                        :indeterminate="isPremadeTeamIndeterminate(tv.team.id)"
                        @update:checked="(v) => setPremadeTeamSelected(tv.team.id, v)"
                      >
                        <span class="text-[11px] text-black/55 dark:text-white/55">全选</span>
                      </NCheckbox>
                    </div>

                    <div
                      v-if="tv.groups.length === 0"
                      class="py-2 text-center text-[11px] text-black/40 dark:text-white/35"
                    >
                      无开黑组合
                    </div>
                    <div v-else class="flex flex-col gap-1.5">
                      <div
                        v-for="bucket of tv.groups"
                        :key="bucket.key"
                        class="flex cursor-pointer flex-col gap-1 rounded border px-1.5 py-1.5 transition-colors hover:bg-black/4 dark:hover:bg-white/4"
                        :style="{
                          borderColor: premadeColors[bucket.groupLetter!]?.foregroundColor + '55'
                        }"
                        @click.stop="
                          setPremadeBucketSelected(
                            bucket.groupIndex,
                            !isPremadeBucketSelected(bucket.groupIndex)
                          )
                        "
                      >
                        <div class="flex items-center gap-2" @click.stop>
                          <NCheckbox
                            size="small"
                            :checked="isPremadeBucketSelected(bucket.groupIndex)"
                            @update:checked="(v) => setPremadeBucketSelected(bucket.groupIndex, v)"
                          />
                          <div
                            class="rounded-sm px-1 py-0.5 text-[10px] leading-3 font-semibold"
                            :style="{
                              backgroundColor: premadeColors[bucket.groupLetter!]?.foregroundColor,
                              color: premadeColors[bucket.groupLetter!]?.color
                            }"
                          >
                            {{ bucket.players.length }} 黑
                          </div>
                        </div>
                        <div class="flex flex-col gap-0.5 pl-6">
                          <div
                            v-for="p of bucket.players"
                            :key="p.puuid"
                            class="flex items-center gap-2"
                          >
                            <ChampionIcon
                              class="size-5 shrink-0"
                              round
                              :champion-id="p.championId"
                            />
                            <div
                              class="flex min-w-0 flex-1 items-baseline gap-0.5 text-[12px] leading-none"
                            >
                              <span class="truncate font-medium text-black/85 dark:text-white/85">
                                {{ p.gameName }}
                              </span>
                              <span
                                v-if="p.tagLine"
                                class="shrink-0 text-[11px] text-black/50 dark:text-white/50"
                              >
                                #{{ p.tagLine }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <NCollapseTransition
                :show="!!previewedLines && previewedLines.presetId === preset.id"
              >
                <div
                  v-if="previewedLines && previewedLines.presetId === preset.id"
                  class="rounded border border-black/10 bg-black/5 p-3 text-xs dark:border-white/10 dark:bg-white/5"
                >
                  <div class="mb-1.5 flex items-center justify-between">
                    <div class="font-semibold opacity-80">
                      试运行 ({{ previewedLines.preset }} → {{ previewedLines.target }})
                    </div>
                    <NButton size="tiny" quaternary @click="previewedLines = null">关闭</NButton>
                  </div>
                  <div class="flex flex-col gap-1 font-mono">
                    <div
                      v-for="(line, idx) of previewedLines.lines"
                      :key="idx"
                      class="flex items-baseline gap-2"
                    >
                      <span class="w-5 shrink-0 text-right tabular-nums opacity-40">
                        {{ idx + 1 }}
                      </span>
                      <span class="flex-1">{{ line }}</span>
                    </div>
                  </div>
                </div>
              </NCollapseTransition>
            </div>
          </NTabPane>
        </NTabs>

        <div
          class="mt-3 flex flex-col gap-1 border-t border-black/5 pt-3 text-[11px] leading-relaxed text-black/45 dark:border-white/5 dark:text-white/35"
        >
          <div
            v-if="nativeInputState !== 'available'"
            class="flex items-baseline gap-1.5 text-amber-700/80 dark:text-amber-300/70"
          >
            <span class="shrink-0 select-none">•</span>
            <span class="flex-1">
              当前「快捷键」不可用,
              {{
                nativeInputState === 'unsupported-platform'
                  ? '当前平台不支持'
                  : '请以管理员权限启动'
              }}。
            </span>
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="shrink-0 select-none">•</span>
            <span class="flex-1">
              如果设置了「快捷键」, 则可在英雄选择阶段发送在聊天中,
              或在游戏进行阶段且位于前台时以模拟键盘输入的方式发送在游戏中。如果「快捷键」不可用,
              将无法在游戏中发送。
            </span>
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="shrink-0 select-none">•</span>
            <span class="flex-1">「发送在聊天」仅可在英雄选择阶段使用。</span>
          </div>
        </div>
      </NCard>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import {
  PREMADE_TEAMS,
  PREMADE_TEAM_COLORS,
  PREMADE_TEAM_COLORS_LIGHT
} from '@renderer-shared/components/ongoing-game-panel/constants'
import { getTeamIndicatorColorClass } from '@renderer-shared/components/ongoing-game-panel/utils/theme'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { DocumentText24Regular as DryRunIcon, Send24Filled as SendIcon } from '@vicons/fluent'
import {
  EarthOutline as AllIcon,
  ShieldHalf as EnemyIcon,
  People as FriendlyIcon
} from '@vicons/ionicons5'
import {
  NButton,
  NCard,
  NCheckbox,
  NCollapseTransition,
  NDivider,
  NIcon,
  NPopover,
  NScrollbar,
  NSelect,
  NTabPane,
  NTabs,
  NTag,
  useMessage
} from 'naive-ui'
import i18next from 'i18next'
import { useTranslation } from 'i18next-vue'
import { computed, reactive, ref, shallowRef, type Component } from 'vue'

import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'

type GamePhase = 'none' | 'champ-select' | 'in-game'

interface PresetTarget {
  id: 'enemy' | 'friendly' | 'all'
  label: string
  description: string
  buttonType: 'error' | 'primary' | 'default'
  icon: Component
}

type PresetId = 'rating' | 'jungle' | 'premade'
type PlayerSelectionPresetId = Extract<PresetId, 'rating' | 'jungle'>

interface Preset {
  id: PresetId
  label: string
  description: string
  sample: Record<PresetTarget['id'], string[]>
  hasTeamSelection?: boolean
}

const nativeInputState = ref<'available' | 'unsupported-admin' | 'unsupported-platform'>(
  'available'
)
const nativeInputOptions = [
  { label: '可用', value: 'available' },
  { label: '需要管理员', value: 'unsupported-admin' },
  { label: '平台不支持', value: 'unsupported-platform' }
]
const nativeInputTagType = computed<'success' | 'warning' | 'error'>(() => {
  switch (nativeInputState.value) {
    case 'available':
      return 'success'
    case 'unsupported-admin':
      return 'warning'
    case 'unsupported-platform':
      return 'error'
  }
})
const nativeInputTagLabel = computed(() => {
  switch (nativeInputState.value) {
    case 'available':
      return '可用'
    case 'unsupported-admin':
      return '不可用 (管理员)'
    case 'unsupported-platform':
      return '不可用 (平台)'
  }
})
const gamePhase = ref<GamePhase>('champ-select')
const activePreset = ref('rating')

const phaseOptions = [
  { label: '无', value: 'none' },
  { label: '英雄选择', value: 'champ-select' },
  { label: '游戏内', value: 'in-game' }
]

const canSendToChat = computed(() => gamePhase.value === 'champ-select')

const message = useMessage()
const { t } = useTranslation()

const targets: PresetTarget[] = [
  {
    id: 'friendly',
    label: '发送我方',
    description: '发送的对象是我方已选成员',
    buttonType: 'default',
    icon: FriendlyIcon
  },
  {
    id: 'enemy',
    label: '发送敌方',
    description: '发送的对象是敌方已选成员',
    buttonType: 'default',
    icon: EnemyIcon
  },
  {
    id: 'all',
    label: '发送全体',
    description: '发送的对象是双方已选成员',
    buttonType: 'default',
    icon: AllIcon
  }
]

const presets: Preset[] = [
  {
    id: 'rating',
    label: '表现评分',
    description: '统计每位玩家近期表现，输出 KDA/胜率/评分综合数据。',
    hasTeamSelection: true,
    sample: {
      friendly: [
        '[我方评分] TOP Darius 6.8 | 50场 53% | KDA 2.6',
        '[我方评分] JUG Graves 7.0 | 70场 55% | KDA 3.1',
        '[我方评分] MID Yasuo 6.2 | 40场 50% | KDA 2.3',
        '[我方评分] BOT Caitlyn 6.4 | 55场 52% | KDA 2.7',
        '[我方评分] SUP Thresh 5.9 | 35场 48% | KDA 2.0'
      ],
      enemy: [
        '[敌方评分] TOP Garen 5.8 | 30场 47% | KDA 2.1',
        '[敌方评分] JUG LeeSin 7.2 | 80场 56% | KDA 3.4',
        '[敌方评分] MID Ahri 6.5 | 45场 51% | KDA 2.9',
        '[敌方评分] BOT Jinx 6.1 | 60场 49% | KDA 2.4',
        '[敌方评分] SUP Lulu 5.4 | 25场 44% | KDA 1.8'
      ],
      all: [
        '[我方] TOP Darius 6.8 | JUG Graves 7.0 | MID Yasuo 6.2 | BOT Caitlyn 6.4 | SUP Thresh 5.9',
        '[敌方] TOP Garen 5.8 | JUG LeeSin 7.2 | MID Ahri 6.5 | BOT Jinx 6.1 | SUP Lulu 5.4',
        '[均分] 我方 6.46 | 敌方 6.20'
      ]
    }
  },
  {
    id: 'jungle',
    label: '打野偏好',
    description: '展示打野选手的偏好路径、入侵倾向与开野侧。',
    hasTeamSelection: true,
    sample: {
      friendly: [
        '[我方打野] Graves → 偏好下半野区 (58%)',
        '[我方打野] 常用路线: 蓝→红→Gank Bot',
        '[我方打野] 入侵倾向: 中 (近期 18% 对局入侵)'
      ],
      enemy: [
        '[敌方打野] LeeSin → 偏好上半野区 (62%)',
        '[敌方打野] 常用路线: 红→蓝→Gank Top',
        '[敌方打野] 入侵倾向: 高 (近期 35% 对局入侵)'
      ],
      all: [
        '[我方打野] Graves 下半野区 58% | 入侵中',
        '[敌方打野] LeeSin 上半野区 62% | 入侵高',
        '[对位] 4 分钟上路高概率, 红 buff 30s 可反野'
      ]
    }
  },
  {
    id: 'premade',
    label: '组队状况',
    description: '识别队伍内开黑组合，按组别展示成员。',
    sample: {
      friendly: [
        '[我方开黑] 检测到 2 组开黑',
        '[我方开黑] 组 A (2 人): TOP / JUG',
        '[我方开黑] 组 B (2 人): BOT / SUP',
        '[我方开黑] 单排: MID'
      ],
      enemy: [
        '[敌方开黑] 检测到 2 组开黑',
        '[敌方开黑] 组 A (3 人): TOP / JUG / MID',
        '[敌方开黑] 组 B (2 人): BOT / SUP'
      ],
      all: [
        '[我方] 2 组开黑 (A: TOP+JUG, B: BOT+SUP) | 1 单排',
        '[敌方] 2 组开黑 (A: TOP+JUG+MID, B: BOT+SUP) | 0 单排',
        '[评估] 敌方协同度更高 (含 3 人组)'
      ]
    }
  }
]

// 每个 preset × target 一份独立的 shortcutId
const shortcuts = reactive<Record<string, Record<PresetTarget['id'], string | null>>>(
  Object.fromEntries(
    presets.map((p) => [p.id, { enemy: null, friendly: null, all: null }])
  ) as Record<string, Record<PresetTarget['id'], string | null>>
)

const previewedLines = shallowRef<{
  presetId: string
  preset: string
  target: string
  lines: string[]
} | null>(null)

// --- 队伍小设置：勾选要发送的玩家 ---
interface DemoPlayer {
  puuid: string
  championId: number
  gameName: string
  tagLine: string
  /** 1-based premade group id within the same team; undefined = 单排 */
  premadeGroup?: number
}
interface DemoTeam {
  id: string
  label: string
  primaryLabel: string
  secondaryLabel?: string
  indicatorColorClass: string | null
  players: DemoPlayer[]
}

const ogs = useOngoingGameStore()
const lcs = useLeagueClientStore()
const as = useAppCommonStore()
const ig = useInstance(InGameSendRenderer)
const igs = useInGameSendStore()

function getTeamSortValue(teamId: string) {
  if (teamId === 'TEAM-100') return 100
  if (teamId === 'TEAM-200') return 200

  const cherrySubteam = teamId.match(/^CHERRY-(\d+)$/)
  if (cherrySubteam) {
    return 1000 + Number(cherrySubteam[1])
  }

  return Number.MAX_SAFE_INTEGER
}

function compareTeamIds(teamIdA: string, teamIdB: string, selfTeamId: string | null) {
  if (selfTeamId) {
    if (teamIdA === selfTeamId) return -1
    if (teamIdB === selfTeamId) return 1
  }

  const sortA = getTeamSortValue(teamIdA)
  const sortB = getTeamSortValue(teamIdB)

  if (sortA !== sortB) {
    return sortA - sortB
  }

  return teamIdA.localeCompare(teamIdB)
}

function getTeamName(teamId: string) {
  const commonTeamKey = `teams.${teamId}`
  if (i18next.exists(commonTeamKey, { ns: 'common' })) {
    return t(commonTeamKey, { ns: 'common' })
  }

  return teamId
}

function getTeamLabels(teamId: string, selfTeamId: string | null) {
  const teamName = getTeamName(teamId)

  if (!selfTeamId) {
    return {
      label: teamName,
      primaryLabel: teamName
    }
  }

  const primaryLabel = teamId === selfTeamId ? '我方' : '敌方'

  return {
    label: `${primaryLabel} · ${teamName}`,
    primaryLabel,
    secondaryLabel: teamName
  }
}

const teams = computed<DemoTeam[]>(() => {
  const selfPuuid = lcs.summoner.me?.puuid
  const ogsTeams = ogs.teams
  const selfTeamEntry = selfPuuid
    ? Object.entries(ogsTeams).find(([, puuids]) => puuids.includes(selfPuuid))
    : null
  const selfTeamId = selfTeamEntry?.[0] ?? null

  const buildPlayer = (puuid: string): DemoPlayer => {
    const summoner = ogs.summoner[puuid]
    const championId = ogs.championSelections[puuid] ?? 0
    const premadeGroup = ogs.mergedPremadeTeamMap[puuid] || undefined
    return {
      puuid,
      championId,
      gameName: summoner?.gameName || summoner?.displayName || puuid.slice(0, 6),
      tagLine: summoner?.tagLine || '',
      premadeGroup
    }
  }

  return Object.entries(ogsTeams)
    .toSorted(([teamIdA], [teamIdB]) => {
      return compareTeamIds(teamIdA, teamIdB, selfTeamId)
    })
    .map(([teamId, puuids]) => {
      const labels = getTeamLabels(teamId, selfTeamId)

      return {
        id: teamId,
        ...labels,
        indicatorColorClass: getTeamIndicatorColorClass(teamId),
        players: puuids.map(buildPlayer)
      }
    })
})

const teamsWithPlayers = computed(() => teams.value.filter((team) => team.players.length > 0))

const allPuuids = computed(() =>
  teamsWithPlayers.value.flatMap((t) => t.players.map((p) => p.puuid))
)
const totalCount = computed(() => allPuuids.value.length)

const selectedPlayerPuuidSets = computed<Record<PlayerSelectionPresetId, Set<string>>>(() => ({
  rating: new Set(igs.state.ratingPuuids),
  jungle: new Set(igs.state.junglePuuids)
}))

function isPlayerSelectionPresetId(presetId: PresetId): presetId is PlayerSelectionPresetId {
  return presetId === 'rating' || presetId === 'jungle'
}

function selectedPlayerPuuidSet(presetId: PresetId) {
  return isPlayerSelectionPresetId(presetId)
    ? selectedPlayerPuuidSets.value[presetId]
    : new Set<string>()
}

function normalizeSelectedPuuids(puuids: Iterable<string>) {
  const selected = new Set(puuids)
  return allPuuids.value.filter((puuid) => selected.has(puuid))
}

function commitSelectedPuuids(presetId: PresetId, puuids: Iterable<string>) {
  if (!isPlayerSelectionPresetId(presetId)) {
    return
  }

  const normalized = normalizeSelectedPuuids(puuids)

  if (presetId === 'jungle') {
    void ig.setJunglePuuids(normalized)
  } else {
    void ig.setRatingPuuids(normalized)
  }
}

function selectedPlayerCount(presetId: PresetId) {
  const selected = selectedPlayerPuuidSet(presetId)
  return allPuuids.value.reduce((acc, puuid) => acc + (selected.has(puuid) ? 1 : 0), 0)
}

function isPlayerSelected(presetId: PresetId, puuid: string) {
  return selectedPlayerPuuidSet(presetId).has(puuid)
}

function setPlayerSelected(presetId: PresetId, puuid: string, selected: boolean) {
  const next = new Set(selectedPlayerPuuidSet(presetId))

  if (selected) {
    next.add(puuid)
  } else {
    next.delete(puuid)
  }

  commitSelectedPuuids(presetId, next)
}

function teamOf(teamId: string) {
  return teams.value.find((t) => t.id === teamId)
}

function selectedInTeam(presetId: PresetId, teamId: string) {
  const team = teamOf(teamId)
  if (!team) return 0
  const selected = selectedPlayerPuuidSet(presetId)
  return team.players.reduce((acc, p) => acc + (selected.has(p.puuid) ? 1 : 0), 0)
}

function isTeamAllSelected(presetId: PresetId, teamId: string) {
  const team = teamOf(teamId)
  if (!team || team.players.length === 0) {
    return false
  }

  const selected = selectedPlayerPuuidSet(presetId)
  return team.players.every((p) => selected.has(p.puuid))
}

function isTeamIndeterminate(presetId: PresetId, teamId: string) {
  const team = teamOf(teamId)
  if (!team) return false
  const n = selectedInTeam(presetId, teamId)
  return n > 0 && n < team.players.length
}

function setTeamSelected(presetId: PresetId, teamId: string, selected: boolean) {
  const team = teamOf(teamId)
  if (!team) return

  const next = new Set(selectedPlayerPuuidSet(presetId))
  for (const p of team.players) {
    if (selected) {
      next.add(p.puuid)
    } else {
      next.delete(p.puuid)
    }
  }

  commitSelectedPuuids(presetId, next)
}

function setAllSelected(presetId: PresetId, selected: boolean) {
  commitSelectedPuuids(presetId, selected ? allPuuids.value : [])
}

// --- 开黑小队：按开黑组为单位的勾选, 单排不参与发送, 颜色复用 ongoing-game 的 premade 配色 ---
interface PremadeBucket {
  /** 唯一 key, 用于勾选集合 */
  key: string
  /** ongoing-game 生成的 1-based 开黑组编号 */
  groupIndex: number
  /** 该队内的开黑字母编号 (A/B/…) */
  groupLetter: string
  players: DemoPlayer[]
}
interface PremadeTeamView {
  team: DemoTeam
  groups: PremadeBucket[]
}

const premadeColors = computed(() => {
  return as.colorTheme === 'dark' ? PREMADE_TEAM_COLORS : PREMADE_TEAM_COLORS_LIGHT
})

const premadeView = computed<PremadeTeamView[]>(() => {
  return teamsWithPlayers.value.map((team) => {
    const byGroup = new Map<number, DemoPlayer[]>()
    for (const p of team.players) {
      if (p.premadeGroup == null) continue
      const arr = byGroup.get(p.premadeGroup) ?? []
      arr.push(p)
      byGroup.set(p.premadeGroup, arr)
    }
    // 仅成员 ≥ 2 才算开黑组, 否则忽略 (单排不展示)
    const groups: PremadeBucket[] = []
    for (const [gid, players] of [...byGroup.entries()].sort((a, b) => a[0] - b[0])) {
      if (players.length < 2) continue
      groups.push({
        key: `${team.id}:g:${gid}`,
        groupIndex: gid,
        groupLetter: PREMADE_TEAMS[gid - 1],
        players
      })
    }
    return { team, groups }
  })
})

const allPremadeGroupIndices = computed(() =>
  premadeView.value.flatMap((tv) => tv.groups.map((b) => b.groupIndex))
)
const totalPremadeGroupCount = computed(() => allPremadeGroupIndices.value.length)

const selectedPremadeIndexSet = computed(() => new Set(igs.state.premadeIndices))

function normalizeSelectedPremadeIndices(indices: Iterable<number>) {
  const selected = new Set(indices)
  return allPremadeGroupIndices.value.filter((index) => selected.has(index))
}

function commitSelectedPremadeIndices(indices: Iterable<number>) {
  void ig.setPremadeIndices(normalizeSelectedPremadeIndices(indices))
}

const selectedPremadeGroupCount = computed(() => {
  const selected = selectedPremadeIndexSet.value
  return allPremadeGroupIndices.value.reduce((acc, index) => acc + (selected.has(index) ? 1 : 0), 0)
})

function isPremadeBucketSelected(groupIndex: number) {
  return selectedPremadeIndexSet.value.has(groupIndex)
}

function setPremadeBucketSelected(groupIndex: number, selected: boolean) {
  const next = new Set(selectedPremadeIndexSet.value)

  if (selected) {
    next.add(groupIndex)
  } else {
    next.delete(groupIndex)
  }

  commitSelectedPremadeIndices(next)
}

function setAllPremadeSelected(selected: boolean) {
  commitSelectedPremadeIndices(selected ? allPremadeGroupIndices.value : [])
}

function premadeIndicesOfTeam(teamId: string) {
  const tv = premadeView.value.find((t) => t.team.id === teamId)
  return tv ? tv.groups.map((g) => g.groupIndex) : []
}

function isPremadeTeamAllSelected(teamId: string) {
  const indices = premadeIndicesOfTeam(teamId)
  const selected = selectedPremadeIndexSet.value
  return indices.length > 0 && indices.every((index) => selected.has(index))
}

function isPremadeTeamIndeterminate(teamId: string) {
  const indices = premadeIndicesOfTeam(teamId)
  const selected = selectedPremadeIndexSet.value
  const n = indices.reduce((acc, index) => acc + (selected.has(index) ? 1 : 0), 0)
  return n > 0 && n < indices.length
}

function setPremadeTeamSelected(teamId: string, selected: boolean) {
  const next = new Set(selectedPremadeIndexSet.value)
  for (const index of premadeIndicesOfTeam(teamId)) {
    if (selected) {
      next.add(index)
    } else {
      next.delete(index)
    }
  }
  commitSelectedPremadeIndices(next)
}

function premadeSelectionSummaryLine() {
  if (selectedPremadeGroupCount.value === 0) return '[选中: 无]'
  const parts: string[] = []
  for (const tv of premadeView.value) {
    const groupParts: string[] = []
    for (const g of tv.groups) {
      if (isPremadeBucketSelected(g.groupIndex)) {
        groupParts.push(`${g.groupLetter}(${g.players.length})`)
      }
    }
    if (groupParts.length) {
      parts.push(`${tv.team.label} 组 ${groupParts.join('+')}`)
    }
  }
  return `[选中: ${parts.join(' | ')}]`
}

function selectionSummaryLine(presetId: PresetId) {
  if (selectedPlayerCount(presetId) === 0) return '[选中: 无]'
  const parts = teamsWithPlayers.value.map(
    (team) => `${team.label} ${selectedInTeam(presetId, team.id)}`
  )
  return `[选中: ${parts.join(' / ')}]`
}

function onSendToChat(preset: Preset, target: PresetTarget) {
  // 真实环境会直接将 preset 文本写入选人聊天框，不在此 UI 显示
  message.success(`已发送在聊天 (${preset.label} → ${target.label})`)
}

function onDryRun(preset: Preset, target: PresetTarget) {
  const base = preset.sample[target.id]
  let lines: string[]
  if (preset.id === 'premade') {
    lines = [premadeSelectionSummaryLine(), ...base]
  } else if (preset.hasTeamSelection) {
    lines = [selectionSummaryLine(preset.id), ...base]
  } else {
    lines = base
  }
  previewedLines.value = {
    presetId: preset.id,
    preset: preset.label,
    target: target.label,
    lines
  }
}
</script>
