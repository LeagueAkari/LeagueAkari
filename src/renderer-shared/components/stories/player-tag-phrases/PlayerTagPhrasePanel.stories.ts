import type { Meta, StoryObj } from '@storybook/vue3-vite'

import PlayerTagPhrasePanelDemo from './PlayerTagPhrasePanelDemo.vue'

const meta = {
  title: 'Renderer Shared/Features/Player Tag Phrases',
  component: PlayerTagPhrasePanelDemo,
  parameters: {
    akariStoryPanelMaxWidth: 620
  }
} satisfies Meta<typeof PlayerTagPhrasePanelDemo>

export default meta

type Story = StoryObj<typeof meta>

export const Interactive: Story = {}
