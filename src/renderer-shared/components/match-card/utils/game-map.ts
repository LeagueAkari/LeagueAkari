// copied from rcp-plugin-lol-match-history
export const LOL_MAP_DOMAINS = {
  1: { minX: -650, minY: -83, maxX: 14076, maxY: 14522 },
  3: { minX: -500, minY: -500, maxX: 15e3, maxY: 15e3 },
  8: { minX: 0, minY: 0, maxX: 13987, maxY: 13987 },
  10: { minX: 0, minY: 0, maxX: 15398, maxY: 15398 },
  11: { minX: 0, minY: 0, maxX: 14820, maxY: 14881 },
  12: { minX: -28, minY: -19, maxX: 12849, maxY: 12858 },
  14: { minX: -28, minY: -19, maxX: 12849, maxY: 12858 },
  21: { minX: 0, minY: 0, maxX: 15e3, maxY: 15e3 },
  90: { minX: 0, minY: 0, maxX: 14820, maxY: 14881 },
}

export type MapId = keyof typeof LOL_MAP_DOMAINS

export function getMapDomain(mapId: MapId = 11) {
  return LOL_MAP_DOMAINS[mapId]
}

export function mapToImagePosition(
  x: number,
  y: number,
  imageWidth: number,
  imageHeight: number,
  mapId: MapId = 11,
  options?: { invertY?: boolean; clamp?: boolean },
) {
  const { invertY = true, clamp = true } = options || {}
  const domain = getMapDomain(mapId)

  const rangeX = domain.maxX - domain.minX
  const rangeY = domain.maxY - domain.minY

  if (rangeX === 0 || rangeY === 0) {
    return { left: 0, top: 0 }
  }

  const normalizedX = (x - domain.minX) / rangeX
  const normalizedY = invertY ? (domain.maxY - y) / rangeY : (y - domain.minY) / rangeY

  let left = normalizedX * imageWidth
  let top = normalizedY * imageHeight

  if (clamp) {
    if (left < 0) left = 0
    if (top < 0) top = 0
    if (left > imageWidth) left = imageWidth
    if (top > imageHeight) top = imageHeight
  }

  return { left, top }
}
