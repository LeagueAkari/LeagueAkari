import type { Meta, StoryObj } from '@storybook/vue3-vite'

import MatchCardPrimitivesDemo from './MatchCardPrimitivesDemo.vue'

const meta = {
  title: 'Renderer Shared/Light Components/Match Card Primitives',
  component: MatchCardPrimitivesDemo
} satisfies Meta<typeof MatchCardPrimitivesDemo>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}
