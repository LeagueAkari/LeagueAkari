import type { Meta, StoryObj } from '@storybook/vue3-vite'

import SettingsRowsDemo from './SettingsRowsDemo.vue'

const meta = {
  title: 'Renderer Shared/Light Components/Settings Rows',
  component: SettingsRowsDemo
} satisfies Meta<typeof SettingsRowsDemo>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}
