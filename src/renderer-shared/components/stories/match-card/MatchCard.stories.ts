import type { Meta, StoryObj } from '@storybook/vue3-vite'

import MatchCardDemo from './MatchCardDemo.vue'

const meta = {
  title: 'Renderer Shared/Match History/Match Cards',
  component: MatchCardDemo
} satisfies Meta<typeof MatchCardDemo>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}
