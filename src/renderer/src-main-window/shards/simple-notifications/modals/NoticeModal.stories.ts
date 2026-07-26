import type { AkariContactChannels, AkariNotice } from '@shared/shards/akari-api'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NButton } from 'naive-ui'
import { ref, watch } from 'vue'

import NoticeModal from './NoticeModal.vue'

const noticeContent = `
## League Akari 服务公告

近期我们会对远端服务进行一次例行维护，维护期间部分在线数据可能短暂不可用。

### 可能受影响的功能

- 版本更新与公告拉取
- 自动选择配置同步
- 跨区战绩查询

### 本地功能

已经保存到本地的设置与基础功能不受影响，无需提前退出应用。

> 如果维护结束后仍无法连接，请重启 League Akari 后再试。
`

const notice: AkariNotice = {
  revision: 'notice-2026-07-26',
  language: 'zh-CN',
  severity: 'medium',
  summary: '远端服务例行维护说明',
  contentType: 'text/markdown',
  content: noticeContent,
  updatedAt: '2026-07-26T09:30:00+08:00'
}

const contactChannels: AkariContactChannels = {
  updatedAt: '2026-07-26T09:30:00+08:00',
  channels: [
    {
      id: 'qq-group',
      platform: 'qq',
      name: 'League Akari 交流群',
      identifier: '123456789',
      url: 'https://example.com/qq-group',
      password: 'akari'
    },
    {
      id: 'discord',
      platform: 'discord',
      name: 'League Akari Discord',
      identifier: 'discord.gg/league-akari',
      url: 'https://example.com/discord',
      password: null
    },
    {
      id: 'website',
      platform: 'website',
      name: '项目主页',
      identifier: 'league-akari.example.com',
      url: 'https://example.com/league-akari',
      password: null
    }
  ]
}

const meta = {
  title: 'Main Window/Notifications/Notice Modal',
  component: NoticeModal,
  args: {
    notice,
    contactChannels,
    hasRead: false
  },
  render: (args) => ({
    components: { NButton, NoticeModal },
    setup() {
      const show = ref(true)
      const hasRead = ref(args.hasRead)

      watch(
        () => args.hasRead,
        (value) => {
          hasRead.value = value
        }
      )

      const handleRead = () => {
        hasRead.value = true
        show.value = false
      }

      return {
        args,
        show,
        hasRead,
        handleRead
      }
    },
    template: `
      <div class="flex min-h-64 items-center justify-center">
        <NButton secondary @click="show = true">重新打开公告弹窗</NButton>
        <NoticeModal
          v-model:show="show"
          :notice="args.notice"
          :contact-channels="args.contactChannels"
          :has-read="hasRead"
          @read="handleRead"
        />
      </div>
    `
  }),
  parameters: {
    layout: 'fullscreen',
    akariStoryPanelMaxWidth: '100%'
  }
} satisfies Meta<typeof NoticeModal>

export default meta

type Story = StoryObj<typeof meta>

export const Unread: Story = {}

export const Read: Story = {
  args: {
    hasRead: true
  }
}

export const WithoutContacts: Story = {
  args: {
    contactChannels: null
  }
}
