import type { AggregatedAnalysis } from '@shared/data-adapter/analysis/player'
import {
  ArcElement,
  type ChartData,
  Chart as ChartJS,
  type ChartOptions,
  Legend,
  Tooltip,
  type TooltipItem
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { useTranslation } from 'i18next-vue'
import { computed, defineComponent } from 'vue'
import { Pie } from 'vue-chartjs'

import type { PlayerCardTagDefinition } from '../types'

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels)

const MIN_DEVICE_PIXEL_RATIO = 3

export const SUSPICIOUS_FLASH_POSITION_CHART_BORDER_WIDTH = 1

export type SuspiciousFlashPositionTag = {
  isSuspicious: boolean
  flashOnD: number
  flashOnF: number
}

export function resolveSuspiciousFlashPositionChartDevicePixelRatio(devicePixelRatio: number) {
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) {
    return MIN_DEVICE_PIXEL_RATIO
  }

  return Math.max(devicePixelRatio, MIN_DEVICE_PIXEL_RATIO)
}

export function getSuspiciousFlashPositionTag(
  analysis: AggregatedAnalysis
): SuspiciousFlashPositionTag {
  return {
    isSuspicious: Boolean(analysis.spells.flashOnD && analysis.spells.flashOnF),
    flashOnD: analysis.spells.flashOnD,
    flashOnF: analysis.spells.flashOnF
  }
}

const SuspiciousFlashPositionPopover = defineComponent({
  name: 'SuspiciousFlashPositionPopover',
  props: {
    flashOnD: {
      type: Number,
      required: true
    },
    flashOnF: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const { t } = useTranslation()
    const total = computed(() => props.flashOnD + props.flashOnF)

    function formatRate(count: number) {
      if (total.value === 0) {
        return '0'
      }

      return ((count / total.value) * 100).toFixed(1)
    }

    const dRate = computed(() => formatRate(props.flashOnD))
    const fRate = computed(() => formatRate(props.flashOnF))
    const dSummary = computed(() =>
      t('ongoingGame.playerCard.suspiciousFlashPositionPopoverDCount', {
        count: props.flashOnD,
        rate: dRate.value
      })
    )
    const fSummary = computed(() =>
      t('ongoingGame.playerCard.suspiciousFlashPositionPopoverFCount', {
        count: props.flashOnF,
        rate: fRate.value
      })
    )
    const totalSummary = computed(() =>
      t('ongoingGame.playerCard.suspiciousFlashPositionPopoverTotal', {
        count: total.value
      })
    )

    const chartData = computed<ChartData<'pie'>>(() => ({
      labels: [
        t('ongoingGame.playerCard.suspiciousFlashPositionPopoverDLabel'),
        t('ongoingGame.playerCard.suspiciousFlashPositionPopoverFLabel')
      ],
      datasets: [
        {
          data: [props.flashOnD, props.flashOnF],
          backgroundColor: ['#2563eb', '#f97316'],
          borderColor: 'rgba(255,255,255,0.72)',
          borderWidth: SUSPICIOUS_FLASH_POSITION_CHART_BORDER_WIDTH,
          borderAlign: 'inner',
          hoverOffset: 4
        }
      ]
    }))

    const chartOptions = computed<ChartOptions<'pie'>>(() => ({
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: resolveSuspiciousFlashPositionChartDevicePixelRatio(
        typeof window === 'undefined' ? MIN_DEVICE_PIXEL_RATIO : window.devicePixelRatio
      ),
      animation: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label(context: TooltipItem<'pie'>) {
              const value = typeof context.parsed === 'number' ? context.parsed : 0
              return `${context.label}: ${value} (${formatRate(value)}%)`
            }
          }
        },
        datalabels: {
          display: false
        }
      }
    }))

    return () => (
      <div class="w-80 text-xs text-black/75 dark:text-gray-200">
        <div class="font-semibold text-black/85 dark:text-white/90">
          {t('ongoingGame.playerCard.suspiciousFlashPositionPopoverTitle')}
        </div>

        <div class="mt-2 flex items-center gap-3">
          <div class="h-28 w-28 shrink-0">
            <Pie data={chartData.value} options={chartOptions.value} />
          </div>

          <div class="min-w-0 flex-1">
            <div class="text-black/55 dark:text-white/55">
              {t('ongoingGame.playerCard.suspiciousFlashPositionPopoverDescription')}
            </div>

            <div class="mt-2 flex flex-col gap-1">
              <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 shrink-0 rounded-xs bg-[#2563eb]" />
                <span>{dSummary.value}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 shrink-0 rounded-xs bg-[#f97316]" />
                <span>{fSummary.value}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-2 border-t border-black/10 pt-2 text-black/45 dark:border-white/10 dark:text-white/45">
          {totalSummary.value}
        </div>
      </div>
    )
  }
})

export const SUSPICIOUS_FLASH_POSITION_TAG: PlayerCardTagDefinition = {
  id: 'suspicious-flash-position',
  render: (ctx) => {
    const analysis = ctx.analysis

    if (!ctx.settings.showSuspiciousFlashPositionTag || !analysis) {
      return null
    }

    const tag = getSuspiciousFlashPositionTag(analysis)

    if (!tag.isSuspicious) {
      return null
    }

    return {
      label: (
        <div class="rounded-xs bg-[#3a1bb8] px-1 py-0.5 text-[11px] leading-2.75 text-white">
          {ctx.t('ongoingGame.playerCard.suspiciousFlashPosition')}
        </div>
      ),
      popover: {
        content: <SuspiciousFlashPositionPopover flashOnD={tag.flashOnD} flashOnF={tag.flashOnF} />
      }
    }
  }
}
