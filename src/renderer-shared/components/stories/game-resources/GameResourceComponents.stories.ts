import type { Meta, StoryObj } from '@storybook/vue3-vite'

import GameResourceComponentsDemo from './GameResourceComponentsDemo.vue'

const meta = {
  title: 'Renderer Shared/League Assets/Media and Displays',
  component: GameResourceComponentsDemo
} satisfies Meta<typeof GameResourceComponentsDemo>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}
