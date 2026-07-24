import type { Meta, StoryObj } from '@storybook/vue3-vite'

import PlayerTabStripStory from './PlayerTabStripStory.vue'

const meta = {
  title: 'Main Window/Titlebar/Player Tab Strip',
  component: PlayerTabStripStory,
  parameters: {
    layout: 'fullscreen',
    akariStoryPanelMaxWidth: '100%'
  }
} satisfies Meta<typeof PlayerTabStripStory>

export default meta

type Story = StoryObj<typeof meta>

export const Interactive: Story = {}
