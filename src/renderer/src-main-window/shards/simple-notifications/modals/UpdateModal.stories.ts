import type { AkariContactChannels } from '@shared/shards/akari-api'
import type { SelfUpdateReleaseInfo, UpdateProgressInfo } from '@shared/shards/self-update'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NButton } from 'naive-ui'
import { ref, watch } from 'vue'

import UpdateModal from './UpdateModal.vue'

const releaseDescription = `
## League Akari v1.6.0

这次更新集中在自动选择、对局信息展示和应用稳定性。

### 新增

- 自动选择英雄支持更清晰的顺序编辑器
- 对局卡片补充更多队伍和玩家信息
- 更新状态现在会显示在侧边栏

### 修复

- 修复部分网络环境下更新下载中断的问题
- 修复英文界面中少量文字溢出

> 建议在更新前结束正在进行的英雄联盟对局。
`

const release: SelfUpdateReleaseInfo = {
  version: 'v1.6.0',
  currentVersion: 'v1.5.1',
  publishedAt: '2026-07-26T00:00:00.000Z',
  description: releaseDescription,
  isNew: true,
  isUpdateSupported: true,
  artifact: {
    platform: 'win32',
    arch: 'x64',
    fileName: 'LeagueAkari-v1.6.0-win.7z',
    size: 128 * 1024 * 1024,
    downloadUrl: 'https://example.com/LeagueAkari-v1.6.0-win.7z',
    contentType: 'application/x-7z-compressed',
    sha256: null
  }
}

const downloadingProgress: UpdateProgressInfo = {
  phase: 'downloading',
  downloadingProgress: 0.42,
  averageDownloadSpeed: 8 * 1024 * 1024,
  downloadTimeLeft: 18,
  fileSize: release.artifact!.size
}

const waitingForRestartProgress: UpdateProgressInfo = {
  phase: 'waiting-for-restart',
  downloadingProgress: 1,
  averageDownloadSpeed: 0,
  downloadTimeLeft: 0,
  fileSize: release.artifact!.size
}

const downloadFailedProgress: UpdateProgressInfo = {
  phase: 'download-failed',
  downloadingProgress: 0.42,
  averageDownloadSpeed: 0,
  downloadTimeLeft: -1,
  fileSize: release.artifact!.size
}

const versionFeaturesRelease: SelfUpdateReleaseInfo = {
  ...release,
  version: release.currentVersion,
  isNew: false,
  artifact: null
}

const contactChannels: AkariContactChannels = {
  updatedAt: '2026-07-26T09:30:00+08:00',
  channels: [
    {
      id: 'qq-group',
      platform: 'qq',
      name: 'League Akari 反馈与问题交流总群',
      identifier: '123456789',
      url: 'https://example.com/qq-group',
      password: 'akari'
    },
    {
      id: 'website',
      platform: 'website',
      name: 'League Akari 项目主页与故障排查文档',
      identifier: 'league-akari.example.com/support/troubleshooting',
      url: 'https://example.com/league-akari',
      password: null
    }
  ]
}

const meta = {
  title: 'Main Window/Notifications/Update Modal',
  component: UpdateModal,
  args: {
    release,
    contactChannels,
    ignoreVersion: null,
    updateProgressInfo: null
  },
  render: (args) => ({
    components: { NButton, UpdateModal },
    setup() {
      const show = ref(true)
      const ignoreVersion = ref(args.ignoreVersion)
      const updateProgressInfo = ref(args.updateProgressInfo)

      watch(
        () => args.ignoreVersion,
        (value) => {
          ignoreVersion.value = value
        }
      )

      watch(
        () => args.updateProgressInfo,
        (value) => {
          updateProgressInfo.value = value
        }
      )

      const handleIgnoreVersion = (version: string, ignore: boolean) => {
        ignoreVersion.value = ignore ? version : null
      }

      const handleStartDownload = () => {
        updateProgressInfo.value = downloadingProgress
      }

      const handleCancelUpdate = () => {
        updateProgressInfo.value = null
      }

      const handleCloseAndUpdate = () => {
        show.value = false
      }

      return {
        args,
        show,
        ignoreVersion,
        updateProgressInfo,
        handleIgnoreVersion,
        handleStartDownload,
        handleCancelUpdate,
        handleCloseAndUpdate
      }
    },
    template: `
      <div class="flex min-h-64 items-center justify-center">
        <NButton secondary @click="show = true">重新打开更新弹窗</NButton>
        <UpdateModal
          v-model:show="show"
          :release="args.release"
          :contact-channels="args.contactChannels"
          :ignore-version="ignoreVersion"
          :update-progress-info="updateProgressInfo"
          @ignore-version="handleIgnoreVersion"
          @start-download="handleStartDownload"
          @cancel-update="handleCancelUpdate"
          @close-and-update="handleCloseAndUpdate"
        />
      </div>
    `
  }),
  parameters: {
    layout: 'fullscreen',
    akariStoryPanelMaxWidth: '100%'
  }
} satisfies Meta<typeof UpdateModal>

export default meta

type Story = StoryObj<typeof meta>

export const Available: Story = {}

export const IgnoredVersion: Story = {
  args: {
    ignoreVersion: release.version
  }
}

export const Downloading: Story = {
  args: {
    updateProgressInfo: downloadingProgress
  }
}

export const WaitingForRestart: Story = {
  args: {
    updateProgressInfo: waitingForRestartProgress
  }
}

export const DownloadFailed: Story = {
  args: {
    updateProgressInfo: downloadFailedProgress
  }
}

export const VersionFeatures: Story = {
  args: {
    release: versionFeaturesRelease
  }
}
