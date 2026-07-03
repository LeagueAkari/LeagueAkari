import type { Meta, StoryObj } from '@storybook/vue3-vite'

import OngoingGamePanelDemo from './OngoingGamePanelDemo.vue'

const meta = {
  title: 'Renderer Shared/Ongoing Game/Ongoing Game Panel',
  component: OngoingGamePanelDemo,
  parameters: {
    akariStoryPanelMaxWidth: 1440
  },
  args: {
    initialPanelWidth: 1320,
    initialPanelHeight: 920
  },
  argTypes: {
    initialPanelWidth: {
      control: {
        type: 'range',
        min: 720,
        max: 1400,
        step: 20
      }
    },
    initialPanelHeight: {
      control: {
        type: 'range',
        min: 360,
        max: 1600,
        step: 20
      }
    }
  }
} satisfies Meta<typeof OngoingGamePanelDemo>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}
