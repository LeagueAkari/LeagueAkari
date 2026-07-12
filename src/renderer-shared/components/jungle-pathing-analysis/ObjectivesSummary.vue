<template>
  <div>
    <div class="mb-1 font-bold text-black/90 dark:text-white/90">
      {{ t('ongoingGame.junglePathing.objectives') }}
    </div>
    <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
      <ObjectiveLine
        icon="dragon"
        :label="t('ongoingGame.junglePathing.firstDragonRateLabel')"
        :value="`${Math.round(stats.objectives.firstDragonRate * 100)}%`"
      />
      <ObjectiveLine
        icon="dragon"
        :label="t('ongoingGame.junglePathing.soloDragonRateLabel')"
        :value="`${Math.round(stats.objectives.soloDragonRate * 100)}%`"
      />
      <ObjectiveLine
        icon="dragon"
        :label="t('ongoingGame.junglePathing.avgDragonsLabel')"
        :value="roundToTenth(stats.objectives.avgDragons).toString()"
        :time="stats.objectives.avgFirstDragonTime ?? undefined"
      />
      <ObjectiveLine
        icon="voidgrub"
        :label="t('ongoingGame.junglePathing.avgVoidgrubsLabel')"
        :value="roundToTenth(stats.objectives.avgVoidgrubs).toString()"
        :time="stats.objectives.avgFirstVoidgrubTime ?? undefined"
      />
      <ObjectiveLine
        icon="herald"
        :label="t('ongoingGame.junglePathing.avgHeraldsLabel')"
        :value="roundToTenth(stats.objectives.avgHeralds).toString()"
        :time="stats.objectives.avgFirstHeraldTime ?? undefined"
      />
      <ObjectiveLine
        icon="baron"
        :label="t('ongoingGame.junglePathing.avgBaronsLabel')"
        :value="roundToTenth(stats.objectives.avgBarons).toString()"
        :time="stats.objectives.avgFirstBaronTime ?? undefined"
      />
    </div>
  </div>
</template>

<script setup lang="tsx">
import BaronIcon from '@renderer-shared/components/match-card/icons/Baron.vue'
import DragonIcon from '@renderer-shared/components/match-card/icons/Dragon.vue'
import RiftHeraldIcon from '@renderer-shared/components/match-card/icons/RiftHerald.vue'
import VoidGrubIcon from '@renderer-shared/components/match-card/icons/VoidGrub.vue'
import type { AggregatedJungleAnalysis } from '@shared/data-adapter/analysis/player'
import { useTranslation } from 'i18next-vue'
import { defineComponent } from 'vue'

import { formatTime, roundToTenth } from './format'

defineProps<{
  stats: AggregatedJungleAnalysis
}>()

const { t } = useTranslation()

const iconMap = {
  dragon: DragonIcon,
  voidgrub: VoidGrubIcon,
  herald: RiftHeraldIcon,
  baron: BaronIcon
}

const ObjectiveLine = defineComponent({
  props: {
    icon: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: String, required: true },
    time: { type: Number, default: undefined }
  },
  setup(props) {
    return () => {
      const Icon = iconMap[props.icon as keyof typeof iconMap]

      return (
        <div class="inline-flex min-w-0 items-center gap-1.5">
          <Icon class="size-3.5 opacity-75" />
          <span class="min-w-0 truncate text-black/75 dark:text-white/75">{props.label}</span>
          <span class="font-semibold text-black/75 dark:text-white/75">{props.value}</span>
          {props.time != null ? (
            <span class="text-black/40 dark:text-white/40">
              ({t('ongoingGame.junglePathing.firstTime', { time: formatTime(props.time) })})
            </span>
          ) : null}
        </div>
      )
    }
  }
})
</script>
