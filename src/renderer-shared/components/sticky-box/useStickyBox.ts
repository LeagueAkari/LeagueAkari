// adapted from https://github.com/codecks-io/react-sticky-box
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { MaybeRefOrGetter, computed, ref, toRef, watch } from 'vue'

export type StickyBoxConfig = {
  offsetTop?: MaybeRefOrGetter<number>
  offsetBottom?: MaybeRefOrGetter<number>
  bottom?: MaybeRefOrGetter<boolean>
}

function getScrollParent(node: HTMLElement): HTMLElement | Window {
  let parent: HTMLElement | null = node
  while ((parent = parent.parentElement)) {
    const overflowY = getComputedStyle(parent, null).getPropertyValue('overflow-y')
    if (parent === document.body) return window
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return parent
    }
  }
  return window
}

function isOffsetElement(el: HTMLElement): boolean {
  return el.firstChild ? (el.firstChild as HTMLElement).offsetParent === el : true
}

function offsetTill(node: HTMLElement, target: HTMLElement): number {
  let current = node
  let offset = 0
  if (!isOffsetElement(target)) {
    offset += node.offsetTop - target.offsetTop
    target = node.offsetParent as HTMLElement
    offset += -node.offsetTop
  }
  do {
    offset += current.offsetTop
    current = current.offsetParent as HTMLElement
  } while (current && current !== target)
  return offset
}

function getParentNode(node: HTMLElement): HTMLElement | Window {
  let currentParent = node.parentElement
  while (currentParent) {
    const style = getComputedStyle(currentParent, null)
    if (style.getPropertyValue('display') !== 'contents') break
    currentParent = currentParent.parentElement
  }
  return currentParent ?? window
}

function getVerticalPadding(node: HTMLElement): { top: number; bottom: number } {
  const style = getComputedStyle(node, null)
  return {
    top: parseInt(style.getPropertyValue('padding-top'), 10),
    bottom: parseInt(style.getPropertyValue('padding-bottom'), 10)
  }
}

const enum MODES {
  stickyTop,
  stickyBottom,
  relative,
  small
}

type StickyMode = null | (typeof MODES)[keyof typeof MODES]

type LayoutResult = {
  mode: StickyMode
  relativeOffset: number
  position: string
  top?: string
  bottom?: string
}

export function useStickyBox(
  el: MaybeRefOrGetter<HTMLElement | null | undefined>,
  config: StickyBoxConfig = {}
): void {
  const elRef = toRef(el)
  const offsetTopRef = toRef(config.offsetTop ?? 0)
  const offsetBottomRef = toRef(config.offsetBottom ?? 0)
  const bottomRef = toRef(config.bottom ?? false)

  const scrollPaneRef = computed(() => (elRef.value ? getScrollParent(elRef.value) : null))
  const parentNodeRef = computed(() => (elRef.value ? getParentNode(elRef.value) : null))
  const scrollPaneIsWindow = computed(() => scrollPaneRef.value === window)
  const scrollPaneElementRef = computed(() =>
    scrollPaneRef.value === window ? undefined : (scrollPaneRef.value as HTMLElement)
  )
  const parentElementRef = computed(() =>
    parentNodeRef.value === window ? undefined : (parentNodeRef.value as HTMLElement)
  )

  const scrollPaneDims = ref({ height: 0, offsetTop: 0 })
  const parentDims = ref({ height: 0, naturalTop: 0 })
  const nodeDims = ref({ height: 0 })
  const latestScrollY = ref(0)

  const mode = ref<StickyMode>(null)
  const relativeOffset = ref(0)

  let isScheduled = false

  function measure() {
    const node = elRef.value
    const scrollPane = scrollPaneRef.value
    const parent = parentNodeRef.value
    if (!node || !scrollPane) return

    if (scrollPane === window) {
      scrollPaneDims.value = { height: window.innerHeight, offsetTop: 0 }
    } else {
      const rect = (scrollPane as HTMLElement).getBoundingClientRect()
      const isOffsetEl = isOffsetElement(scrollPane as HTMLElement)
      scrollPaneDims.value = {
        height: rect.height,
        offsetTop: isOffsetEl ? rect.top : 0
      }
    }

    if (parent && parent !== window) {
      const p = parent as HTMLElement
      const paddings = getVerticalPadding(p)
      const rect = p.getBoundingClientRect()
      const height = rect.height - paddings.top - paddings.bottom
      const naturalTop =
        offsetTill(p, scrollPane as HTMLElement) + paddings.top + scrollPaneDims.value.offsetTop
      parentDims.value = { height, naturalTop }
    } else {
      parentDims.value = { height: 0, naturalTop: 0 }
    }

    nodeDims.value = { height: node.getBoundingClientRect().height }
  }

  function computeLayout(forceMode?: StickyMode): LayoutResult | null {
    const node = elRef.value
    if (!node) return null
    const offsetTop = offsetTopRef.value
    const offsetBottom = offsetBottomRef.value
    const bottom = bottomRef.value
    const scrollPane = scrollPaneRef.value
    if (!scrollPane) return null

    const { height: viewPortHeight, offsetTop: scrollPaneOffset } = scrollPaneDims.value
    const { height: nodeHeight } = nodeDims.value
    const { height: parentHeight, naturalTop } = parentDims.value
    const scrollY = latestScrollY.value
    const prevMode = mode.value
    const prevRelativeOffset = relativeOffset.value

    const isBoxTooLow = (y: number): boolean =>
      y + scrollPaneOffset + viewPortHeight >=
      naturalTop + nodeHeight + prevRelativeOffset + offsetBottom

    const resolveMode = (): StickyMode => {
      if (forceMode !== undefined) return forceMode
      if (nodeHeight + offsetTop + offsetBottom <= viewPortHeight) return MODES.small
      return isBoxTooLow(scrollY) ? MODES.stickyBottom : MODES.relative
    }

    const nextMode = resolveMode()

    if (nextMode === MODES.small) {
      return {
        mode: MODES.small,
        relativeOffset: prevRelativeOffset,
        position: 'sticky',
        ...(bottom ? { bottom: `${offsetBottom}px` } : { top: `${offsetTop}px` })
      }
    }

    if (nextMode === MODES.relative) {
      const nextRelativeOffset =
        prevMode === MODES.stickyTop
          ? Math.max(0, scrollPaneOffset + scrollY - naturalTop + offsetTop)
          : Math.max(
              0,
              scrollPaneOffset + scrollY + viewPortHeight - (naturalTop + nodeHeight + offsetBottom)
            )
      return {
        mode: MODES.relative,
        relativeOffset: nextRelativeOffset,
        position: 'relative',
        ...(bottom
          ? { bottom: `${Math.max(0, parentHeight - nodeHeight - nextRelativeOffset)}px` }
          : { top: `${nextRelativeOffset}px` })
      }
    }

    const isBottom = nextMode === MODES.stickyBottom
    return {
      mode: nextMode,
      relativeOffset: prevRelativeOffset,
      position: 'sticky',
      ...(bottom
        ? {
            bottom: isBottom
              ? `${offsetBottom}px`
              : `${viewPortHeight - nodeHeight - offsetBottom}px`
          }
        : { top: isBottom ? `${viewPortHeight - nodeHeight - offsetBottom}px` : `${offsetTop}px` })
    }
  }

  function applyLayout(result: LayoutResult | null) {
    const node = elRef.value
    if (!node || !result) return
    mode.value = result.mode
    relativeOffset.value = result.relativeOffset
    node.style.position = result.position
    if (result.top !== undefined) {
      node.style.top = result.top
      node.style.bottom = ''
    }
    if (result.bottom !== undefined) {
      node.style.bottom = result.bottom
      node.style.top = ''
    }
  }

  function runLayout() {
    if (!elRef.value) return

    if (elRef.value) {
      measure()
      latestScrollY.value =
        scrollPaneRef.value === window
          ? window.scrollY
          : (scrollPaneRef.value as HTMLElement).scrollTop
      const result = computeLayout()
      applyLayout(result)
    }
  }

  function onScroll(scrollY: number) {
    if (scrollY === latestScrollY.value) return

    const scrollDelta = scrollY - latestScrollY.value
    latestScrollY.value = scrollY
    const node = elRef.value
    if (!node) return
    if (mode.value === MODES.small) return

    const offsetTop = offsetTopRef.value
    const offsetBottom = offsetBottomRef.value

    const { offsetTop: scrollPaneOffset, height: viewPortHeight } = scrollPaneDims.value
    const { naturalTop, height: parentHeight } = parentDims.value
    const { height: nodeHeight } = nodeDims.value

    const isBoxTooLow = (y: number): boolean =>
      y + scrollPaneOffset + viewPortHeight >=
      naturalTop + nodeHeight + relativeOffset.value + offsetBottom

    if (scrollDelta > 0) {
      if (mode.value === MODES.stickyTop) {
        if (scrollY + scrollPaneOffset + offsetTop > naturalTop) {
          const topOffset = Math.max(
            0,
            scrollPaneOffset + latestScrollY.value - naturalTop + offsetTop
          )
          const inRange =
            scrollY + scrollPaneOffset + viewPortHeight <=
            naturalTop + nodeHeight + topOffset + offsetBottom
          applyLayout(computeLayout(inRange ? MODES.relative : MODES.stickyBottom))
        }
      } else if (mode.value === MODES.relative && isBoxTooLow(scrollY)) {
        applyLayout(computeLayout(MODES.stickyBottom))
      }
    } else {
      if (mode.value === MODES.stickyBottom) {
        if (
          scrollPaneOffset + scrollY + viewPortHeight <
          naturalTop + parentHeight + offsetBottom
        ) {
          const bottomOffset = Math.max(
            0,
            scrollPaneOffset +
              latestScrollY.value +
              viewPortHeight -
              (naturalTop + nodeHeight + offsetBottom)
          )
          const inRange = scrollPaneOffset + scrollY + offsetTop >= naturalTop + bottomOffset
          applyLayout(computeLayout(inRange ? MODES.relative : MODES.stickyTop))
        }
      } else if (
        mode.value === MODES.relative &&
        scrollPaneOffset + scrollY + offsetTop < naturalTop + relativeOffset.value
      ) {
        applyLayout(computeLayout(MODES.stickyTop))
      }
    }
  }

  function handleScroll() {
    const scrollPane = scrollPaneRef.value
    if (!scrollPane) return
    const scrollY = scrollPane === window ? window.scrollY : (scrollPane as HTMLElement).scrollTop
    onScroll(scrollY)
  }

  function scheduleOnLayout() {
    if (isScheduled) return
    isScheduled = true
    requestAnimationFrame(() => {
      isScheduled = false
      runLayout()
    })
  }

  useEventListener(window, 'resize', () => {
    if (scrollPaneIsWindow.value) scheduleOnLayout()
  })
  useResizeObserver(scrollPaneElementRef, scheduleOnLayout)
  useResizeObserver(parentElementRef, scheduleOnLayout)
  useResizeObserver(elRef, scheduleOnLayout)
  useEventListener(scrollPaneRef, 'scroll', handleScroll, { passive: true })
  useEventListener(scrollPaneRef, 'mousewheel', handleScroll, { passive: true })

  watch(
    [elRef, offsetTopRef, offsetBottomRef, bottomRef],
    ([node]) => {
      if (!node) return

      if (scrollPaneRef.value) {
        measure()
        latestScrollY.value =
          scrollPaneRef.value === window
            ? window.scrollY
            : (scrollPaneRef.value as HTMLElement).scrollTop
      }

      mode.value = null
      runLayout()
    },
    { immediate: true }
  )
}
