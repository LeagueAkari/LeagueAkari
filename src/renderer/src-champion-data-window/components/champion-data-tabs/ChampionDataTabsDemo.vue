<template>
  <div class="flex flex-col gap-7 py-4">
    <div class="flex items-start justify-between gap-4">
      <div>
        <div class="mb-2 text-xs font-medium tracking-widest text-sky-600 dark:text-sky-300">
          CHAMPION DATA
        </div>
        <div class="text-xl font-semibold">英雄数据 · 标签栏</div>
        <div class="mt-2 text-sm text-black/50 dark:text-white/50">
          梯队常驻，英雄自由排列。每个页面独立刷新。
        </div>
      </div>
      <NButton size="small" secondary @click="reset">重置演示</NButton>
    </div>

    <div class="flex flex-wrap items-center gap-3 text-xs text-black/50 dark:text-white/50">
      <span>预览宽度</span>
      <NRadioGroup v-model:value="width" size="small">
        <NRadioButton :value="760">宽敞 · 760</NRadioButton>
        <NRadioButton :value="480">紧凑 · 480</NRadioButton>
        <NRadioButton :value="360">窄窗 · 360</NRadioButton>
      </NRadioGroup>
      <NButton size="tiny" quaternary @click="addChampion">添加英雄</NButton>
    </div>

    <div
      class="max-w-full overflow-hidden rounded-lg border border-solid border-black/10 bg-(--la-card-surface-95) shadow-sm dark:border-white/10"
      :style="{ width: `${width}px` }"
    >
      <div
        class="flex items-center justify-between border-0 border-b border-solid border-black/5 px-3 py-2 dark:border-white/5"
      >
        <span class="text-xs font-semibold text-sky-600 dark:text-sky-300">OP.GG</span>
        <span class="text-xs text-black/40 dark:text-white/40">召唤师峡谷 · 翡翠及以上</span>
      </div>
      <TabBar v-model:active-id="activeId" :tabs="displayTabs" @reorder="reorder">
        <template #icon="{ tab }">
          <ChampionIcon
            v-if="championIdFor(tab.id) !== undefined"
            :champion-id="championIdFor(tab.id)!"
            class="size-3.5! rounded"
          />
          <component :is="tab.icon" v-else-if="tab.icon" class="size-3.5" />
        </template>
      </TabBar>
      <div
        class="flex h-40 flex-col items-center justify-center gap-2 text-black/35 dark:text-white/35"
      >
        <span class="text-sm text-black/65 dark:text-white/65">{{ activeName }}</span>
        <span class="text-xs">内容由外部页面呈现</span>
      </div>
    </div>

    <div class="flex flex-col gap-2 text-xs text-black/45 dark:text-white/45">
      <div>拖动英雄名称排序 · 滚轮横向浏览</div>
      <div>键盘：方向键切换页面；聚焦英雄名称后按空格、方向键、空格完成排序。</div>
      <div class="text-sky-700 dark:text-sky-300" aria-live="polite">{{ lastAction }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NRadioButton, NRadioGroup } from 'naive-ui'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import Refresh from '@vicons/ionicons5/es/Refresh'
import Close from '@vicons/ionicons5/es/Close'
import Podium from '@vicons/ionicons5/es/PodiumOutline'
import StatsChart from '@vicons/ionicons5/es/StatsChart'
import { computed, markRaw, onBeforeUnmount, ref } from 'vue'

import { TabBar, type TabBarTab, type TabBarTabReorder } from '@renderer-shared/components/tab-bar'

const props = withDefaults(
  defineProps<{
    initialWidth?: number
    overflow?: boolean
    empty?: boolean
    multipleFixed?: boolean
  }>(),
  { initialWidth: 760 }
)
const examples: (TabBarTab & { championId: number })[] = [
  { id: 'khazix', championId: 121, name: '卡兹克·虚空掠夺者·终极进化形态' },
  { id: 'ahri', championId: 103, name: '阿狸' },
  { id: 'garen', championId: 86, name: '盖伦' },
  { id: 'aurelion-sol', championId: 136, name: '奥瑞利安·索尔' },
  { id: 'jinx', championId: 222, name: '金克丝' },
  { id: 'thresh', championId: 412, name: '锤石' },
  { id: 'lux', championId: 99, name: '拉克丝' }
]
const width = ref(props.initialWidth)
const tabs = ref<TabBarTab[]>([])
const activeId = ref('tier')
const lastAction = ref('梯队页固定在左侧，不参与排序。')
const loadingIds = ref(new Set<string>())
const displayTabs = computed(() =>
  tabs.value.map((tab) => ({
    ...tab,
    actions: [
      {
        id: 'refresh',
        icon: markRaw(Refresh),
        label: `刷新${tab.name}`,
        loading: loadingIds.value.has(tab.id),
        onClick: () => refresh(tab.id)
      },
      {
        id: 'close',
        kind: 'close' as const,
        icon: markRaw(Close),
        label: `关闭${tab.name}`,
        onClick: () => close(tab.id)
      }
    ]
  }))
)
const timers = new Set<ReturnType<typeof setTimeout>>()
const activeName = computed(() => tabs.value.find((tab) => tab.id === activeId.value)?.name)

function championIdFor(id: string) {
  return examples.find((tab) => tab.id === id)?.championId
}

function reset() {
  timers.forEach(clearTimeout)
  timers.clear()
  loadingIds.value.clear()
  tabs.value = [
    { id: 'tier', name: '梯队', icon: markRaw(Podium), closable: false, fixedPosition: 0 },
    ...(props.multipleFixed
      ? [
          {
            id: 'overview',
            name: '版本概览',
            icon: markRaw(StatsChart),
            closable: false,
            fixedPosition: 1
          }
        ]
      : []),
    ...(props.empty ? [] : examples.slice(0, props.overflow ? 7 : 3).map((tab) => ({ ...tab })))
  ]
  if (props.multipleFixed) tabs.value.find((tab) => tab.id === 'ahri')!.closable = false
  activeId.value = props.empty ? 'tier' : 'khazix'
  lastAction.value = '梯队页固定在左侧，不参与排序。'
}

function addChampion() {
  const next = examples.find((example) => !tabs.value.some((tab) => tab.id === example.id))
  if (!next) return
  tabs.value.push({ ...next })
  activeId.value = next.id
}

function close(id: string) {
  const index = tabs.value.findIndex((tab) => tab.id === id)
  if (index < 0 || tabs.value[index].closable === false) return
  const [removed] = tabs.value.splice(index, 1)
  tabs.value.forEach((tab, index) => {
    if (tab.fixedPosition !== undefined) tab.fixedPosition = index
  })
  if (activeId.value === id)
    activeId.value = tabs.value[index]?.id ?? tabs.value[index - 1]?.id ?? 'tier'
  lastAction.value = `已关闭 ${removed.name}`
}

function refresh(id: string) {
  const tab = tabs.value.find((tab) => tab.id === id)
  if (!tab) return
  loadingIds.value.add(id)
  lastAction.value = `仅刷新 ${tab.name}`
  const timer = setTimeout(() => {
    loadingIds.value.delete(id)
    timers.delete(timer)
  }, 1100)
  timers.add(timer)
}

function reorder({ fromIndex, toIndex }: TabBarTabReorder) {
  const next = [...tabs.value]
  const [tab] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, tab)
  tabs.value = next
  lastAction.value = `英雄顺序：${next.map((item) => item.name).join(' → ')}`
}

reset()
onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>
