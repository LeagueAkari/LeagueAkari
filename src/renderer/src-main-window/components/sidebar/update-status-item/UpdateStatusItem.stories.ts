import type { UpdateProgressInfo } from '@shared/shards/self-update'
import type { LatestReleaseInfo } from '@shared/types/akari'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

import UpdateStatusItem from './UpdateStatusItem.vue'
import type { UpdateStatusDisplay } from './status'

const release: LatestReleaseInfo = {
  version: 'v1.6.0',
  currentVersion: 'v1.5.0',
  isNew: true,
  publishedAt: '2026-07-19T00:00:00.000Z',
  description: '',
  archiveFile: {
    name: 'LeagueAkari-v1.6.0-win.7z',
    size: 128 * 1024 * 1024,
    downloadUrl: 'https://example.com/LeagueAkari-v1.6.0-win.7z',
    contentType: 'application/x-7z-compressed'
  }
}

const availableStatus: UpdateStatusDisplay = {
  kind: 'available',
  phase: 'available',
  progress: 100
}

const downloadingStatus: UpdateStatusDisplay = {
  kind: 'downloading',
  phase: 'downloading',
  progress: 42
}

const downloadingProgress: UpdateProgressInfo = {
  phase: 'downloading',
  downloadingProgress: 0.42,
  averageDownloadSpeed: 8 * 1024 * 1024,
  downloadTimeLeft: 18,
  fileSize: release.archiveFile.size
}

const readyStatus: UpdateStatusDisplay = {
  kind: 'waiting-for-restart',
  phase: 'ready',
  progress: 100
}

const readyProgress: UpdateProgressInfo = {
  phase: 'waiting-for-restart',
  downloadingProgress: 1,
  averageDownloadSpeed: 0,
  downloadTimeLeft: 0,
  fileSize: release.archiveFile.size
}

const meta = {
  title: 'Main Window/Sidebar/Update Status',
  component: UpdateStatusItem,
  args: {
    status: availableStatus,
    release,
    updateProgressInfo: null,
    isCollapsed: false
  },
  render: (args) => ({
    components: { UpdateStatusItem },
    setup: () => ({ args }),
    template: `
      <div
        :style="{
          '--la-sidebar-width-collapsed': '52px',
          '--la-sidebar-width-expanded': '176px',
          '--la-sidebar-icon-height': '36px',
          '--la-sidebar-icon-horizontal-padding': '4px',
          width: args.isCollapsed ? '52px' : '176px',
          overflow: 'hidden',
          boxSizing: 'border-box',
          border: '1px solid var(--la-sidebar-border)',
          borderRadius: '9px',
          background: 'var(--la-sidebar-bg)'
        }"
      >
        <UpdateStatusItem v-bind="args" />
      </div>
    `
  }),
  parameters: {
    akariStoryPanelMaxWidth: 360
  }
} satisfies Meta<typeof UpdateStatusItem>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Downloading: Story = {
  args: {
    status: downloadingStatus,
    updateProgressInfo: downloadingProgress
  }
}

export const ReadyToRestart: Story = {
  args: {
    status: readyStatus,
    updateProgressInfo: readyProgress
  }
}

export const Collapsed: Story = {
  args: {
    status: readyStatus,
    updateProgressInfo: readyProgress,
    isCollapsed: true
  }
}
