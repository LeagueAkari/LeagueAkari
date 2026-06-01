const gochiusaEasterEggSegments = [
  { text: 'is', color: '#fdd5d5' }, // Cocoa / ココア
  { text: 'the', color: '#cad8f5' }, // Chino / チノ
  { text: 'order', color: '#e6aee6' }, // Rize / リゼ
  { text: 'a', color: '#cfea89' }, // Chiya / 千夜
  { text: 'Ra', color: '#f5d292' }, // Syaro / シャロ
  { text: 'bb', color: '#a0ecd9' }, // Maya / マヤ
  { text: 'it', color: '#f1bca5' } // Megu / メグ
]

const createGochiusaGreetingLog = (version: string) => {
  const easterEggFormat = gochiusaEasterEggSegments
    .map(({ text }, index) => `%c${index > 0 && index < 5 ? ' ' : ''}${text}`)
    .join('')
  const sharedStyle = 'font-weight: bold;'
  const easterEggStyles = gochiusaEasterEggSegments.map(
    ({ color }) => `${sharedStyle} color: ${color};`
  )

  return {
    format: `League Akari v${version}, ${easterEggFormat}%c?`,
    styles: [...easterEggStyles, '']
  }
}

export function greeting(version: string) {
  const log = createGochiusaGreetingLog(version)
  console.info(log.format, ...log.styles)
}
