import type { Meta, StoryObj } from '@storybook/vue3-vite'

import AutomationStatusStory from './AutomationStatusStory.vue'

const meta = {
  title: 'Main Window/Titlebar/Automation Status',
  component: AutomationStatusStory,
  args: {
    compact: false,
    open: true,
    itemCount: 3,
    showDetails: true,
    configuredCount: 3,
    longLabels: false
  },
  argTypes: {
    itemCount: {
      control: { type: 'range', min: 0, max: 10, step: 1 }
    },
    showDetails: {
      control: 'boolean'
    },
    configuredCount: {
      control: { type: 'range', min: 1, max: 12, step: 1 },
      if: { arg: 'showDetails', truthy: true }
    },
    longLabels: {
      control: 'boolean'
    }
  },
  parameters: {
    akariStoryPanelMaxWidth: 1120
  }
} satisfies Meta<typeof AutomationStatusStory>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
