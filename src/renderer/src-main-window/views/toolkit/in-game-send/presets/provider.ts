import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { computed, ref } from 'vue'

import { useInGameSendTeams } from './composables/usePresetSelections'
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

  provideRatingPreset(ratingContext)
  provideJunglePreset(jungleContext)
  providePremadePreset(premadeContext)

  return {
    activePreset
  }
}
