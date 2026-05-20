import type { Meta, StoryObj } from '@storybook/vue3-vite'

import IconGalleryDemo from './IconGalleryDemo.vue'

const meta = {
  title: 'Renderer Shared/Light Components/Icons',
  component: IconGalleryDemo
} satisfies Meta<typeof IconGalleryDemo>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}
