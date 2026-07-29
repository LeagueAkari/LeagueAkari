<template>
  <div class="flex h-full flex-col">
    <div class="flex items-end border-b border-black/10 px-6 dark:border-white/10">
      <div class="mr-6 mb-1 flex shrink-0 items-center gap-2 text-black/80 dark:text-white/80">
        <NIcon class="text-2xl" :component="icon" />
        <span class="text-base font-bold">{{ title }}</span>
      </div>
      <NTabs
        :value="currentTab"
        :theme-overrides="{ tabGapMediumBar: '18px' }"
        size="medium"
        @update:value="handleUserTabChange"
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
      <Transition :name="transitionType" :css="!transitionsDisabled">
        <KeepAlive>
          <component :is="currentTabComponent" :key="currentTab" />
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAkariNavigationBoundary } from '@renderer-shared/composables/useAkariNavigation'
import { NIcon, NTab, NTabs } from 'naive-ui'
import {
  Component as ComponentC,
  FunctionalComponent,
  computed,
  nextTick,
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
  disableTransition?: boolean

  /**
   * 暂时强制要求路由必须提供 route name
   */
  routeName: string
  defaultTab?: string
}>()

const currentTab = ref(props.defaultTab ?? props.tabs[0]?.key ?? '')
const navigationTransitionDisabled = ref(false)
const transitionsDisabled = computed(
  () => Boolean(props.disableTransition) || navigationTransitionDisabled.value
)

const currentTabComponent = computed(() => {
  const tab = props.tabs.find((t) => t.key === currentTab.value)
  return tab?.component
})

const transitionType = ref<'move-from-right-fade' | 'move-from-left-fade'>('move-from-left-fade')
watch(
  () => currentTab.value,
  (cur, prev) => {
    if (transitionsDisabled.value) {
      return
    }

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
let navigationActivationSequence = 0

type TabActivationSource = 'user' | 'route' | 'navigation'

const isKnownTab = (value: string) => props.tabs.some((tab) => tab.key === value)

const activateTab = async (value: string, source: TabActivationSource, signal?: AbortSignal) => {
  if (!isKnownTab(value)) {
    return false
  }

  const tabChanged = currentTab.value !== value
  const sequence = tabChanged && source !== 'user' ? ++navigationActivationSequence : null

  if (sequence !== null) {
    navigationTransitionDisabled.value = true
  }
  if (tabChanged) {
    currentTab.value = value
    await nextTick()
  }

  if (
    source !== 'route' &&
    (route.name !== props.routeName || route.params.section !== value) &&
    !signal?.aborted
  ) {
    await router.replace({ name: props.routeName, params: { section: value } })
    await nextTick()
  }

  if (sequence !== null && sequence === navigationActivationSequence) {
    navigationTransitionDisabled.value = false
    await nextTick()
  }

  return true
}

const handleUserTabChange = (value: string) => {
  void activateTab(value, 'user')
}

useAkariNavigationBoundary({
  scope: () => `main-page.${props.routeName}`,
  activate: async (destination, { signal }) => {
    if (typeof destination !== 'string') {
      return { status: 'unavailable', reason: 'invalid-page-tab' }
    }

    const activated = await activateTab(destination, 'navigation', signal)
    return activated ? { status: 'ready' } : { status: 'unavailable', reason: 'unknown-page-tab' }
  }
})

onActivated(() => {
  const section = route.params.section
  if (route.name === props.routeName && typeof section === 'string' && isKnownTab(section)) {
    void activateTab(section, 'route')
    return
  }

  void activateTab(currentTab.value, 'navigation')
})

// route to section
watch(
  [() => route.name, () => route.params.section],
  ([name, section]) => {
    if (name !== props.routeName || typeof section !== 'string') {
      return
    }

    void activateTab(section, 'route')
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
