<template>
  <Transition
    name="tran"
    :appear="appear"
    @enter="handleEnter"
    @leave="handleLeave"
    @after-enter="clearMaxWidth"
    @after-leave="clearMaxWidth"
  >
    <div v-if="show" class="horizontal-tran-wrapper">
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
    const targetWidth = getComputedStyle(el).width
    el.style.maxWidth = '0px'

    requestAnimationFrame(() => {
      el.style.maxWidth = targetWidth
    })
  }
}

const handleLeave = (el: Element) => {
  if (el instanceof HTMLElement || el instanceof SVGElement) {
    el.style.maxWidth = getComputedStyle(el).width

    // force reflow alternatively
    requestAnimationFrame(() => {
      el.style.maxWidth = '0px'
    })
  }
}

const clearMaxWidth = (el: Element) => {
  if (el instanceof HTMLElement || el instanceof SVGElement) {
    el.style.maxWidth = ''
  }
}
</script>

<style scoped>
.horizontal-tran-wrapper {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: clip;
}

.tran-enter-active,
.tran-leave-active {
  transition:
    opacity 0.3s ease,
    max-width 0.3s ease,
    transform 0.3s ease;
}

.tran-enter-from,
.tran-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.tran-enter-to,
.tran-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
