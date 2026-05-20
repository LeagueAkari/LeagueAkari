import type { Meta, StoryObj } from '@storybook/vue3-vite'

import DataDisplayDemo from './DataDisplayDemo.vue'

const meta = {
  title: 'Renderer Shared/Light Components/Data Display',
  component: DataDisplayDemo
} satisfies Meta<typeof DataDisplayDemo>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}
