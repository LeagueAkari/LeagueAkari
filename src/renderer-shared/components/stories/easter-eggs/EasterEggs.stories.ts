import type { Meta, StoryObj } from '@storybook/vue3-vite'

import EasterEggsDemo from './EasterEggsDemo.vue'

const meta = {
  title: 'Renderer Shared/Special/Easter Eggs',
  component: EasterEggsDemo
} satisfies Meta<typeof EasterEggsDemo>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}
