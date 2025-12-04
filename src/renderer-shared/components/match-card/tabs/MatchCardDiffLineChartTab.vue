<template>
  <div v-if="frames.length > 0" class="h-142 w-full flex gap-4 flex-1">
    <!-- 图表区域 -->
    <div class="flex-1 min-w-0">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <!-- 右侧控制面板 -->
    <NScrollbar class="!w-52">
      <div class="flex flex-col gap-3">
        <!-- 数据类型选择器 -->
        <div class="flex flex-col gap-2">
          <div class="dark:text-white/60 text-black/60 text-xs font-semibold">数据类型</div>
          <NRadioGroup v-model:value="selectedMetric">
            <div class="flex flex-col gap-1.5">
              <NRadio value="gold" label="金币" />
              <NRadio value="cs" label="补刀" />
              <NRadio value="exp" label="经验" />
            </div>
          </NRadioGroup>
        </div>

        <!-- 分隔线 -->
        <div class="h-px dark:bg-white/10 bg-black/10"></div>

        <!-- 队伍平均选择 -->
        <div class="flex flex-col gap-2">
          <div class="dark:text-white/60 text-black/60 text-xs font-semibold">队伍平均</div>
          <NCheckboxGroup v-model:value="selectedTeams">
            <div class="flex flex-col gap-1.5">
              <NCheckbox
                v-for="team in teamOptions"
                :key="team.value"
                :value="team.value"
                :label="team.label"
              />
            </div>
          </NCheckboxGroup>
        </div>

        <!-- 分隔线 -->
        <div class="h-px dark:bg-white/10 bg-black/10"></div>

        <!-- 玩家选择 -->
        <div class="flex flex-col gap-2 w-full">
          <div class="dark:text-white/60 text-black/60 text-xs font-semibold">玩家</div>
          <!-- 全选 / 半选 / 全不选 -->
          <NCheckbox
            :checked="allPlayersChecked"
            :indeterminate="somePlayersChecked"
            @update:checked="toggleAllPlayers"
          >
            <template #default>
              <div class="flex items-center gap-2">
                <span>全选</span>
              </div>
            </template>
          </NCheckbox>
          <NCheckboxGroup v-model:value="selectedPlayers">
            <div class="flex flex-col gap-1.5">
              <NCheckbox
                v-for="player in sortedPlayerOptions"
                :key="player.value"
                :value="player.value"
              >
                <template #default>
                  <div class="flex items-center gap-2 w-48">
                    <!-- 颜色方块 -->
                    <div
                      class="w-3 h-3 rounded-sm shrink-0"
                      :style="{ backgroundColor: player.color }"
                    ></div>
                    <span class="truncate">{{ player.label }}</span>
                  </div>
                </template>
              </NCheckbox>
            </div>
          </NCheckboxGroup>
        </div>
      </div>
    </NScrollbar>
  </div>
  <div
    v-else
    class="h-142 w-full flex items-center justify-center dark:text-white/60 text-black/60 text-sm"
  >
    <template v-if="loadingDetails">
      <div class="flex gap-2 items-center">
        <NSpin :size="16" />
        <span>加载中...</span>
      </div>
    </template>
    <template v-else>
      <div class="flex gap-2 items-center">
        <span>暂无数据</span>
        <NButton type="primary" size="small" @click="onLoadDetails(basicInfo.gameId)">刷新</NButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { MatchParticipant } from '@shared/data-adapter/match-history/participants'
import {
  NButton,
  NCheckbox,
  NCheckboxGroup,
  NRadio,
  NRadioGroup,
  NScrollbar,
  NSpin
} from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'
import { Line } from 'vue-chartjs'

import { useMatchCard } from '../context'
import { useTeamName } from '../utils/text'
import { getTeamColor, playerColors } from '../utils/theme'

const lcs = useLeagueClientStore()

const teamName = useTeamName()

const {
  basicInfo,
  details,
  frames,
  participants,
  teams,
  theme,
  loadingDetails,
  onLoadDetails,
  hidePrivacy
} = useMatchCard()

const selectedMetric = ref<'gold' | 'cs' | 'exp'>('gold')

// 检测当前主题（响应式）
const isDark = computed(() => theme.value === 'dark')

const selectedTeams = ref<string[]>([])
const selectedPlayers = ref<number[]>([])

watchEffect(() => {
  selectedTeams.value = teams.value.teamStatsArr.map((team) => team.teamIdentifier)
})

if (!details.value && !loadingDetails.value) {
  onLoadDetails(basicInfo.value.gameId)
}

const metricConfigs = {
  gold: {
    title: '玩家经济增长曲线',
    yAxisLabel: '金币',
    unit: '金币'
  },
  cs: {
    title: '玩家补刀数增长曲线',
    yAxisLabel: '补刀数',
    unit: '个'
  },
  exp: {
    title: '玩家经验增长曲线',
    yAxisLabel: '经验值',
    unit: '经验'
  }
}

// 从 timeline 中提取玩家数据
const extractMetricData = (participantId: number, metric: 'gold' | 'cs' | 'exp') => {
  const data: number[] = []

  frames.value.forEach((frame) => {
    const participantFrame = frame.participantFrames[participantId.toString()]
    if (participantFrame) {
      switch (metric) {
        case 'gold':
          data.push(participantFrame.totalGold)
          break
        case 'cs':
          data.push(participantFrame.minionsKilled + (participantFrame.jungleMinionsKilled || 0))
          break
        case 'exp':
          data.push(participantFrame.xp || 0)
          break
      }
    }
  })

  return data
}

// 计算队伍平均数据
const extractTeamAverageData = (teamIdentifier: string, metric: 'gold' | 'cs' | 'exp') => {
  const teamParticipants = participants.value
    .filter((p) => p.teamIdentifier === teamIdentifier)
    .map((p) => p.participantId)

  const data: number[] = []

  frames.value.forEach((frame) => {
    let sum = 0
    let count = 0

    teamParticipants.forEach((participantId) => {
      const participantFrame = frame.participantFrames[participantId.toString()]
      if (participantFrame) {
        switch (metric) {
          case 'gold':
            sum += participantFrame.totalGold
            break
          case 'cs':
            sum += participantFrame.minionsKilled + participantFrame.jungleMinionsKilled
            break
          case 'exp':
            sum += participantFrame.xp
            break
        }
        count++
      }
    })

    data.push(count > 0 ? Math.round(sum / count) : 0)
  })

  return data
}

// 生成时间点标签（根据实际 frames 数量）
const timeLabels = computed(() => {
  return frames.value.map((frame) => {
    const minutes = Math.floor(frame.timestamp / 60000)
    return `${minutes}min`
  })
})

// 队伍选项
const teamOptions = computed(() => {
  return teams.value.teamStatsArr.map((team) => {
    const name = teamName(team.teamIdentifier)
    return {
      value: team.teamIdentifier,
      label: name + '平均',
      color: getTeamColor(team.teamIdentifier)
    }
  })
})

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

// 玩家全选 / 半选 / 全不选状态
const allPlayerValues = computed(() => sortedPlayerOptions.value.map((p) => p.value))
const allPlayersChecked = computed(
  () =>
    selectedPlayers.value.length > 0 &&
    selectedPlayers.value.length === allPlayerValues.value.length
)
const somePlayersChecked = computed(
  () =>
    selectedPlayers.value.length > 0 && selectedPlayers.value.length < allPlayerValues.value.length
)
const toggleAllPlayers = (checked: boolean) => {
  selectedPlayers.value = checked ? [...allPlayerValues.value] : []
}

// 构建图表数据（响应式）
const chartData = computed(() => {
  // 如果 timeline 为空，返回空数据
  if (frames.value.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }

  const getName = (
    participantId: number,
    participant?: MatchParticipant,
    hidePrivacy: boolean = false
  ) => {
    if (!participant) return `玩家 ${participantId}`

    if (hidePrivacy) return lcs.gameData.championName(participant.championId)

    return `${participant.gameName} #${participant.tagLine}`
  }

  // 玩家个人数据
  const playerDatasets = Array.from({ length: participants.value.length }, (_, i) => {
    const participantId = i + 1 // participantId 从 1 开始
    const participant = participants.value.find((p) => p.participantId === participantId)

    return {
      label: getName(participantId, participant, hidePrivacy.value),
      data: extractMetricData(participantId, selectedMetric.value),
      borderColor: playerColors[i % playerColors.length],
      backgroundColor: playerColors[i % playerColors.length] + '40', // 添加透明度
      borderWidth: 2,
      tension: 0, // 无平滑，严格按照数据点绘制
      pointRadius: 0, // 隐藏数据点
      pointHoverRadius: 4, // 悬停时显示数据点
      hidden: !selectedPlayers.value.includes(participantId) // 根据选中状态控制
    }
  })

  // 队伍平均数据
  const teamAverageDatasets = teams.value.teamStatsArr.map((team) => {
    const name = teamName(team.teamIdentifier)
    const color = getTeamColor(team.teamIdentifier)

    return {
      label: `${name}平均`,
      data: extractTeamAverageData(team.teamIdentifier, selectedMetric.value),
      borderColor: color,
      backgroundColor: color + '40',
      borderWidth: 3,
      borderDash: [10, 2, 2, 2], // 点划线样式（长线-短间隔-点-短间隔）
      tension: 0,
      pointRadius: 0,
      pointHoverRadius: 5,
      hidden: !selectedTeams.value.includes(team.teamIdentifier) // 根据选中状态控制
    }
  })

  return {
    labels: timeLabels.value,
    datasets: [...playerDatasets, ...teamAverageDatasets]
  }
})

// 图表配置选项（响应式）
const chartOptions = computed(() => {
  const config = metricConfigs[selectedMetric.value]

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300 // 动画时长（毫秒），默认为 1000
    },
    plugins: {
      datalabels: {
        display: false
      },
      legend: {
        display: false // 禁用内置图例，使用外部控制器
      },
      title: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} ${config.unit}`
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '游戏时间'
        },
        ticks: {
          maxTicksLimit: 10
        },
        grid: {
          display: true,
          color: isDark.value ? 'rgba(200, 200, 200, 0.2)' : 'rgba(100, 100, 100, 0.2)',
          drawOnChartArea: true
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: config.yAxisLabel
        },
        beginAtZero: true,
        ticks: {
          callback: (value: any) => value.toLocaleString()
        },
        grid: {
          display: true,
          color: isDark.value ? 'rgba(200, 200, 200, 0.3)' : 'rgba(100, 100, 100, 0.3)',
          drawOnChartArea: true
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  }
})
</script>

<style scoped></style>
