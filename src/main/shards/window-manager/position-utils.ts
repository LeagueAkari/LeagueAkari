import { tools } from '@leagueakari/league-akari-addons'
import '@leagueakari/league-akari-addons'
import { BrowserWindow, Display, Rectangle, screen } from 'electron'

export function rectsIntersect(rect1: Rectangle, rect2: Rectangle) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  )
}

export function rectDistance(rect1: Rectangle, rect2: Rectangle) {
  let dx = 0
  let dy = 0

  if (rect1.x > rect2.x + rect2.width) {
    dx = rect1.x - (rect2.x + rect2.width)
  } else if (rect2.x > rect1.x + rect1.width) {
    dx = rect2.x - (rect1.x + rect1.width)
  }

  if (rect1.y > rect2.y + rect2.height) {
    dy = rect1.y - (rect2.y + rect2.height)
  } else if (rect2.y > rect1.y + rect1.height) {
    dy = rect2.y - (rect1.y + rect1.height)
  }

  return Math.sqrt(dx * dx + dy * dy)
}

// 由于 chromium 的限制, 设置 bounds 并不会在最小化时生效。所以需要使用监听器来处理
const pendingRepositionWindows = new WeakSet<BrowserWindow>()

export function repositionWindowIfInvisible(win: BrowserWindow) {
  if (!win || win.isDestroyed()) return

  const winBounds = win.getBounds()

  const displays = screen.getAllDisplays()
  let nearestDisplay: Display | null = null
  let minDistance = Infinity

  for (const display of displays) {
    const distance = rectDistance(winBounds, display.workArea)
    if (distance < minDistance) {
      minDistance = distance
      nearestDisplay = display
    }
  }
  if (!nearestDisplay) return

  const workArea = nearestDisplay.workArea

  const fitsHorizontally = winBounds.width <= workArea.width
  const fitsVertically = winBounds.height <= workArea.height
  const sizeOK = fitsHorizontally && fitsVertically
  const visibleEnough = isWindowPartiallyVisible(win)

  if (visibleEnough && sizeOK) {
    return
  }

  const newWidth = Math.min(winBounds.width, workArea.width)
  const newHeight = Math.min(winBounds.height, workArea.height)

  let newX: number
  let newY: number

  // Horizontal adjustment
  if (newWidth < workArea.width) {
    newX = Math.min(Math.max(winBounds.x, workArea.x), workArea.x + workArea.width - newWidth)
  } else {
    // Window is as wide as the workArea → left‑align it.
    newX = workArea.x
  }

  // Vertical adjustment
  if (newHeight < workArea.height) {
    newY = Math.min(Math.max(winBounds.y, workArea.y), workArea.y + workArea.height - newHeight)
  } else {
    // Window is as tall as the workArea → top‑align it.
    newY = workArea.y
  }

  if (win.isMinimized()) {
    if (!pendingRepositionWindows.has(win)) {
      pendingRepositionWindows.add(win)
      win.once('restore', () => {
        pendingRepositionWindows.delete(win)
        win.setBounds({ x: newX, y: newY, width: newWidth, height: newHeight })
      })
    }
  } else {
    win.setBounds({ x: newX, y: newY, width: newWidth, height: newHeight })
  }
}

export function intersectionArea(rect1: Rectangle, rect2: Rectangle) {
  const xOverlap = Math.max(
    0,
    Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x)
  )
  const yOverlap = Math.max(
    0,
    Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y)
  )
  return xOverlap * yOverlap
}

export function repositionWindowWithSnap(
  win: BrowserWindow,
  targetBounds: Rectangle,
  placement: 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right' = 'top-left'
) {
  if (!win || win.isDestroyed()) return

  const winBounds = win.getBounds()

  const { x, y } = getPositionWithSnap(winBounds, targetBounds, placement)

  win.setPosition(x, y)
}

export function getPositionWithSnap(
  from: Rectangle,
  targetBounds: Rectangle,
  placement: 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right' = 'top-left'
) {
  const winBounds = from
  const display = screen.getDisplayMatching(targetBounds)
  const workArea = display.workArea
  let newX: number, newY: number

  switch (placement) {
    case 'top-left':
      // win 的右边对齐目标窗口左边，顶部对齐
      newX = targetBounds.x - winBounds.width
      newY = targetBounds.y
      break
    case 'bottom-left':
      // win 的右边对齐目标窗口左边，底部对齐
      newX = targetBounds.x - winBounds.width
      newY = targetBounds.y + targetBounds.height - winBounds.height
      break
    case 'top-right':
      // win 的左边对齐目标窗口右边，顶部对齐
      newX = targetBounds.x + targetBounds.width
      newY = targetBounds.y
      break
    case 'bottom-right':
      // win 的左边对齐目标窗口右边，底部对齐
      newX = targetBounds.x + targetBounds.width
      newY = targetBounds.y + targetBounds.height - winBounds.height
      break
  }

  // 如果新位置超出 workArea 的水平范围，则贴边 workArea
  if (newX < workArea.x) {
    newX = workArea.x
  } else if (newX + winBounds.width > workArea.x + workArea.width) {
    newX = workArea.x + workArea.width - winBounds.width
  }

  // 如果新位置超出 workArea 的垂直范围，则贴边 workArea
  if (newY < workArea.y) {
    newY = workArea.y
  } else if (newY + winBounds.height > workArea.y + workArea.height) {
    newY = workArea.y + workArea.height - winBounds.height
  }

  return { x: newX, y: newY }
}

export function isWindowPartiallyVisible(win: BrowserWindow, threshold = 0.98) {
  if (!win || win.isDestroyed()) return false

  const winBounds = win.getBounds()
  const winArea = winBounds.width * winBounds.height
  const displays = screen.getAllDisplays()

  let visibleArea = 0
  // 累加窗口与各显示器工作区相交的面积
  for (const display of displays) {
    visibleArea += intersectionArea(winBounds, display.workArea)
  }

  const visibleFraction = winArea > 0 ? visibleArea / winArea : 0
  return visibleFraction >= threshold
}

export function getCenteredRectangle(width: number, height: number) {
  let { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  let x = Math.round((screenWidth - width) / 2)
  let y = Math.round((screenHeight - height) / 2)

  return { x, y, width, height }
}

export function repositionToAlignLeagueClientUx(
  win: BrowserWindow,
  placement?: 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right'
) {
  const info = tools.getLeagueClientWindowPlacementInfo()
  if (info) {
    const { left, top, width, height } = info

    // League Client Ux 的窗口在最小化时会变为 { x: 0, y: 0, width: 134, height: 37 }
    if (width < 200 && height < 50) {
      return
    }

    repositionWindowWithSnap(win, { x: left, y: top, width, height }, placement)
  }
}
