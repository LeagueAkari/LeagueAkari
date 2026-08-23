import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { computed, ref } from 'vue'

import { useInGameSendTeams } from './composables/usePresetSelections'
import { provideCustomTemplatePreset, useCustomTemplatePresetData } from './data/custom-template'
import { provideFixedTextPreset, useFixedTextPresetData } from './data/fixed-text'
import { provideJunglePreset, useJunglePresetData } from './data/jungle'
import { providePremadePreset, usePremadePresetData } from './data/premade'
import { provideRatingPreset, ratingPresetSlot, useRatingPresetData } from './data/rating'
import type { GamePhase, PresetSlot } from './types'

export function useInGameSendPresetsPanel() {
  const activePreset = ref<PresetSlot>(ratingPresetSlot)

  const appCommonStore = useAppCommonStore()
  const ongoingGameStore = useOngoingGameStore()
  const inGameSendStore = useInGameSendStore()
  const inGameSend = useInstance(InGameSendRenderer)

  const { isOngoingGameDraft, teamsWithPlayers, allPuuids, totalCount } = useInGameSendTeams()

  const gamePhase = computed<GamePhase>(() => {
    if (isOngoingGameDraft.value || ongoingGameStore.queryStage.phase === 'draft') {
      return 'draft'
    }

    if (
      ongoingGameStore.queryStage.phase === 'lobby' ||
      ongoingGameStore.queryStage.phase === 'champ-select' ||
      ongoingGameStore.queryStage.phase === 'in-game'
    ) {
      return ongoingGameStore.queryStage.phase
    }

    return 'none'
  })

  const canSend = computed(() => {
    if (gamePhase.value === 'draft') {
      return false
    }

    if (gamePhase.value === 'lobby' || gamePhase.value === 'champ-select') {
      return true
    }

    return gamePhase.value === 'in-game' && appCommonStore.nativeSupport.nativeInput.available
  })

  const ratingPresetOptions = computed(() => inGameSendStore.settings.ratingPresetOptions)
  const junglePresetOptions = computed(() => inGameSendStore.settings.junglePresetOptions)
  const premadePresetOptions = computed(() => inGameSendStore.settings.premadePresetOptions)
  const fixedTextPresetItems = computed(() => inGameSendStore.settings.fixedTextPresetItems)
  const customTemplateRiskNoticeShown = computed(
    () => inGameSendStore.settings.customTemplateRiskNoticeShown
  )
  const customTemplateItems = computed(() => inGameSendStore.settings.customTemplateItems)
  const customTemplateLastErrors = computed(() => inGameSendStore.state.customTemplateLastErrors)

  const ratingContext = useRatingPresetData({
    inGameSend,
    inGameSendStore,
    gamePhase,
    canSend,
    teamsWithPlayers,
    allPuuids,
    totalCount,
    ratingPresetOptions
  })

  const jungleContext = useJunglePresetData({
    inGameSend,
    inGameSendStore,
    gamePhase,
    canSend,
    teamsWithPlayers,
    allPuuids,
    totalCount,
    junglePresetOptions
  })

  const premadeContext = usePremadePresetData({
    inGameSend,
    inGameSendStore,
    gamePhase,
    canSend,
    teamsWithPlayers,
    totalCount,
    premadePresetOptions
  })

  const fixedTextContext = useFixedTextPresetData({
    inGameSend,
    inGameSendStore,
    gamePhase,
    canSend,
    fixedTextPresetItems
  })

  const customTemplateContext = useCustomTemplatePresetData({
    inGameSend,
    gamePhase,
    canSend,
    riskNoticeShown: customTemplateRiskNoticeShown,
    items: customTemplateItems,
    lastErrors: customTemplateLastErrors
  })

  provideRatingPreset(ratingContext)
  provideJunglePreset(jungleContext)
  providePremadePreset(premadeContext)
  provideFixedTextPreset(fixedTextContext)
  provideCustomTemplatePreset(customTemplateContext)

  return {
    activePreset
  }
}
