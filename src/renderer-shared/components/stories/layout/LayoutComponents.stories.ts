import type { Meta, StoryObj } from '@storybook/vue3-vite'

import LayoutComponentsDemo from './LayoutComponentsDemo.vue'

const meta = {
  title: 'Renderer Shared/Light Components/Layout',
  component: LayoutComponentsDemo
} satisfies Meta<typeof LayoutComponentsDemo>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}
