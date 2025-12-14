<template>
  <div class="space-y-2">
    <div
      v-for="group in GROUPS.filter((g) => g.members.length > 1)"
      :key="group.sgpServerId"
      class="flex"
    >
      <div class="flex items-center">
        <div
          class="text-center text-sm px-2 py-0.5 rounded w-72px dark:text-white text-black"
          :class="group.themeColor"
        >
          {{ group.name }}
        </div>
        <div class="h-1px bg-black/20 dark:bg-white/20 w-24px"></div>
      </div>
      <div
        class="flex flex-wrap gap-1 text-xs text-white b-1 b-solid dark:b-white/20 b-black/20 rounded px-2 py-1 max-w-240px"
      >
        <div
          class="px-1 py-0.5 dark:bg-white/10 bg-black/5 rounded dark:text-white text-black"
          v-for="member in group.members"
          :key="member"
        >
          {{ member }}
        </div>
      </div>
    </div>

    <div class="mt-4 text-xs dark:text-white/60 text-black/60 flex items-center gap-1">
      <NIcon class="mr-1">
        <Info24Regular />
      </NIcon>
      <template v-for="(group, index) of GROUPS.filter((g) => g.members.length === 1)">
        <span class="dark:text-white/80 text-black/80 font-bold">{{ group.name }}</span>
        <span v-if="index < GROUPS.filter((g) => g.members.length === 1).length - 1">, </span>
      </template>
      仍保持各自独立。
    </div>

    <div class="text-xs dark:text-white/60 text-black/60 flex items-center gap-1">
      <NIcon class="mr-1">
        <Info24Regular />
      </NIcon>
      跨区域查询依赖 SGP 数据源。
    </div>
  </div>
</template>

<script setup lang="ts">
import { Info24Regular } from '@vicons/fluent'
import { NIcon } from 'naive-ui'

// 这个组件应该不用 i18n 了，毕竟都是中文名
const GROUPS = [
  {
    sgpServerId: 'TENCENT_NJ100',
    name: '联盟一区',
    themeColor: 'dark:bg-purple-900 bg-purple-300',
    members: ['祖安', '皮尔特沃夫', '巨神峰', '教育网', '男爵领域', '均衡教派', '影流', '守望之海']
  },
  {
    sgpServerId: 'TENCENT_GZ100',
    name: '联盟二区',
    themeColor: 'dark:bg-blue-900 bg-blue-300',
    members: ['卡拉曼达', '暗影岛', '征服之海', '诺克萨斯', '战争学院', '雷瑟守备']
  },
  {
    sgpServerId: 'TENCENT_CQ100',
    name: '联盟三区',
    themeColor: 'dark:bg-green-900 bg-green-500',
    members: ['班德尔城', '裁决之地', '水晶之痕', '钢铁烈阳', '皮城警备']
  },
  {
    sgpServerId: 'TENCENT_TJ100',
    name: '联盟四区',
    themeColor: 'dark:bg-yellow-900 bg-yellow-400',
    members: ['比尔吉沃特', '弗雷尔卓德', '扭曲丛林']
  },
  {
    sgpServerId: 'TENCENT_TJ101',
    name: '联盟五区',
    themeColor: 'dark:bg-red-900 bg-red-300',
    members: ['德玛西亚', '无畏先锋', '恕瑞玛', '巨龙之巢']
  },
  {
    sgpServerId: 'TENCENT_HN1',
    name: '艾欧尼亚',
    themeColor: 'dark:bg-purple-900 bg-purple-500',
    members: ['艾欧尼亚']
  },
  {
    sgpServerId: 'TENCENT_HN10',
    name: '黑色玫瑰',
    themeColor: 'dark:bg-purple-900 bg-purple-500',
    members: ['黑色玫瑰']
  },
  {
    sgpServerId: 'TENCENT_BGP2',
    name: '峡谷之巅',
    themeColor: 'dark:bg-blue-900 bg-blue-500',
    members: ['峡谷之巅']
  },
  {
    sgpServerId: 'TENCENT_PBE',
    name: '体验服',
    themeColor: 'dark:bg-green-900 bg-green-500',
    members: ['体验服']
  }
]
</script>
