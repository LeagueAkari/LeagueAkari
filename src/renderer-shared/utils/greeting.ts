const gochiusaHeroineColors = [
  { name: 'Cocoa', color: '#f4a7b9' },
  { name: 'Chino', color: '#8ecae6' },
  { name: 'Rize', color: '#8e6bbf' },
  { name: 'Chiya', color: '#87c36b' },
  { name: 'Syaro', color: '#f2d36b' },
  { name: 'Maya', color: '#f39b5f' },
  { name: 'Megu', color: '#f0a9d8' }
]

const createGochiusaGreetingLog = (version: string) => {
  const blockFormat = gochiusaHeroineColors.map(() => '%c■').join('')
  const blockStyles = gochiusaHeroineColors.map(
    ({ color }) => `color: ${color}; font-size: 16px; margin-left: 4px;`
  )

  return {
    format: `%cLeague Akari v${version}, is the order a Rabbit?${blockFormat}`,
    styles: [
      'border-radius: 4px; background: #f9ceeb; color: #ff59cb; font-size: 16px; font-weight: bold; padding: 4px;',
      ...blockStyles
    ]
  }
}

export function greeting(version: string) {
  const log = createGochiusaGreetingLog(version)
  console.info(log.format, ...log.styles)
}
