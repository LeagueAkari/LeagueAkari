import { useMediaQuery } from '@vueuse/core'
import { animate, useMotionValue } from 'motion-v'
import { onBeforeUnmount } from 'vue'

interface SpringOptions {
  damping: number
  stiffness: number
}

const MOTION_PREVIEW_TIME_SCALE = 1
const scaleSpringForPreview = ({ damping, stiffness }: SpringOptions): SpringOptions => ({
  damping: damping / MOTION_PREVIEW_TIME_SCALE,
  stiffness: stiffness / MOTION_PREVIEW_TIME_SCALE ** 2
})

const LEADING_EDGE_SPRING = scaleSpringForPreview({
  damping: 52,
  stiffness: 900
})
const TRAILING_EDGE_SPRING = scaleSpringForPreview({
  damping: 40,
  stiffness: 520
})
// 0 starts both edges together; 1 waits until the leading edge reaches its target.
const TRAILING_EDGE_START_PROGRESS = 0.44
const INDICATOR_CANVAS_WIDTH = 8
const INDICATOR_END_WIDTH = 4
const INDICATOR_MIN_WAIST_WIDTH = 2.2
const INDICATOR_THINNING_DISTANCE = 100
const INDICATOR_TAPER_SEGMENTS = 4
const POSITION_SETTLE_THRESHOLD = 0.05
const VELOCITY_SETTLE_THRESHOLD = 0.5

export const useSidebarIndicatorMotion = () => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const topEdge = useMotionValue(0)
  const bottomEdge = useMotionValue(0)
  const restHeight = useMotionValue(0)

  let indicatorInitialized = false
  let indicatorTargetTop = 0
  let indicatorTargetBottom = 0
  let movementDirection: -1 | 1 = 1
  let motionSequence = 0
  let stopLeadingProgressWatch: (() => void) | undefined

  const getRenderedIndicatorBounds = () => {
    const rawTop = topEdge.get()
    const rawBottom = bottomEdge.get()
    const minimumHeight = restHeight.get()
    const rawHeight = rawBottom - rawTop

    if (rawHeight >= minimumHeight) {
      return { bottom: rawBottom, height: rawHeight, top: rawTop }
    }

    const center = (rawTop + rawBottom) / 2
    return {
      bottom: center + minimumHeight / 2,
      height: minimumHeight,
      top: center - minimumHeight / 2
    }
  }

  const getIndicatorStretchProgress = (height: number) => {
    const stretch = Math.max(0, height - restHeight.get())
    const progress = Math.min(stretch / INDICATOR_THINNING_DISTANCE, 1)
    return progress * progress * (3 - 2 * progress)
  }

  const getIndicatorThinningInfluence = (progress: number) => {
    const sine = Math.sin(Math.PI * progress)
    return sine * sine * (3 - 2 * sine)
  }

  const getIndicatorThinningInfluenceDerivative = (progress: number) => {
    const sine = Math.sin(Math.PI * progress)
    return 6 * sine * (1 - sine) * Math.PI * Math.cos(Math.PI * progress)
  }

  const getIndicatorWidths = (height: number) => {
    const restIndicatorHeight = restHeight.get()
    if (height <= 0 || restIndicatorHeight <= 0) {
      return { endWidth: 0, waistWidth: 0 }
    }

    const stretchProgress = getIndicatorStretchProgress(height)
    const waistWidth =
      INDICATOR_END_WIDTH + (INDICATOR_MIN_WAIST_WIDTH - INDICATOR_END_WIDTH) * stretchProgress

    return {
      endWidth: INDICATOR_END_WIDTH,
      waistWidth
    }
  }

  const createIndicatorPath = () => {
    const { bottom, height, top } = getRenderedIndicatorBounds()
    const centerX = INDICATOR_CANVAS_WIDTH / 2
    const { endWidth, waistWidth } = getIndicatorWidths(height)
    const endRadius = Math.min(endWidth / 2, height / 2)
    const right = centerX + endRadius
    const left = centerX - endRadius
    const topBody = top + endRadius
    const bottomBody = bottom - endRadius
    const bodyHeight = Math.max(0, bottomBody - topBody)
    const capControl = endRadius * 0.55228475

    const getBodyPoint = (progress: number, side: -1 | 1) => {
      const influence = getIndicatorThinningInfluence(progress)
      const width = endWidth + (waistWidth - endWidth) * influence

      return {
        x: centerX + (side * width) / 2,
        y: topBody + bodyHeight * progress
      }
    }

    const getBodyTangent = (progress: number, side: -1 | 1) => ({
      x: (side * (waistWidth - endWidth) * getIndicatorThinningInfluenceDerivative(progress)) / 2,
      y: bodyHeight
    })

    const createBodyCommands = (side: -1 | 1, from: number, to: number) => {
      const commands: string[] = []
      const step = (to - from) / INDICATOR_TAPER_SEGMENTS

      for (let index = 0; index < INDICATOR_TAPER_SEGMENTS; index += 1) {
        const startProgress = from + step * index
        const endProgress = startProgress + step
        const start = getBodyPoint(startProgress, side)
        const end = getBodyPoint(endProgress, side)
        const startTangent = getBodyTangent(startProgress, side)
        const endTangent = getBodyTangent(endProgress, side)
        const controlScale = step / 3

        commands.push(
          `C ${start.x + startTangent.x * controlScale} ${start.y + startTangent.y * controlScale}, ${end.x - endTangent.x * controlScale} ${end.y - endTangent.y * controlScale}, ${end.x} ${end.y}`
        )
      }

      return commands
    }

    return [
      `M ${centerX} ${top}`,
      `C ${centerX + capControl} ${top}, ${right} ${top + endRadius - capControl}, ${right} ${top + endRadius}`,
      ...createBodyCommands(1, 0, 1),
      `C ${right} ${bottom - endRadius + capControl}, ${centerX + capControl} ${bottom}, ${centerX} ${bottom}`,
      `C ${centerX - capControl} ${bottom}, ${left} ${bottom - endRadius + capControl}, ${left} ${bottom - endRadius}`,
      ...createBodyCommands(-1, 1, 0),
      `C ${left} ${top + endRadius - capControl}, ${centerX - capControl} ${top}, ${centerX} ${top}`,
      'Z'
    ].join(' ')
  }

  const renderedIndicatorPath = useMotionValue(createIndicatorPath())
  const updateIndicatorPath = () => renderedIndicatorPath.set(createIndicatorPath())
  const stopIndicatorPathUpdates = [
    topEdge.on('change', updateIndicatorPath),
    bottomEdge.on('change', updateIndicatorPath),
    restHeight.on('change', updateIndicatorPath)
  ]

  const snapIndicatorToTarget = () => {
    motionSequence += 1
    stopLeadingProgressWatch?.()
    stopLeadingProgressWatch = undefined
    topEdge.jump(indicatorTargetTop)
    bottomEdge.jump(indicatorTargetBottom)
  }

  const animateIndicatorEdge = (
    edge: typeof topEdge,
    target: number,
    { damping, stiffness }: SpringOptions,
    velocity = edge.getVelocity()
  ) =>
    animate(edge, target, {
      damping,
      restDelta: POSITION_SETTLE_THRESHOLD,
      restSpeed: VELOCITY_SETTLE_THRESHOLD,
      stiffness,
      type: 'spring',
      velocity
    })

  const animateIndicatorToTarget = () => {
    const sequence = ++motionSequence
    const topVelocity = topEdge.getVelocity()
    const bottomVelocity = bottomEdge.getVelocity()

    stopLeadingProgressWatch?.()
    stopLeadingProgressWatch = undefined
    topEdge.stop()
    bottomEdge.stop()

    const movingUp = movementDirection < 0
    const leadingEdge = movingUp ? topEdge : bottomEdge
    const leadingTarget = movingUp ? indicatorTargetTop : indicatorTargetBottom
    const leadingVelocity = movingUp ? topVelocity : bottomVelocity
    const trailingEdge = movingUp ? bottomEdge : topEdge
    const trailingTarget = movingUp ? indicatorTargetBottom : indicatorTargetTop
    const leadingStart = leadingEdge.get()
    const leadingDistance = leadingTarget - leadingStart
    let trailingStarted = false

    const startTrailingEdge = () => {
      if (trailingStarted || sequence !== motionSequence || prefersReducedMotion.value) {
        return
      }

      trailingStarted = true
      stopLeadingProgressWatch?.()
      stopLeadingProgressWatch = undefined
      animateIndicatorEdge(trailingEdge, trailingTarget, TRAILING_EDGE_SPRING, 0)
    }

    if (Math.abs(leadingDistance) <= POSITION_SETTLE_THRESHOLD) {
      startTrailingEdge()
    } else {
      stopLeadingProgressWatch = leadingEdge.on('change', (position) => {
        const progress = (position - leadingStart) / leadingDistance
        if (progress >= TRAILING_EDGE_START_PROGRESS) {
          startTrailingEdge()
        }
      })
    }

    const leadingAnimation = animateIndicatorEdge(
      leadingEdge,
      leadingTarget,
      LEADING_EDGE_SPRING,
      leadingVelocity
    )

    void leadingAnimation.then(startTrailingEdge)
  }

  const setIndicatorTarget = (top: number, height: number) => {
    const bottom = top + height
    const targetUnchanged =
      indicatorInitialized &&
      Math.abs(top - indicatorTargetTop) <= POSITION_SETTLE_THRESHOLD &&
      Math.abs(bottom - indicatorTargetBottom) <= POSITION_SETTLE_THRESHOLD

    indicatorTargetTop = top
    indicatorTargetBottom = bottom
    restHeight.jump(height)

    if (!indicatorInitialized || prefersReducedMotion.value) {
      indicatorInitialized = true
      snapIndicatorToTarget()
      return
    }

    if (targetUnchanged) {
      return
    }

    const currentCenter = (topEdge.get() + bottomEdge.get()) / 2
    const targetCenter = top + height / 2

    if (Math.abs(targetCenter - currentCenter) > POSITION_SETTLE_THRESHOLD) {
      movementDirection = targetCenter > currentCenter ? 1 : -1
    }

    animateIndicatorToTarget()
  }

  onBeforeUnmount(() => {
    motionSequence += 1
    stopLeadingProgressWatch?.()
    stopIndicatorPathUpdates.forEach((stop) => stop())
    topEdge.stop()
    bottomEdge.stop()
    topEdge.destroy()
    bottomEdge.destroy()
    restHeight.destroy()
    renderedIndicatorPath.destroy()
  })

  return {
    renderedIndicatorPath,
    setIndicatorTarget
  }
}
