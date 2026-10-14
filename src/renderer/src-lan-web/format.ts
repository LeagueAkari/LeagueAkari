export function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function decimal(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—'
}

export function duration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

export function relativeDate(timestamp: number, locale: string) {
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
    -Math.max(1, Math.round((Date.now() - timestamp) / 86_400_000)),
    'day'
  )
}

const zhQueueNames: Record<number, string> = {
  420: '排位赛 单排/双排',
  430: '匹配模式',
  440: '灵活排位',
  450: '极地大乱斗',
  480: '快速模式',
  490: '快速匹配',
  900: '无限乱斗',
  1700: '斗魂竞技场',
  1750: '斗魂竞技场',
  1900: '无限火力',
  2300: '神木之门'
}

export function queueName(queueId: number, fallback: string) {
  if (!navigator.language.toLowerCase().startsWith('zh')) return fallback
  return zhQueueNames[queueId] || fallback
}
