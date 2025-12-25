<template>
  <Transition
    name="tran"
    :appear="appear"
    @enter="handleEnter"
    @leave="handleLeave"
    @after-enter="clearMaxHeight"
    @after-leave="clearMaxHeight"
  >
    <div v-if="show" class="vertical-tran-wrapper">
      <slot></slot>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { show = true } = defineProps<{
  show?: boolean
  appear?: boolean
}>()

const handleEnter = (el: Element) => {
  if (el instanceof HTMLElement || el instanceof SVGElement) {
    el.style.maxHeight = '0px'

    requestAnimationFrame(() => {
      el.style.maxHeight = el.scrollHeight + 'px'
    })
  }
}

const handleLeave = (el: Element) => {
  if (el instanceof HTMLElement || el instanceof SVGElement) {
    el.style.maxHeight = el.scrollHeight + 'px'

    // force reflow alternatively
    requestAnimationFrame(() => {
      el.style.maxHeight = '0px'
    })
  }
}

const clearMaxHeight = (el: Element) => {
  if (el instanceof HTMLElement || el instanceof SVGElement) {
    el.style.maxHeight = ''
  }
}
</script>

<style scoped>
.vertical-tran-wrapper {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: clip;
}

.tran-enter-active,
.tran-leave-active {
  transition:
    opacity 0.3s ease,
    max-height 0.3s ease;
}

.tran-enter-from,
.tran-leave-to {
  opacity: 0;
}

.tran-enter-to,
.tran-leave-from {
  opacity: 1;
}
</style>
