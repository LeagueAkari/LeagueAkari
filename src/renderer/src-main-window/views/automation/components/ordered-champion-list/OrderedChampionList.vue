<template>
  <div class="flex h-6 items-center">
    <NModal v-model:show="show">
      <NTransfer
        class="h-[65vh]! w-150! rounded bg-white/95 dark:bg-neutral-900/95"
        size="small"
        v-model:value="champions"
        virtual-scroll
        :options="championOptions"
        :render-source-label="renderSourceLabel"
        :render-target-label="renderTargetLabel"
        :source-filter-placeholder="t('OrderedChampionList.searchForChampion')"
        :filter="(a, b) => filterChampions(a, b as any)"
        :source-title="renderPositionFilter"
        source-filterable
      />
    </NModal>

    <NButton size="tiny" class="mr-2! shrink-0" @click="show = true">
      <template #icon>
        <NIcon>
          <Edit20FilledIcon />
        </NIcon>
      </template>
    </NButton>

    <div class="flex flex-wrap items-center gap-1">
      <ChampionIcon
        :champion-id="c"
        :stretched="false"
        class="size-5 rounded"
        :title="lcs.gameData.champions[c]?.name"
        :class="{
          [styles['not-pickable']]:
            lcs.gameflow.phase === 'ChampSelect' &&
            (type === 'pick'
              ? !lcs.champSelect.currentPickableChampionIds.has(c)
              : !lcs.champSelect.currentBannableChampionIds.has(c))
        }"
        v-for="c of champions.slice(0, maxShow)"
        :key="c"
      />
      <div class="text-xs text-black/60 dark:text-white/60" v-if="champions.length > maxShow">
        +{{ champions.length - maxShow }}
      </div>
      <div class="text-xs text-black/60 dark:text-white/60" v-if="champions.length === 0">
        {{ t('OrderedChampionList.unselected') }}
      </div>
    </div>
  </div>
</template>

<script lang="tsx" setup>
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Edit20Filled as Edit20FilledIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NIcon,
  NModal,
  NTransfer,
  TransferRenderSourceLabel,
  TransferRenderTargetLabel
} from 'naive-ui'
import { computed, ref, useCssModule, watch } from 'vue'

import { useChampionNameMatch } from '@main-window/composables/useChampionNameMatch'
import { useRecommendedChampionPositions } from '@main-window/composables/useRecommendedChampionPositions'

import PositionFilter from './PositionFilter.vue'

const { t } = useTranslation()

const {
  maxShow = 5,
  allowDummy = false,
  allowBravery = false,
  type = 'pick'
} = defineProps<{
  maxShow?: number
  maxCount?: number
  type?: 'pick' | 'ban'
  allowDummy?: boolean // 允许 -1
  allowBravery?: boolean // 允许 -3
}>()

const show = defineModel<boolean>('show', { default: false })
const champions = defineModel<number[]>('champions', { default: () => [] })

const styles = useCssModule()

const lcs = useLeagueClientStore()

const championOptions = computed(() => {
  const mapped = Object.values(lcs.gameData.champions).map((c) => ({
    id: c.id,
    name: c.name
  }))

  if (allowBravery) {
    mapped.push({ id: -3, name: t('champions.bravery', { ns: 'common' }) })
  }

  const sorted = mapped.toSorted((a, b) => {
    if (a.id < 0 && b.id < 0) {
      return a.id - b.id
    }

    if (a.id < 0 && b.id >= 0) {
      return -1
    }

    if (a.id >= 0 && b.id < 0) {
      return 1
    }

    return a.name.localeCompare(b.name, 'zh-Hans-CN')
  })

  return sorted
    .filter((b) => {
      // 这个值只会在进入英雄选择阶段才会更新
      if (lcs.champSelect.disabledChampionIds.has(b.id)) {
        return false
      }

      return b.id !== 0 && (allowDummy || b.id !== -1)
    })
    .map((b) => ({
      value: b.id,
      label: b.name
    }))
})

const { match: isNameMatch } = useChampionNameMatch()

const renderSourceLabel: TransferRenderSourceLabel = ({ option }) => {
  let pickable = true
  if (lcs.gameflow.phase === 'ChampSelect') {
    if (type === 'pick') {
      pickable = lcs.champSelect.currentPickableChampionIds.has(option.value as number)
    } else {
      pickable = lcs.champSelect.currentBannableChampionIds.has(option.value as number)
    }
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
      class={{ [styles['not-pickable']]: !pickable }}
    >
      <ChampionIcon
        championId={option.value as number}
        stretched={false}
        style={{ width: '18px', height: '18px' }}
      />
      <span style={{ marginLeft: '4px', fontSize: '13px' }}>{option.label}</span>
    </div>
  )
}

const renderTargetLabel: TransferRenderTargetLabel = ({ option }) => {
  let pickable = true
  if (lcs.gameflow.phase === 'ChampSelect') {
    if (type === 'pick') {
      pickable = lcs.champSelect.currentPickableChampionIds.has(option.value as number)
    } else {
      pickable = lcs.champSelect.currentBannableChampionIds.has(option.value as number)
    }
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'grab' }}
      class={{
        [styles['target-item']]: true,
        [styles['not-pickable']]: !pickable
      }}
      draggable
      onDragover={(e) => e.preventDefault()}
      onDragstart={() => handleDragStart(option.value as number)}
      onDragenter={() => handleDragEnter(option.value as number)}
      onDragleave={() => handleDragLeaveOrEnd(option.value as number)}
      onDragend={() => handleDragLeaveOrEnd(option.value as number)}
      onDrop={() => handleDrop(option.value as number)}
    >
      <ChampionIcon
        championId={option.value as number}
        stretched={false}
        style={{ width: '18px', height: '18px' }}
      />
      <span style={{ marginLeft: '4px', fontSize: '13px' }}>{option.label}</span>
      <NButton
        size="tiny"
        quaternary
        style={{ marginLeft: 'auto' }}
        focusable={false}
        class={styles['move-btn']}
        onClick={() => moveUp(option.value as number)}
        disabled={champions.value.indexOf(option.value as number) === 0}
      >
        {t('OrderedChampionList.moveUp')}
      </NButton>
      <NButton
        size="tiny"
        quaternary
        style={{ marginLeft: '2px', marginRight: '2px' }}
        focusable={false}
        class={styles['move-btn']}
        onClick={() => moveDown(option.value as number)}
        disabled={champions.value.indexOf(option.value as number) === champions.value.length - 1}
      >
        {t('OrderedChampionList.moveDown')}
      </NButton>
    </div>
  )
}

const moveUp = (value: number) => {
  const index = champions.value.indexOf(value)
  if (index === 0) {
    return
  }

  const newValue = [...champions.value]
  newValue.splice(index, 1)
  newValue.splice(index - 1, 0, value)
  champions.value = newValue
}

const moveDown = (value: number) => {
  const index = champions.value.indexOf(value)
  if (index === champions.value.length - 1) {
    return
  }

  const newValue = [...champions.value]
  newValue.splice(index, 1)
  newValue.splice(index + 1, 0, value)
  champions.value = newValue
}

const dragging = ref<number | null>(null)
const hovering = ref<number | null>(null)

const handleDragStart = (id: number) => {
  dragging.value = id
}

const handleDragEnter = (id: number) => {
  hovering.value = id
}

const handleDragLeaveOrEnd = (_id: number) => {
  hovering.value = null
}

const handleDrop = (id: number) => {
  if (id === dragging.value) {
    return
  }

  const index = champions.value.indexOf(dragging.value as number)
  const newValue = [...champions.value]
  newValue.splice(index, 1)
  newValue.splice(champions.value.indexOf(id), 0, dragging.value as number)
  champions.value = newValue

  dragging.value = null
}

const renderPositionFilter = () => {
  return (
    <PositionFilter
      {...{
        position: selectedPosition.value,
        'onUpdate:position': (value: string | null) => {
          selectedPosition.value = value
        }
      }}
    />
  )
}

const selectedPosition = ref<string | null>(null)
const { positionMap } = useRecommendedChampionPositions()

const filterChampions = (a: string, b: { label: string; value: number }) => {
  if (positionMap.value && selectedPosition.value) {
    const position = positionMap.value[selectedPosition.value]
    if (position && !position.has(b.value)) {
      return false
    }
  }

  return isNameMatch(a, b.label, b.value)
}

watch(
  () => show.value,
  (show) => {
    if (show) {
      selectedPosition.value = null
    }
  }
)
</script>

<style module>
.target-item .move-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

:global(.n-transfer-list-item--target:hover) {
  .move-btn {
    opacity: 1;
  }
}

.not-pickable {
  filter: brightness(0.5);
}
</style>
