import type { Meta, StoryObj } from '@storybook/vue3-vite'

import ChampionDataTabsDemo from './ChampionDataTabsDemo.vue'

const meta = {
  title: 'Champion Data/Tabs',
  component: ChampionDataTabsDemo,
  parameters: { akariStoryPanelMaxWidth: 900 }
} satisfies Meta<typeof ChampionDataTabsDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Compact: Story = { args: { initialWidth: 480, overflow: true } }
export const Narrow: Story = { args: { initialWidth: 360, overflow: true } }
export const TierOnly: Story = { args: { initialWidth: 480, empty: true } }
export const FixedAndNonClosable: Story = { args: { multipleFixed: true } }
