import { onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue'

export function useActivated() {
  const isActivated = ref(false)

  onMounted(() => (isActivated.value = true))
  onActivated(() => (isActivated.value = true))
  onDeactivated(() => (isActivated.value = false))
  onBeforeUnmount(() => (isActivated.value = false))

  return isActivated
}
