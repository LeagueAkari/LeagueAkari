<template>
  <div class="spells-cd-timer">
    <TimerItem
      :spell1-id="item.spell1Id"
      :spell2-id="item.spell2Id"
      :champion-id="item.championId"
      :timer-type="item.type === 'custom' ? 'countup' : ctws.settings.timerType"
      @spell1-click="
        setTimer(
          item.timer1Id,
          item.type === 'custom' ? 'countup' : ctws.settings.timerType,
          item.championId,
          item.spell1Id
        )
      "
      @spell2-click="
        setTimer(
          item.timer2Id,
          item.type === 'custom' ? 'countup' : ctws.settings.timerType,
          item.championId,
          item.spell2Id
        )
      "
      :spell1-base-timestamp="timers[item.timer1Id]?.[1]"
      :spell2-base-timestamp="timers[item.timer2Id]?.[1]"
      @spell1-wheel="(_, deltaY) => adjustTimer(item.timer1Id, deltaY)"
      @spell2-wheel="(_, deltaY) => adjustTimer(item.timer2Id, deltaY)"
      @spell1-double-right-click="
        () =>
          sendInGameText(
            item.timer1Id,
            item.type === 'custom' ? 'countup' : ctws.settings.timerType,
            item.championId,
            item.spell1Id
          )
      "
      @spell2-double-right-click="
        () =>
          sendInGameText(
            item.timer2Id,
            item.type === 'custom' ? 'countup' : ctws.settings.timerType,
            item.championId,
            item.spell2Id
          )
      "
      class="item-margin"
      v-for="item of items"
      :key="item.id"
    />
    <div
      class="adjustment-indicator"
      :class="{
        'opacity-show': currentShowingIndicator
      }"
    >
      <template v-if="currentShowingIndicator">
        {{ formatDeltaMs(currentShowingIndicator.deltaMs, currentShowingIndicator.type) }}
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAdditionalInfoStore } from '@cd-timer-window/shards/additional-info/store'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useCdTimerWindowStore } from '@renderer-shared/shards/window-manager/store'
import { EMPTY_PUUID } from '@shared/constants/common'
import { useTimeoutFn } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { useMessage } from 'naive-ui'
import { computed, shallowReactive, shallowRef, watch } from 'vue'

import TimerItem from './TimerItem.vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const ctws = useCdTimerWindowStore()
const as = useAppCommonStore()
const message = useMessage()

const wm = useInstance(WindowManagerRenderer)

const POSITION_ORDER: Record<string, number> = {
  TOP: 0,
  JUNGLE: 1,
  MIDDLE: 2,
  BOTTOM: 3,
  UTILITY: 4
}

const normalizePosition = (position?: string) => {
  const normalized = (position || '').toUpperCase()
  if (normalized === 'MID') {
    return 'MIDDLE'
  }
  if (normalized === 'BOT' || normalized === 'ADC') {
    return 'BOTTOM'
  }
  if (normalized === 'SUP' || normalized === 'SUPPORT') {
    return 'UTILITY'
  }
  return normalized
}

const getPositionOrder = (position?: string) => {
  const normalized = normalizePosition(position)
  return POSITION_ORDER[normalized] ?? Number.MAX_SAFE_INTEGER
}

const createEmptyTimer = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `default-${i}`,
    type: 'custom',
    timer1Id: `default-${i}-spell1`,
    timer2Id: `default-${i}-spell2`,
    spell1Id: 0,
    spell2Id: 0,
    championId: null
  }))
}

const timers = shallowReactive<Record<string, ['countup' | 'countdown', number] | null>>({})

const setTimer = (id: string, timerType: string, _championId: number | null, spellId: number) => {
  const record = timers[id] || null

  // clear the timer
  if (record) {
    timers[id] = null
    return
  }

  if (timerType === 'countdown') {
    const spell = lcs.gameData.summonerSpells[spellId]
    const modeInfo = ctws.supportedGameModes.find(
      (mode) => mode.gameMode === lcs.gameflow.session?.gameData.queue.gameMode
    )

    if (spell && modeInfo) {
      const multiplier = 100 / (100 + modeInfo.abilityHaste)
      timers[id] = [timerType, Date.now() + spell.cooldown * multiplier * 1000]
    }
  } else if (timerType === 'countup') {
    timers[id] = [timerType, Date.now()]
    return
  }
}

const { start } = useTimeoutFn(
  () => {
    currentShowingIndicator.value = null
  },
  500,
  { immediate: false }
)
const currentShowingIndicator = shallowRef<{
  timerId: string
  type: 'countup' | 'countdown'
  deltaMs: number
} | null>(null)

const updateIndicator = (id: string, deltaMs: number, type: 'countup' | 'countdown') => {
  if (currentShowingIndicator.value && currentShowingIndicator.value.timerId === id) {
    currentShowingIndicator.value = {
      timerId: id,
      type,
      deltaMs: currentShowingIndicator.value.deltaMs + deltaMs
    }
  } else {
    currentShowingIndicator.value = { timerId: id, type, deltaMs }
  }

  start()
}

const formatDeltaMs = (deltaMs: number, type: 'countup' | 'countdown') => {
  if (type === 'countup') {
    if (deltaMs > 0) {
      return `- ${(deltaMs / 1000).toFixed()} s`
    } else if (deltaMs < 0) {
      return `+ ${Math.abs(deltaMs / 1000).toFixed()} s`
    }
  } else if (type === 'countdown') {
    if (deltaMs > 0) {
      return `+ ${(deltaMs / 1000).toFixed()} s`
    } else if (deltaMs < 0) {
      return `- ${Math.abs(deltaMs / 1000).toFixed()} s`
    }
  }

  return '= 0 s'
}

const adjustTimer = (id: string, deltaY: number) => {
  const record = timers[id] || null

  if (record === null) {
    return
  }

  const timeDelta = ctws.settings.reverseAdjustmentDirection ? -deltaY * 50 : deltaY * 50 // 50 is a suitable value, up -> negative, down -> positive
  const currentBaseTime = record[1]

  // 对于countup，不允许调整时间导致其小于基准时间
  if (record[0] === 'countup') {
    const adjusted = Math.min(currentBaseTime + timeDelta, Date.now())
    timers[id] = [record[0], adjusted]
    updateIndicator(id, adjusted - currentBaseTime, 'countup')
  } else if (record[0] === 'countdown') {
    const adjusted = Math.max(currentBaseTime + timeDelta, Date.now())
    timers[id] = [record[0], adjusted]
    updateIndicator(id, timeDelta, 'countdown')
  }
}

watch(
  () => ctws.settings.timerType,
  () => {
    for (const key in timers) {
      timers[key] = null
    }
  }
)

const ais = useAdditionalInfoStore()

const items = computed(() => {
  if (!lcs.gameflow.session || lcs.gameflow.session.phase !== 'InProgress' || !lcs.summoner.me) {
    return createEmptyTimer(5)
  }

  const gameModeConfig = ctws.supportedGameModes.find(
    (mode) => mode.gameMode === lcs.gameflow.session?.gameData.queue.gameMode
  )

  if (!gameModeConfig) {
    return createEmptyTimer(5)
  }

  const selfPuuid = lcs.summoner.me.puuid
  const game = lcs.gameflow.session.gameData

  const teamOnePuuids = Array.from(
    new Set<string>([
      ...game.teamOne.map((p) => p.puuid),
      ...(ais.additional.teams['TEAM-100'] || [])
    ])
  )
  const teamTwoPuuids = Array.from(
    new Set<string>([
      ...game.teamTwo.map((p) => p.puuid),
      ...(ais.additional.teams['TEAM-200'] || [])
    ])
  )

  const selections = game.playerChampionSelections
  const selectionMap: Record<string, { championId: number; spell1Id: number; spell2Id: number }> =
    {}
  const positionMap: Record<string, string> = {}

  for (const player of [...game.teamOne, ...game.teamTwo]) {
    if (player.puuid && player.puuid !== EMPTY_PUUID) {
      positionMap[player.puuid] = player.selectedPosition || ''
    }
  }

  for (const selection of selections) {
    if (selection.puuid && selection.puuid !== EMPTY_PUUID) {
      selectionMap[selection.puuid] = {
        championId: selection.championId,
        spell1Id: selection.spell1Id,
        spell2Id: selection.spell2Id
      }
    }
  }

  for (const [puuid, assignment] of Object.entries(ais.additional.positions || {})) {
    if (assignment?.position) {
      positionMap[puuid] = assignment.position
    }
  }

  for (const [puuid, championId] of Object.entries(ais.additional.selections)) {
    const spells = ais.additional.spells[puuid]
    if (spells) {
      selectionMap[puuid] = {
        championId,
        spell1Id: spells.spell1Id,
        spell2Id: spells.spell2Id
      }
    }
  }

  const theirTeamPuuids = teamOnePuuids.includes(selfPuuid) ? teamTwoPuuids : teamOnePuuids

  if (!theirTeamPuuids.length) {
    return createEmptyTimer(5)
  }

  const theirTeamSelections = theirTeamPuuids
    .map((puuid, index) => ({
      puuid,
      index,
      position: positionMap[puuid] || '',
      selection: selectionMap[puuid]
    }))
    .filter((p) => p.selection !== undefined)
    .sort((a, b) => {
      const positionDelta = getPositionOrder(a.position) - getPositionOrder(b.position)
      if (positionDelta !== 0) {
        return positionDelta
      }

      return a.index - b.index
    })

  return theirTeamSelections.map((entry) => {
    const p = entry.selection!
    return {
      id: `champion-${entry.puuid}-${p.championId}-${p.spell1Id}-${p.spell2Id}`,
      type: 'summoner-spell',
      timer1Id: `champion-${entry.puuid}-${p.championId}-${p.spell1Id}`,
      timer2Id: `champion-${entry.puuid}-${p.championId}-${p.spell2Id}`,
      ...p
    }
  })
})

const sendInGameText = async (
  id: string,
  timerType: string,
  championId: number | null,
  spellId: number
) => {
  const record = timers[id] || null

  if (record === null || championId === null || ctws.gameTime === null) {
    return
  }

  const spell = lcs.gameData.summonerSpells[spellId]
  const modeInfo = ctws.supportedGameModes.find(
    (mode) => mode.gameMode === lcs.gameflow.session?.gameData.queue.gameMode
  )

  if (!spell || !modeInfo) {
    return
  }

  const relativeMs = record[1] - Date.now() + ctws.gameTime * 1000
  const minutes = Math.floor(relativeMs / 60000)
  const seconds = Math.floor((relativeMs % 60000) / 1000)

  let text: string | null = null
  if (timerType === 'countdown') {
    text = t('cdTimer.window.countdown', {
      championName: lcs.gameData.champions[championId]?.name || championId,
      spellName: spell.name,
      minutes,
      seconds: seconds.toString().padStart(2, '0')
    })
  } else if (timerType === 'countup') {
    text = t('cdTimer.window.countup', {
      championName: lcs.gameData.champions[championId]?.name || championId,
      spellName: spell.name,
      minutes,
      seconds: seconds.toString().padStart(2, '0')
    })
  }

  if (text) {
    // Best-effort UX: show an explicit reason when injection is unavailable.
    if (!as.nativeSupport.nativeInput.available) {
      if (as.nativeSupport.nativeInput.availableOnCurrentPlatform) {
        message.warning(t('cdTimer.window.adminRequired'))
      } else {
        message.warning(t('cdTimer.window.nativeInjectionUnsupported'))
      }
      return
    }

    try {
      await wm.cdTimerWindow.sendInGame(text)
    } catch (error: any) {
      const code = error?.code as string | undefined

      if (code === 'AlreadySending') {
        message.warning(t('cdTimer.window.alreadySending'))
      } else if (code === 'GameClientNotForeground') {
        message.warning(t('cdTimer.window.gameNotForeground'))
      } else if (typeof error?.message === 'string' && error.message.includes('No function')) {
        message.warning(t('cdTimer.window.nativeInjectionUnsupported'))
      } else {
        message.warning(t('cdTimer.window.sendFailed', { reason: error?.message || String(error) }))
      }
    }
  }
}
</script>

<style scoped>
.spells-cd-timer {
  position: relative;
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.adjustment-indicator {
  position: absolute;
  border-radius: 2px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.65);
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  transition: opacity 0.2s;
  opacity: 0;

  &.opacity-show {
    opacity: 1;
  }
}

.item-margin:not(:last-child) {
  margin-bottom: 4px;
}
</style>
