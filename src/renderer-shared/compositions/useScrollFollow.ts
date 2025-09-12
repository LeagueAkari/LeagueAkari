import { useEventListener, useMutationObserver, useResizeObserver } from '@vueuse/core'
import {
  MaybeRefOrGetter,
  type Ref,
  onBeforeUnmount,
  readonly,
  ref,
  toValue,
  watchEffect
} from 'vue'

export interface AutoFollowOptions {
  /**
   * 与底部的像素阈值，处于该范围内才会自动跟随，实际上 0 也可以
   * @default 2
   */
  threshold?: number
  /**
   * 初始是否启用
   * @default true
   */
  enabled?: boolean
  /**
   * 滚动行为
   * @default 'instant'
   */
  behavior?: ScrollBehavior // 'auto' | 'instant | 'smooth'
}

export interface AutoFollowReturn {
  isEnabled: Ref<boolean>
  start: () => void
  stop: () => void
}

export function useAutoFollowScroll(
  elRef: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: AutoFollowOptions = {}
): AutoFollowReturn {
  const threshold = options.threshold ?? 4
  const behavior: ScrollBehavior = options.behavior ?? 'instant'

  const isEnabled = ref(options.enabled ?? true)
  const shouldFollow = ref(true)

  let stopScrollListener: (() => void) | null = null
  let stopResizeObserver: { stop: () => void } | null = null
  let stopMutationObserver: { stop: () => void } | null = null

  const isNearBottom = (el: HTMLElement): boolean => {
    return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
  }

  const attach = () => {
    const el = toValue(elRef)
    if (!el) return

    shouldFollow.value = isNearBottom(el)

    stopScrollListener = useEventListener(
      el,
      'scroll',
      () => {
        shouldFollow.value = isNearBottom(el)
      },
      { passive: true }
    )

    stopResizeObserver = useResizeObserver(el, () => {
      if (!isEnabled.value) return
      if (!shouldFollow.value) return
      el.scrollTo({ top: el.scrollHeight, behavior })
    })

    stopMutationObserver = useMutationObserver(
      el,
      () => {
        if (!isEnabled.value) return
        if (!shouldFollow.value) return
        el.scrollTo({ top: el.scrollHeight, behavior })
      },
      {
        childList: true,
        subtree: true,
        characterData: true
      }
    )

    if (isEnabled.value && shouldFollow.value) {
      requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior }))
    }
  }

  const detach = () => {
    stopScrollListener?.()
    stopResizeObserver?.stop()
    stopMutationObserver?.stop()
    stopScrollListener = stopResizeObserver = stopMutationObserver = null
  }

  watchEffect((onCleanup) => {
    const el = toValue(elRef)
    if (!el || !isEnabled.value) {
      detach()
      return
    }
    attach()
    onCleanup(detach)
  })

  const start = () => {
    if (isEnabled.value) return
    isEnabled.value = true
    const el = toValue(elRef)
    if (el && isNearBottom(el)) {
      shouldFollow.value = true
      el.scrollTo({ top: el.scrollHeight, behavior })
    }
  }

  const stop = () => {
    if (!isEnabled.value) return
    isEnabled.value = false
    detach()
  }

  onBeforeUnmount(() => {
    detach()
  })

  return {
    isEnabled: readonly(isEnabled),
    start,
    stop
  }
}
