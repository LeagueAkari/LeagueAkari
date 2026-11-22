import { sleep } from '@shared/utils/sleep'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NButton } from 'naive-ui'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import { ref } from 'vue'

import ChampionBench from './ChampionBench.vue'
import type { BenchChampionOption } from './types'

function option(
  championId: number,
  availability: BenchChampionOption['availability'] = 'available'
): BenchChampionOption {
  return { championId, availability }
}

const champions = [
  option(22),
  option(99),
  option(81),
  option(103),
  option(54, 'waiting'),
  option(53),
  option(202),
  option(117, 'locked'),
  option(161),
  option(412)
]

const personalChoices = [option(89), option(267), option(254)]
const overflowBench = [...champions, option(64), option(1), option(86)]

const meta = {
  id: 'secondary-window-activity-champion-bench',
  title: '副窗口/进行中/英雄选择台',
  component: ChampionBench,
  parameters: { akariStoryPanelMaxWidth: 530 },
  args: {
    currentChampionId: 157,
    champions,
    subset: [],
    onSelect: fn()
  },
  render: (args, { parameters }) => {
    const [, updateArgs] = useArgs()

    return {
      components: { ChampionBench },
      setup() {
        const selecting = ref(false)

        const select = async (championId: number, complete: boolean) => {
          if (selecting.value) {
            return
          }

          selecting.value = true
          await sleep(parameters.selectionDelay ?? 80)
          selecting.value = false

          if (!complete) {
            return
          }

          if (args.subset.some((champion) => champion.championId === championId)) {
            const unchosen = args.subset.filter((champion) => champion.championId !== championId)

            updateArgs({
              currentChampionId: championId,
              subset: [],
              champions: [...args.champions, ...unchosen]
            })
            return
          }

          const previous = args.currentChampionId
          updateArgs({
            currentChampionId: championId,
            champions: args.champions.flatMap((champion) => {
              if (champion.championId !== championId) {
                return [champion]
              }

              return previous === null ? [] : [option(previous)]
            })
          })
        }

        return { args, selecting, select }
      },
      template: '<ChampionBench v-bind="args" :selecting="selecting" @select="select" />'
    }
  }
} satisfies Meta<typeof ChampionBench>

export default meta

type Story = StoryObj<typeof meta>

export const FullBench: Story = { name: '完整备战席' }

export const SlowSelection: Story = {
  name: '换英雄 · 慢请求',
  parameters: { selectionDelay: 900 },
  args: { currentChampionId: null, champions: [], subset: personalChoices }
}

export const OpeningHand: Story = {
  name: '开局手牌',
  args: { currentChampionId: null, champions: [], subset: personalChoices }
}

export const PersonalChoices: Story = {
  name: '手牌与公共备战席',
  args: {
    currentChampionId: null,
    champions: [option(22, 'waiting'), option(99, 'waiting'), option(117, 'locked')],
    subset: personalChoices
  }
}

export const Overflow: Story = {
  name: '超过十名英雄',
  args: { champions: overflowBench }
}

export const HandMotion: Story = {
  name: '备战席与手牌进出场',
  args: {
    champions: overflowBench,
    subset: personalChoices
  },
  decorators: [
    (story, { args }) => {
      const [, updateArgs] = useArgs()

      return {
        components: { NButton, Story: story() },
        setup: () => ({
          args,
          toggleBench: () => updateArgs({ champions: args.champions.length ? [] : overflowBench }),
          toggleHand: () => updateArgs({ subset: args.subset.length ? [] : personalChoices })
        }),
        template: `
          <div class="flex flex-col gap-3">
            <div class="flex gap-2">
              <NButton size="small" secondary :aria-expanded="!!args.champions.length" @click="toggleBench">
                {{ args.champions.length ? '收起备战席' : '展开备战席' }}
              </NButton>
              <NButton size="small" secondary :aria-expanded="!!args.subset.length" @click="toggleHand">
                {{ args.subset.length ? '收起手牌' : '展开手牌' }}
              </NButton>
            </div>
            <Story />
          </div>
        `
      }
    }
  ]
}

export const PartialBench: Story = {
  name: '少量备战英雄',
  args: { currentChampionId: null, champions: champions.slice(0, 4) }
}

export const EmptyBench: Story = {
  name: '空备战席',
  args: { champions: [] }
}
