import { useResizeObserver, useScroll } from '@vueuse/core'
import { animate, useMotionValue } from 'motion-v'
import { type Ref, onBeforeUnmount, ref, watch } from 'vue'

import { TAB_INPUT, TAB_MOTION } from './tab-settings'

interface TabStripOptions {
  layout: Ref<HTMLElement | null>
  viewport: Ref<HTMLElement | null>
  addControl: Ref<HTMLElement | null>
  order: () => readonly string[]
  minWidth: () => number
  maxWidth: () => number
  resizeIdleMs: () => number
  activeElement: () => HTMLElement | null | undefined
  elements: () => HTMLElement[]
  dragging: Ref<boolean>
  leaving: Ref<boolean>
  reducedMotion: Ref<boolean>
}

/** The only owner of width measurements and horizontal scroll position. */
export function useTabStrip(options: TabStripOptions) {
  const { layout, viewport, addControl, dragging, leaving, reducedMotion } = options
  const width = ref(Math.max(options.minWidth(), options.maxWidth()))

  const {
    x: scrollX,
    arrivedState,
    measure
  } = useScroll(viewport, {
    offset: { left: TAB_INPUT.scrollEdgeTolerancePx }
  })

  const scroll = useMotionValue(0)
  let scrollTarget = 0
  let wheelScrolling = false

  const stopScrollWatch = scroll.on('change', (position) => {
    scrollX.value = position
  })

  const stopScroll = () => {
    scroll.stop()
    wheelScrolling = false
  }

  const animateScrollTo = (target: number) => {
    stopScroll()
    scroll.set(scrollX.value)
    scrollTarget = target

    if (reducedMotion.value) {
      scroll.set(target)
    } else {
      animate(scroll, target, { duration: TAB_MOTION.scrollMs / 1000, ease: 'easeOut' })
    }
  }

  const revealActive = (behavior: 'instant' | 'smooth' = 'instant') => {
    stopScroll()
    measure()

    const container = viewport.value
    const active = options.activeElement()

    // Let removal finish before moving to the newly selected neighbor.
    if (
      dragging.value ||
      leaving.value ||
      !container?.clientWidth ||
      !active ||
      !container.contains(active)
    ) {
      return
    }

    const bounds = container.getBoundingClientRect()
    const tabBounds = active.getBoundingClientRect()
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth)
    const fadeWidth =
      Number.parseFloat(getComputedStyle(container).getPropertyValue('--tab-edge-fade-width')) || 0
    const inset = Math.min(fadeWidth, Math.max(0, (bounds.width - tabBounds.width) / 2))
    const edge = TAB_INPUT.scrollEdgeTolerancePx

    // Keep the entire tab clear of the edge fades, including its action buttons.
    const left = bounds.left + (arrivedState.left ? 0 : inset)
    const right = bounds.right - (arrivedState.right ? 0 : inset)
    let target = scrollX.value

    if (tabBounds.left < left - edge) {
      target += tabBounds.left - left
    } else if (tabBounds.right > right + edge) {
      target += tabBounds.right - right
    }

    target = Math.min(maxScroll, Math.max(0, target))

    // Snap the final fractional pixel at either end; leave other rounding noise alone.
    if (target <= edge) {
      target = 0
    } else if (maxScroll - target <= edge) {
      target = maxScroll
    }

    if (Math.abs(target - scrollX.value) > edge || target === 0 || target === maxScroll) {
      if (behavior === 'smooth') {
        animateScrollTo(target)
      } else {
        scrollX.value = target
      }
    }

    measure()
  }

  let widthMeasured = false
  let pendingWidth = width.value
  let resizeFrame: number | null = null
  let stableSince = 0
  let previousBounds: number[] = []

  const stopResize = () => {
    if (resizeFrame !== null) {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = null
    }

    previousBounds = []
  }

  const resizeWhenSettled = (timestamp: number) => {
    const bounds = options.elements().flatMap((element) => {
      const rect = element.getBoundingClientRect()
      return [rect.left, rect.width]
    })

    // Include real movement from presence, sorting and scrolling before starting the idle period.
    const moving =
      dragging.value ||
      leaving.value ||
      bounds.length !== previousBounds.length ||
      bounds.some((value, index) => Math.abs(value - previousBounds[index]) > 0.01)

    if (moving) {
      stableSince = timestamp
    }

    previousBounds = bounds

    if (moving || timestamp - stableSince < options.resizeIdleMs()) {
      resizeFrame = requestAnimationFrame(resizeWhenSettled)
      return
    }

    resizeFrame = null
    previousBounds = []
    width.value = pendingWidth
    revealActive()
  }

  const resize = (defer = false) => {
    const container = layout.value
    const count = options.order().length

    if (!container?.clientWidth || !count) {
      stopResize()
      return
    }

    const gap = Number.parseFloat(getComputedStyle(container).columnGap) || 0
    const addWidth = addControl.value ? addControl.value.offsetWidth + gap : 0
    const available = container.clientWidth - addWidth - gap * (count - 1)
    pendingWidth = Math.max(options.minWidth(), Math.min(options.maxWidth(), available / count))

    // Opening tabs and the initial layout resize immediately. Closing keeps the settled width.
    if (!widthMeasured || !defer) {
      stopResize()
      widthMeasured = true
      width.value = pendingWidth
    } else if (pendingWidth === width.value) {
      stopResize()
    } else {
      stableSince = performance.now()

      if (resizeFrame === null) {
        resizeFrame = requestAnimationFrame(resizeWhenSettled)
      }
    }

    revealActive()
  }

  const handleWheel = (event: WheelEvent) => {
    const container = viewport.value

    if (!container) {
      return
    }

    // Native horizontal trackpad gestures and Ctrl+wheel zoom keep their native behavior.
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      stopScroll()
      return
    }

    const maxScroll = container.scrollWidth - container.clientWidth

    if (maxScroll <= 0 || event.deltaY === 0 || dragging.value) {
      return
    }

    let unit = 1

    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      unit = TAB_INPUT.wheelLinePx
    } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      unit = container.clientWidth
    }

    const delta = event.deltaY * unit
    const edge = TAB_INPUT.scrollEdgeTolerancePx

    if (
      (delta < 0 && container.scrollLeft <= edge) ||
      (delta > 0 && container.scrollLeft >= maxScroll - edge)
    ) {
      stopScroll()
      return
    }

    event.preventDefault()

    // Accumulate wheel gestures, but interrupt a tab reveal at its current position.
    const current = wheelScrolling && scroll.isAnimating() ? scrollTarget : container.scrollLeft

    animateScrollTo(Math.min(maxScroll, Math.max(0, current + delta)))
    wheelScrolling = true
  }

  watch(
    () => options.order().slice(),
    (ids, previousIds) => {
      const added = ids.some((id) => !previousIds.includes(id))
      const removed = previousIds.some((id) => !ids.includes(id))
      resize(!added && (removed || resizeFrame !== null))
    },
    { flush: 'post' }
  )
  watch([options.minWidth, options.maxWidth], () => resize(), { flush: 'post' })
  watch(options.resizeIdleMs, () => {
    if (resizeFrame !== null) resize(true)
  })
  watch(options.activeElement, () => revealActive('smooth'), { flush: 'post' })
  watch([leaving, dragging], () => revealActive(), { flush: 'post' })
  watch(reducedMotion, stopScroll)

  useResizeObserver(
    () => [layout.value, addControl.value].filter((el): el is HTMLElement => !!el),
    () => resize(resizeFrame !== null)
  )

  useResizeObserver(viewport, () => revealActive())

  // ResizeObserver runs before paint: follow the growing tab in the same frame.
  useResizeObserver(options.elements, () => revealActive())

  onBeforeUnmount(() => {
    stopResize()
    stopScroll()
    stopScrollWatch()
  })

  return { width, arrivedState, revealActive, handleWheel, stopScroll }
}
