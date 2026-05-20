import type { Meta, StoryObj } from '@storybook/vue3-vite'

import BasicComponentsDemo from './BasicComponentsDemo.vue'

const meta = {
  title: 'Renderer Shared/Light Components/Basic',
  component: BasicComponentsDemo
} satisfies Meta<typeof BasicComponentsDemo>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}
