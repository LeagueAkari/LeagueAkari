<template>
  <div class="flex h-full flex-col">
    <div class="flex items-end border-b border-black/10 px-6 dark:border-white/10">
      <div class="mr-6 mb-1 flex shrink-0 items-center gap-2 text-black/80 dark:text-white/80">
        <NIcon class="text-2xl" :component="icon" />
        <span class="text-base font-bold">{{ title }}</span>
      </div>
      <NTabs
        v-model:value="currentTab"
        :theme-overrides="{ tabGapMediumBar: '18px' }"
        size="medium"
      >
        <NTab v-for="tab in tabs" :key="tab.key" :name="tab.key" :tab="tab.name">
          <div class="flex items-center gap-1">
            <NIcon class="text-base" :component="tab.icon" />
            <span class="font-bold">{{ tab.name }}</span>
          </div>
        </NTab>
      </NTabs>
    </div>
    <div class="relative h-0 flex-1">
      <Transition :name="transitionType">
        <KeepAlive>
          <component :is="currentTabComponent" :key="currentTab" />
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NIcon, NTab, NTabs } from 'naive-ui'
import {
  Component as ComponentC,
  FunctionalComponent,
  computed,
  onActivated,
  ref,
  watch
} from 'vue'
import { useRoute, useRouter } from 'vue-router'

export interface TabConfig {
  key: string
  name: string
  icon: ComponentC | FunctionalComponent
  component: ComponentC
}

const props = defineProps<{
  icon: ComponentC | FunctionalComponent
  title: string
  tabs: TabConfig[]

  /**
   * 暂时强制要求路由必须提供 route name
   */
  routeName: string
  defaultTab?: string
}>()

const currentTab = ref(props.defaultTab ?? props.tabs[0]?.key ?? '')

const currentTabComponent = computed(() => {
  const tab = props.tabs.find((t) => t.key === currentTab.value)
  return tab?.component
})

const transitionType = ref<'move-from-right-fade' | 'move-from-left-fade'>('move-from-left-fade')
watch(
  () => currentTab.value,
  (cur, prev) => {
    if (!prev) {
      transitionType.value = 'move-from-right-fade'
      return
    }

    const curIndex = props.tabs.findIndex((tab) => tab.key === cur)
    const prevIndex = props.tabs.findIndex((tab) => tab.key === prev)

    if (curIndex > prevIndex) {
      transitionType.value = 'move-from-right-fade'
    } else {
      transitionType.value = 'move-from-left-fade'
    }
  },
  { immediate: true }
)

const route = useRoute()
const router = useRouter()

onActivated(() => {
  router.replace({ name: props.routeName, params: { section: currentTab.value } })
})

watch(
  () => currentTab.value,
  (cur) => {
    router.replace({ name: props.routeName, params: { section: cur } })
  },
  { immediate: true }
)

// route to section
watch(
  [() => route.name, () => route.params.section],
  ([name, section]) => {
    if (name !== props.routeName || !section) {
      return
    }

    currentTab.value = section as string
  },
  { immediate: true }
)
</script>

<style scoped>
.move-from-left-fade-enter-active {
  position: relative;
  transition:
    opacity 0.3s ease,
    right 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.move-from-left-fade-leave-active {
  position: absolute;
  transition:
    opacity 0.3s ease,
    right 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.move-from-left-fade-enter-from {
  right: 24px;
  opacity: 0;
}

.move-from-left-fade-leave-to {
  right: -24px;
  opacity: 0;
}

.move-from-left-fade-enter-to,
.move-from-left-fade-leave-from {
  right: 0;
  opacity: 1;
}

.move-from-right-fade-enter-active {
  position: relative;
  transition:
    opacity 0.3s ease,
    left 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.move-from-right-fade-leave-active {
  position: absolute;
  transition:
    opacity 0.3s ease,
    left 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.move-from-right-fade-enter-from {
  left: 24px;
  opacity: 0;
}

.move-from-right-fade-leave-to {
  left: -24px;
  opacity: 0;
}

.move-from-right-fade-enter-to,
.move-from-right-fade-leave-from {
  left: 0;
  opacity: 1;
}
</style>
