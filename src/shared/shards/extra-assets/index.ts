// Existing resource subscription used by both the bench and the champion data window.
export const OPGG_ARAM_BALANCE_SYNC_NAMESPACE = 'champion-data-main/opgg'

export const gtimgUrl = {
  championIcon: (alias: string) => `https://game.gtimg.cn/images/lol/act/img/champion/${alias}.png`
}

export function isGtimgUrl(source: string) {
  try {
    const { hostname } = new URL(source, 'https://localhost')
    return (
      hostname === 'gtimg.cn' ||
      hostname.endsWith('.gtimg.cn') ||
      hostname === 'gtimg.com' ||
      hostname.endsWith('.gtimg.com')
    )
  } catch {
    return false
  }
}
