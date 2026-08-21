import type { Meta, StoryObj } from '@storybook/vue3-vite'

import BackgroundTasksStory from './BackgroundTasksStory.vue'

const meta = {
  title: 'Main Window/Titlebar/Background Tasks',
  component: BackgroundTasksStory,
  args: {
    compact: false,
    open: true,
    taskCount: 1,
    taskName: 'LCU 初始化',
    taskDescription: '已完成 8/12',
    taskStatus: 'default',
    inProgress: true,
    showProgress: true,
    progress: 67,
    showAction: false
  },
  argTypes: {
    taskCount: {
      control: { type: 'range', min: 1, max: 6, step: 1 }
    },
    taskName: {
      control: 'text'
    },
    taskDescription: {
      control: 'text'
    },
    taskStatus: {
      control: 'select',
      options: ['default', 'info', 'success', 'warning', 'error']
    },
    inProgress: {
      control: 'boolean'
    },
    showProgress: {
      control: 'boolean'
    },
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      if: { arg: 'showProgress', truthy: true }
    },
    showAction: {
      control: 'boolean'
    }
  },
  parameters: {
    akariStoryPanelMaxWidth: 1120
  }
} satisfies Meta<typeof BackgroundTasksStory>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
