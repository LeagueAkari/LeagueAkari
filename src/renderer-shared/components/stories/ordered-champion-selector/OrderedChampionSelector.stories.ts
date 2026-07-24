import type { Meta, StoryObj } from '@storybook/vue3-vite'

import OrderedChampionSelectorDemo from './OrderedChampionSelectorDemo.vue'

const meta = {
  title: 'Renderer Shared/Features/Ordered Champion Selector',
  component: OrderedChampionSelectorDemo,
  parameters: {
    akariStoryPanelMaxWidth: 860
  }
} satisfies Meta<typeof OrderedChampionSelectorDemo>

export default meta

type Story = StoryObj<typeof meta>

export const Interactive: Story = {}
