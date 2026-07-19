import type { Meta, StoryObj } from '@storybook/vue3-vite'

import RespawnTimerItemStory from './RespawnTimerItemStory.vue'

const meta = {
  title: 'Main Window/Sidebar/Respawn Timer Item',
  component: RespawnTimerItemStory,
  args: {
    timeLeft: 26,
    totalTime: 42,
    isCollapsed: false
  },
  argTypes: {
    timeLeft: {
      control: { type: 'range', min: 0, max: 120, step: 1 }
    },
    totalTime: {
      control: { type: 'range', min: 1, max: 120, step: 1 }
    }
  },
  parameters: {
    akariStoryPanelMaxWidth: 360
  }
} satisfies Meta<typeof RespawnTimerItemStory>

export default meta

type Story = StoryObj<typeof meta>

export const Expanded: Story = {}

export const Collapsed: Story = {
  args: {
    isCollapsed: true
  }
}

export const LongRespawn: Story = {
  args: {
    timeLeft: 108,
    totalTime: 120,
    isCollapsed: true
  }
}
