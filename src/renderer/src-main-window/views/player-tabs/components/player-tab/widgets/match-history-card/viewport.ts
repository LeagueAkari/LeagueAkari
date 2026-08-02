import { useDocumentVisibility, useIntersectionObserver } from '@vueuse/core'
import {
  type InjectionKey,
  type MaybeRefOrGetter,
  computed,
  inject,
  nextTick,
  onScopeDispose,
  provide,
  shallowRef,
  toRef,
  watch
} from 'vue'

import { MATCH_HISTORY_CARD_OVERSCAN_PX } from './constants'

type ViewportRegistration = {
  refresh: () => void
  unregister: () => void
}

type MatchHistoryCardViewportContext = {
  register: (
    element: HTMLElement,
    onNearViewportChange: (isNear: boolean) => void
  ) => ViewportRegistration
}

const MatchHistoryCardViewportContextKey: InjectionKey<MatchHistoryCardViewportContext> = Symbol(
  'MatchHistoryCardViewportContext'
)

const SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'overlay', 'scroll'])

function findScrollRoot(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement

  while (parent) {
    const { overflowY } = window.getComputedStyle(parent)

    if (SCROLLABLE_OVERFLOW_VALUES.has(overflowY)) {
      return parent
    }

    parent = parent.parentElement
  }

  return null
}

function isNearViewport(element: HTMLElement, root: HTMLElement | null) {
  if (element.getClientRects().length === 0) {
    return false
  }

  const elementRect = element.getBoundingClientRect()
  const rootRect = root?.getBoundingClientRect()
  const viewportTop = rootRect?.top ?? 0
  const viewportBottom = rootRect?.bottom ?? window.innerHeight

  return (
    elementRect.bottom >= viewportTop - MATCH_HISTORY_CARD_OVERSCAN_PX &&
    elementRect.top <= viewportBottom + MATCH_HISTORY_CARD_OVERSCAN_PX
  )
}

export function provideMatchHistoryCardViewport(options: { active: MaybeRefOrGetter<boolean> }) {
  const active = toRef(options.active)
  const documentVisibility = useDocumentVisibility()
  const shouldObserve = computed(() => active.value && documentVisibility.value === 'visible')
  const callbacks = new Map<HTMLElement, (isNear: boolean) => void>()
  const observedTargets = shallowRef<HTMLElement[]>([])
  const scrollRoot = shallowRef<HTMLElement | null>(null)

  let refreshPending = false

  const syncTargets = () => {
    observedTargets.value = [...callbacks.keys()]
  }

  const refreshObserver = () => {
    if (refreshPending) {
      return
    }

    refreshPending = true
    observedTargets.value = []
    void nextTick(() => {
      refreshPending = false
      syncTargets()
    })
  }

  const observer = useIntersectionObserver(
    observedTargets,
    (entries) => {
      if (!shouldObserve.value) {
        return
      }

      for (const entry of entries) {
        callbacks.get(entry.target as HTMLElement)?.(entry.isIntersecting)
      }
    },
    {
      root: scrollRoot,
      rootMargin: `${MATCH_HISTORY_CARD_OVERSCAN_PX}px 0px`,
      threshold: 0,
      immediate: false
    }
  )

  const notifyCurrentViewport = () => {
    if (!shouldObserve.value) {
      return
    }

    if (!observer.isSupported.value) {
      callbacks.forEach((callback) => callback(true))
      return
    }

    callbacks.forEach((callback, element) => {
      callback(isNearViewport(element, scrollRoot.value))
    })
  }

  const register: MatchHistoryCardViewportContext['register'] = (element, callback) => {
    if (callbacks.size === 0) {
      scrollRoot.value = findScrollRoot(element)
    }

    callbacks.set(element, callback)
    syncTargets()

    if (shouldObserve.value) {
      callback(observer.isSupported.value ? isNearViewport(element, scrollRoot.value) : true)
    }

    return {
      refresh: () => {
        if (!shouldObserve.value) {
          return
        }

        if (!observer.isSupported.value) {
          callback(true)
          return
        }

        refreshObserver()
      },
      unregister: () => {
        callbacks.delete(element)
        syncTargets()

        if (callbacks.size === 0) {
          scrollRoot.value = null
        }
      }
    }
  }

  watch(
    shouldObserve,
    (shouldStart) => {
      if (shouldStart) {
        notifyCurrentViewport()
        observer.resume()
        refreshObserver()
      } else {
        observer.pause()
      }
    },
    { flush: 'post', immediate: true }
  )

  onScopeDispose(() => {
    callbacks.clear()
    observedTargets.value = []
  })

  const context: MatchHistoryCardViewportContext = {
    register
  }

  provide(MatchHistoryCardViewportContextKey, context)

  return context
}

export function useMatchHistoryCardViewport() {
  const context = inject(MatchHistoryCardViewportContextKey)

  if (!context) {
    throw new Error('useMatchHistoryCardViewport must be used within a player tab component')
  }

  return context
}
