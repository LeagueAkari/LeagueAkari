import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useMessage } from 'naive-ui'
import { computed, reactive, ref } from 'vue'

import { presets, targets } from './constants'
import { provideInGameSendPresetsTest } from './context'
import type {
  JunglePresetContext,
  PlayerSelectionPresetContext,
  PremadePresetContext,
  PremadeSelectionPresetContext,
  PresetDisplayOption,
  PresetScopeContext,
  RatingPresetContext
} from './context'
import type {
  GamePhase,
  PlayerSelectionPresetId,
  Preset,
  PresetId,
  PresetTarget,
  PresetTargetId,
  PreviewedLinesByPresetId
} from './types'
import { usePresetSelections } from './usePresetSelections'

const ratingDisplayOptions: PresetDisplayOption[] = [
  { label: 'KDA', value: 'kda', description: '击杀 / 死亡 / 助攻表现' },
  { label: '胜率', value: 'win-rate', description: '近期对局胜率' },
  { label: 'Akari Score', value: 'akari-score', description: '综合评分占位' },
  { label: '统计场次', value: 'game-count', description: '纳入统计的对局数量' },
  { label: '单杀次数', value: 'solo-kills', description: '近期单杀表现' },
  { label: '参团率', value: 'kill-participation', description: '团战参与程度' },
  { label: '分均伤害', value: 'damage-per-minute', description: '输出能力概览' },
  { label: '承伤占比', value: 'damage-taken-share', description: '前排与抗压指标' }
]

const jungleDisplayOptions: PresetDisplayOption[] = [
  { label: '开野路线', value: 'first-clear-route', description: '首轮刷野路线' },
  { label: '首轮野区', value: 'first-clear-side', description: '偏上半区或下半区' },
  { label: 'Gank 偏好', value: 'gank-lanes', description: '常照顾的分路' },
  { label: '入侵倾向', value: 'invade-tendency', description: '主动进野区频率' },
  { label: '河蟹控制', value: 'scuttle-control', description: '前期河道控制情况' },
  { label: '资源优先级', value: 'objective-priority', description: '小龙 / 虚空资源偏好' },
  { label: '反野风险', value: 'counter-jungle-risk', description: '容易被入侵的时间窗' },
  { label: '联动对象', value: 'duo-lane-link', description: '常联动队友占位' }
]

export function useInGameSendPresetsTestProvider() {
  const activePreset = ref<PresetId>('rating')
  const presetById = Object.fromEntries(presets.map((preset) => [preset.id, preset])) as Record<
    PresetId,
    Preset
  >
  const message = useMessage()
  const as = useAppCommonStore()
  const ogs = useOngoingGameStore()
  const ig = useInstance(InGameSendRenderer)

  const {
    isOngoingGameDraft,
    teamsWithPlayers,
    totalCount,
    selectedPlayerCount,
    isPlayerSelected,
    setPlayerSelected,
    selectedInTeam,
    isTeamAllSelected,
    isTeamIndeterminate,
    setTeamSelected,
    setAllSelected,
    premadeColors,
    premadeView,
    selectedPremadeGroupCount,
    totalPremadeGroupCount,
    isPremadeBucketSelected,
    setPremadeBucketSelected,
    setAllPremadeSelected,
    isPremadeTeamAllSelected,
    isPremadeTeamIndeterminate,
    setPremadeTeamSelected
  } = usePresetSelections(ig)

  const gamePhase = computed<GamePhase>(() => {
    if (isOngoingGameDraft.value || ogs.queryStage.phase === 'draft') {
      return 'draft'
    }

    if (
      ogs.queryStage.phase === 'lobby' ||
      ogs.queryStage.phase === 'champ-select' ||
      ogs.queryStage.phase === 'in-game'
    ) {
      return ogs.queryStage.phase
    }

    return 'none'
  })
  const isDraftMode = computed(() => gamePhase.value === 'draft')
  const nativeInputUnavailableReason = computed(() => {
    if (as.nativeSupport.nativeInput.available) {
      return null
    }

    return as.nativeSupport.nativeInput.availableOnCurrentPlatform
      ? '当前平台的游戏内发送需要以管理员权限启动'
      : '当前平台不支持游戏内模拟输入'
  })
  const canSend = computed(() => {
    if (isDraftMode.value) {
      return false
    }

    if (gamePhase.value === 'lobby' || gamePhase.value === 'champ-select') {
      return true
    }

    return gamePhase.value === 'in-game' && as.nativeSupport.nativeInput.available
  })
  const sendButtonText = computed(() => {
    if (gamePhase.value === 'in-game') {
      return '发送到游戏'
    }

    if (gamePhase.value === 'lobby' || gamePhase.value === 'champ-select') {
      return '发送到聊天'
    }

    return '发送'
  })
  const sendDisabledReason = computed(() => {
    if (isDraftMode.value) {
      return 'Draft 模式仅支持试运行'
    }

    if (gamePhase.value === 'in-game' && nativeInputUnavailableReason.value) {
      return nativeInputUnavailableReason.value
    }

    return '仅可在英雄选择、房间或游戏内使用'
  })

  const shortcuts = reactive<Record<PresetId, Record<PresetTargetId, string | null>>>(
    Object.fromEntries(
      presets.map((preset) => [preset.id, { enemy: null, friendly: null, all: null }])
    ) as Record<PresetId, Record<PresetTargetId, string | null>>
  )
  const previewedLinesById = reactive<PreviewedLinesByPresetId>({
    rating: null,
    jungle: null,
    premade: null
  })

  function setShortcut(presetId: PresetId, targetId: PresetTargetId, shortcutId: string | null) {
    shortcuts[presetId][targetId] = shortcutId
  }

  function closePreview(presetId: PresetId) {
    previewedLinesById[presetId] = null
  }

  async function onSend(preset: Preset, target: PresetTarget) {
    const sent = await ig.sendPreset(preset.id, target.id)
    if (sent) {
      message.success(`已提交发送 (${preset.label} → ${target.label})`)
    }
  }

  async function onDryRun(preset: Preset, target: PresetTarget) {
    const lines = await ig.generatePresetLines(preset.id, target.id)
    previewedLinesById[preset.id] = {
      presetId: preset.id,
      preset: preset.label,
      target: target.label,
      lines
    }
  }

  function createPresetScope(preset: Preset): PresetScopeContext {
    return {
      preset,
      targets,
      shortcuts: shortcuts[preset.id],
      canSend,
      sendButtonText,
      sendDisabledReason,
      previewedLines: computed(() => previewedLinesById[preset.id]),
      setShortcut: (targetId, shortcutId) => setShortcut(preset.id, targetId, shortcutId),
      send: (target) => onSend(preset, target),
      dryRun: (target) => onDryRun(preset, target),
      closePreview: () => closePreview(preset.id)
    }
  }

  function createPlayerSelectionPreset(
    presetId: PlayerSelectionPresetId
  ): PlayerSelectionPresetContext {
    return {
      teams: teamsWithPlayers,
      totalCount,
      selectedCount: computed(() => selectedPlayerCount(presetId)),
      selectedInTeam: (teamId) => selectedInTeam(presetId, teamId),
      isTeamAllSelected: (teamId) => isTeamAllSelected(presetId, teamId),
      isTeamIndeterminate: (teamId) => isTeamIndeterminate(presetId, teamId),
      isPlayerSelected: (puuid) => isPlayerSelected(presetId, puuid),
      setTeamSelected: (teamId, selected) => setTeamSelected(presetId, teamId, selected),
      setPlayerSelected: (puuid, selected) => setPlayerSelected(presetId, puuid, selected),
      setAllSelected: (selected) => setAllSelected(presetId, selected)
    }
  }

  function createPremadeSelectionPreset(): PremadeSelectionPresetContext {
    return {
      totalCount,
      teams: premadeView,
      selectedGroupCount: selectedPremadeGroupCount,
      totalGroupCount: totalPremadeGroupCount,
      colors: premadeColors,
      isBucketSelected: isPremadeBucketSelected,
      setBucketSelected: setPremadeBucketSelected,
      setAllSelected: setAllPremadeSelected,
      isTeamAllSelected: isPremadeTeamAllSelected,
      isTeamIndeterminate: isPremadeTeamIndeterminate,
      setTeamSelected: setPremadeTeamSelected
    }
  }

  const ratingPreset: RatingPresetContext = {
    ...createPresetScope(presetById.rating),
    displayOptions: ratingDisplayOptions,
    selectedDisplayItems: ref(ratingDisplayOptions.map((option) => option.value)),
    playerSelection: createPlayerSelectionPreset('rating')
  }
  const junglePreset: JunglePresetContext = {
    ...createPresetScope(presetById.jungle),
    displayOptions: jungleDisplayOptions,
    selectedDisplayItems: ref(jungleDisplayOptions.map((option) => option.value)),
    playerSelection: createPlayerSelectionPreset('jungle')
  }
  const premadePreset: PremadePresetContext = {
    ...createPresetScope(presetById.premade),
    premadeSelection: createPremadeSelectionPreset()
  }

  provideInGameSendPresetsTest({
    rating: ratingPreset,
    jungle: junglePreset,
    premade: premadePreset
  })

  return {
    gamePhase,
    activePreset,
    ratingPreset,
    junglePreset,
    premadePreset
  }
}
