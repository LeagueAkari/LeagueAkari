export const DEFAULT_TAB_WIDTH = {
  min: 120,
  max: 180
} as const

export const TAB_MOTION = {
  presenceMs: 220,
  enterEase: 'cubic-bezier(0.16, 1, 0.3, 1)',
  leaveEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
  sortMs: 180,
  scrollMs: 160
} as const

export const TAB_INPUT = {
  dragDistancePx: 6,
  // Horizontal tab dragging must not scroll the page below the tab bar.
  dragScrollThreshold: { x: 0.2, y: 0 },
  // A pointer release after dragging must not activate the tab underneath it.
  clickGuardMs: 180,
  tooltipDelayMs: 600,
  scrollEdgeTolerancePx: 1,
  // DOM_DELTA_LINE supplies logical lines, not pixels; retain the existing wheel speed.
  wheelLinePx: 16
} as const
